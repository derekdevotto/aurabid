import { NextResponse } from "next/server";
import { attachAnonymousSession, getAnonymousSession } from "@/lib/anonymous-session";
import { checkRateLimit } from "@/lib/rate-limit";
import { getPayPalAccessToken, paypalApiUrl } from "@/lib/paypal";

const allowedPacks = new Set([100, 500, 1000]);

export async function POST(request: Request) {
  const session = getAnonymousSession(request);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const rate = checkRateLimit(`paypal-order:${ip}`, 8, 60_000);
  if (!rate.allowed) return attachAnonymousSession(NextResponse.json({ error: `Demasiadas órdenes. Probá de nuevo en ${rate.retryAfter}s.` }, { status: 429 }), session.id);
  try {
    const body = await request.json() as { points?: number };
    const points = Number(body.points);
    if (!allowedPacks.has(points)) return attachAnonymousSession(NextResponse.json({ error: "Paquete de aura no válido." }, { status: 400 }), session.id);

    const accessToken = await getPayPalAccessToken();
    const response = await fetch(paypalApiUrl("/v2/checkout/orders"), {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "PayPal-Request-Id": crypto.randomUUID() },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          custom_id: `aura-pack-${points}`,
          description: `${points} aura points para AuraBid`,
          amount: { currency_code: "USD", value: (points / 100).toFixed(2) },
        }],
        application_context: { brand_name: "AuraBid", user_action: "PAY_NOW", shipping_preference: "NO_SHIPPING" },
      }),
    });
    const data = await response.json() as { id?: string; message?: string; details?: unknown[] };
    if (!response.ok || !data.id) return attachAnonymousSession(NextResponse.json({ error: data.message || "PayPal no pudo crear la orden.", details: data.details }, { status: response.status || 502 }), session.id);
    return attachAnonymousSession(NextResponse.json({ id: data.id }), session.id);
  } catch (error) {
    return attachAnonymousSession(NextResponse.json({ error: error instanceof Error ? error.message : "Error interno de PayPal." }, { status: 500 }), session.id);
  }
}
