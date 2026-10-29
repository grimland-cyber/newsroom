"use server";

import { createHash, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, cookieOptions, COOKIE_NAME } from "@/lib/auth";
import {
  clearLoginFailures,
  clientKeyFromForwardedHeaders,
  loginBlocked,
  loginFailureDelay,
  recordLoginFailure,
} from "@/lib/login-throttle";

function passwordMatches(input: string, expected: string | undefined): boolean {
  const left = createHash("sha256").update(input, "utf8").digest();
  const right = createHash("sha256").update(expected ?? "\0", "utf8").digest();
  return timingSafeEqual(left, right) && Boolean(expected);
}

export async function login(_prev: string, formData: FormData): Promise<string> {
  const headerStore = await headers();
  const key = clientKeyFromForwardedHeaders({
    forwardedFor: headerStore.get("x-forwarded-for"),
    realIp: headerStore.get("x-real-ip"),
  });

  const blocked = loginBlocked(key);
  if (blocked) {
    const minutes = Math.max(1, Math.ceil(blocked.retryAfterSec / 60));
    return `יותר מדי ניסיונות. נסה שוב בעוד ${minutes} דקות.`;
  }

  const password = (formData.get("password") as string)?.trim() ?? "";
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!passwordMatches(password, adminPassword)) {
    recordLoginFailure(key);
    await loginFailureDelay();
    return "סיסמה שגויה";
  }

  try {
    const token = await createSessionToken();
    clearLoginFailures(key);
    const store = await cookies();
    store.set(COOKIE_NAME, token, cookieOptions());
  } catch (error) {
    console.error("login: could not create session", error);
    return "הכניסה לא זמינה. ודא ש-JWT_SECRET מוגדר בשרת.";
  }

  redirect("/admin/dashboard");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", cookieOptions(0));
  redirect("/admin/login");
}
