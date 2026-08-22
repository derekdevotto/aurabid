import { NextResponse } from "next/server";

export const ANONYMOUS_SESSION_COOKIE = "aurabid_session";

function readCookie(request: Request, name: string) {
  const cookies = request.headers.get("cookie") || "";
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] || null;
}

export function getAnonymousSession(request: Request) {
  const existing = readCookie(request, ANONYMOUS_SESSION_COOKIE);
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return { id: existing, isNew: false };
  return { id: crypto.randomUUID(), isNew: true };
}

export function attachAnonymousSession(response: NextResponse, sessionId: string) {
  response.cookies.set({
    name: ANONYMOUS_SESSION_COOKIE,
    value: sessionId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
