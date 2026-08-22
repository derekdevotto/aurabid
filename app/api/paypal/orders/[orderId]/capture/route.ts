import { NextResponse } from "next/server";
import { attachAnonymousSession, getAnonymousSession } from "@/lib/anonymous-session";
import { checkRateLimit } from "@/lib/rate-limit";
import { getPayPalAccessToken, paypalApiUrl } from "@/lib/paypal";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const session = getAnonymousSession(request);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const rate = checkRateLimit(`paypal-capture:${ip}:${session.id}`, 8, 60_000);
  if (!rate.allowed) return attachAnonymousSession(NextResponse.json({ error: `Demasiados intentos. Probá de nuevo en ${rate.retryAfter}s.` }, { status: 429 }), session.id);

  try {
    const { orderId } = await context.params;
    if (!orderId || !/^[A-Z0-9-]+$/i.test(orderId)) return attachAnonymousSession(NextResponse.json({ error: "Order ID no válido." }, { status: 400 }), session.id);
    const supabase = getSupabaseServerClient({ requireServiceRole: true });
    if (!supabase) return attachAnonymousSession(NextResponse.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." }, { status: 503 }), session.id);

    const { data: processedPayment } = await supabase
      .from("aura_billing_events")
      .select("points")
      .eq("paypal_order_id", orderId)
      .maybeSingle();
    if (processedPayment) {
      const { data: wallet } = await supabase.from("aura_wallets").select("balance_points").eq("session_id", session.id).maybeSingle();
      return attachAnonymousSession(NextResponse.json({ id: orderId, status: "COMPLETED", points: 0, balance_points: wallet?.balance_points || 0 }), session.id);
    }

    const accessToken = await getPayPalAccessToken();
    const response = await fetch(paypalApiUrl(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`), {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "PayPal-Request-Id": crypto.randomUUID() },
      body: "{}",
    });
    const data = await response.json() as {
      status?: string;
      id?: string;
      message?: string;
      purchase_units?: Array<{
        custom_id?: string;
        amount?: { value?: string; currency_code?: string };
        payments?: { captures?: Array<{ id?: string; status?: string; amount?: { value?: string; currency_code?: string } }> };
      }>;
    };
    if (!response.ok) return attachAnonymousSession(NextResponse.json({ error: data.message || "PayPal no pudo capturar la orden." }, { status: response.status || 502 }), session.id);

    const purchaseUnit = data.purchase_units?.[0];
    const capture = purchaseUnit?.payments?.captures?.[0];
    const points = Number(purchaseUnit?.custom_id?.replace("aura-pack-", ""));
    const amount = Number(capture?.amount?.value || purchaseUnit?.amount?.value);
    if (data.status !== "COMPLETED" || capture?.status !== "COMPLETED" || ![100, 500, 1000].includes(points) || capture?.amount?.currency_code !== "USD" || amount !== points / 100) {
      return attachAnonymousSession(NextResponse.json({ error: "La captura de PayPal no pudo validarse." }, { status: 502 }), session.id);
    }

    const { data: creditData, error: creditError } = await supabase.rpc("credit_paypal_capture", {
      p_paypal_order_id: orderId,
      p_paypal_capture_id: capture.id || null,
      p_session_id: session.id,
      p_points: points,
      p_amount_usd: amount,
      p_status: "COMPLETED",
    });
    if (creditError || !creditData) return attachAnonymousSession(NextResponse.json({ error: "El pago fue capturado, pero no se pudo acreditar el saldo. Conservá este ID: " + orderId }, { status: 503 }), session.id);
    const credit = Array.isArray(creditData) ? creditData[0] : creditData;
    return attachAnonymousSession(NextResponse.json({ id: data.id, status: data.status, points: credit.credited_points, balance_points: credit.balance_points }), session.id);
  } catch (error) {
    return attachAnonymousSession(NextResponse.json({ error: error instanceof Error ? error.message : "Error interno de PayPal." }, { status: 500 }), session.id);
  }
}
