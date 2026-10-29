import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "newsroom_session";
const EXPIRES_IN = 60 * 60 * 24 * 7; // 7 days

/** Known placeholder. Treating it as "unset" so a forged cookie cannot use it. */
const REJECTED_SECRETS = new Set(["fallback-secret-change-me"]);

export { COOKIE_NAME };

/**
 * Fail closed: there is no hardcoded signing key.
 * Missing JWT_SECRET, or the old placeholder, means sessions cannot be
 * created or accepted — in production and in local dev.
 */
export function getJwtSecret(): Uint8Array | null {
  const raw = process.env.JWT_SECRET?.trim() ?? "";
  if (!raw || REJECTED_SECRETS.has(raw)) return null;
  return new TextEncoder().encode(raw);
}

export async function createSessionToken(): Promise<string> {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Refusing to create an admin session.");
  }
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRES_IN}s`)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<boolean> {
  const secret = getJwtSecret();
  if (!secret) return false;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.admin === true;
  } catch {
    return false;
  }
}

export function cookieOptions(maxAge = EXPIRES_IN) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
