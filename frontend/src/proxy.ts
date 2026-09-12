import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SELLER_COOKIE } from "@/lib/seller-session";

/**
 * Keeps signed-out visitors out of the seller dashboard. This only checks that a
 * token cookie exists — the token itself is verified by the backend on every
 * dashboard request.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SELLER_COOKIE)) {
    return NextResponse.next();
  }

  const login = new URL("/hyrje", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: "/panel/:path*",
};
