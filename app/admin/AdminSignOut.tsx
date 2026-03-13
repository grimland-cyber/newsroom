"use client";

import { logout } from "@/app/actions/auth";

export default function AdminSignOut() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
      >
        יציאה
      </button>
    </form>
  );
}
