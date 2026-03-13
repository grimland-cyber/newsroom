"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionToken,
  cookieOptions,
  COOKIE_NAME,
} from "@/lib/auth";

export async function login(
  _prev: string,
  formData: FormData
): Promise<string> {
  const password = formData.get("password") as string;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!password || password !== adminPassword) {
    return "סיסמה שגויה";
  }

  const token = await createSessionToken();
  const store = await cookies();
  store.set(COOKIE_NAME, token, cookieOptions());
  redirect("/admin/dashboard");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", cookieOptions(0));
  redirect("/admin/login");
}
