import { NextResponse } from "next/server";
import { attachAnonymousSession, getAnonymousSession } from "@/lib/anonymous-session";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const categories = new Set(["Aura pura", "Vibe", "Estilo", "Caos"]);

function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  const session = getAnonymousSession(request);
  const rate = checkRateLimit(`bid:${getClientIp(request)}:${session.id}`, 12, 60_000);
  if (!rate.allowed) {
    return attachAnonymousSession(NextResponse.json({ error: `Demasiadas ofertas. Probá de nuevo en ${rate.retryAfter}s.` }, { status: 429 }), session.id);
  }

  try {
    const body = await request.json() as {
      seasonId?: string;
      handle?: string;
      targetUrl?: string;
      title?: string;
      category?: string;
      bid?: number;
      initials?: string;
      tone?: string;
      clicks?: number;
    };
    const handle = body.handle?.trim() || "";
    const targetUrl = body.targetUrl?.trim() || "";
    const bid = Number(body.bid);
    if (!body.seasonId || !/^[0-9a-f-]{36}$/i.test(body.seasonId) || !/^[a-zA-Z0-9_.-]{1,32}$/.test(handle) || !/^https?:\/\/[^\s]{4,500}$/i.test(targetUrl) || !Number.isInteger(bid) || bid < 1 || bid > 100_000_000 || !categories.has(body.category || "")) {
      return attachAnonymousSession(NextResponse.json({ error: "Datos de oferta no válidos." }, { status: 400 }), session.id);
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) return attachAnonymousSession(NextResponse.json({ error: "Supabase no está configurado en el servidor." }, { status: 503 }), session.id);

    const { data: leader } = await supabase
      .from("aura_entries")
      .select("handle")
      .eq("season_id", body.seasonId)
      .order("bid_points", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: entryData, error: entryError } = await supabase.rpc("place_aura_bid", {
      p_season_id: body.seasonId,
      p_handle: handle,
      p_target_url: targetUrl,
      p_title: body.title?.trim().slice(0, 120) || "Aura recién desbloqueada",
      p_category: body.category,
      p_bid_points: bid,
      p_initials: body.initials?.trim().slice(0, 2).toUpperCase() || handle.slice(0, 2).toUpperCase(),
      p_tone: body.tone?.trim().slice(0, 20) || "violet",
      p_clicks: Number.isInteger(body.clicks) && Number(body.clicks) >= 0 ? Number(body.clicks) : 0,
      p_age_label: "ahora",
    });
    if (entryError || !entryData) {
      const message = entryError?.message?.includes("OUTBID_REQUIRED") ? "La oferta actual subió; actualizá el tablero e intentá de nuevo." : "No se pudo guardar la oferta.";
      return attachAnonymousSession(NextResponse.json({ error: message }, { status: 409 }), session.id);
    }

    const entry = Array.isArray(entryData) ? entryData[0] : entryData;
    const activityText = `compró +${bid.toLocaleString("en-US")} aura y desafió a ${leader?.handle || "el tablero"}`;
    const { data: activityData } = await supabase.from("aura_activities").insert({
      season_id: body.seasonId,
      handle,
      activity_text: activityText,
      bid_points: bid,
      age_label: "ahora",
    }).select("*").single();

    return attachAnonymousSession(NextResponse.json({ entry, activity: activityData }), session.id);
  } catch {
    return attachAnonymousSession(NextResponse.json({ error: "No se pudo procesar la oferta." }, { status: 500 }), session.id);
  }
}
