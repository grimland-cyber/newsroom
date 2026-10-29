import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPath = pathname === "/admin/login";
  const token = request.cookies.get(COOKIE_NAME)?.value;

  const authenticated = token ? await verifySessionToken(token) : false;

  if (!isLoginPath && !authenticated) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (isLoginPath && authenticated) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
