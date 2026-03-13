import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-change-me"
);
const COOKIE_NAME = "newsroom_session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPath = pathname === "/admin/login";
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let authenticated = false;
  if (token) {
    try {
      await jwtVerify(token, SECRET);
      authenticated = true;
    } catch {
      authenticated = false;
    }
  }

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
