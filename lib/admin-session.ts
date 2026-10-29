import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminRequest())) {
    redirect("/admin/login");
  }
}
