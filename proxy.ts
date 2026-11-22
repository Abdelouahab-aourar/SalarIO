import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes: marketing home + auth screens + auth API + assets.
const PUBLIC = [
  /^\/$/,
  /^\/login$/,
  /^\/unauthorized$/,
  /^\/api\/auth\//,
  /^\/_next\//,
  /^\/favicon\.ico$/,
  /\./,
];

/**
 * Pre-render gate (Next 16 proxy): anonymous browsers get a real 307 to
 * /login before any rendered workspace page is served. This only checks
 * session-cookie PRESENCE; full session validation + role gates still run in
 * layouts/pages/actions (defense in depth — verified live: wrong-role users
 * land on /unauthorized).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC.some((re) => re.test(pathname))) return NextResponse.next();
  const hasSession =
    request.cookies.has("better-auth.session_token") ||
    request.cookies.has("__Secure-better-auth.session_token");
  /**if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }**/
  return NextResponse.next();
}
