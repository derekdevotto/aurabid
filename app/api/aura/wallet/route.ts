import { NextResponse } from "next/server";
import { attachAnonymousSession, getAnonymousSession } from "@/lib/anonymous-session";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const session = getAnonymousSession(request);
  const supabase = getSupabaseServerClient({ requireServiceRole: true });
  if (!supabase) {
    return attachAnonymousSession(NextResponse.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." }, { status: 503 }), session.id);
  }

  const { data, error } = await supabase
    .from("aura_wallets")
    .select("balance_points")
    .eq("session_id", session.id)
    .maybeSingle();

  if (error) {
    return attachAnonymousSession(NextResponse.json({ error: "No se pudo cargar el saldo." }, { status: 500 }), session.id);
  }

  return attachAnonymousSession(NextResponse.json({ balance_points: data?.balance_points ?? 0 }), session.id);
}
