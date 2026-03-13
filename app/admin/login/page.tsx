"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, "");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0068b5] rounded flex items-center justify-center">
              <span className="text-white text-sm font-bold">i</span>
            </div>
            <span className="text-xl font-bold text-gray-900">חדר החדשות</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900 mb-6 text-center">
            כניסה לניהול
          </h1>

          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                סיסמה
              </label>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                autoFocus
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0068b5]/30 focus:border-[#0068b5] transition-colors"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-[#0068b5] hover:bg-[#004f8c] disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm mt-2"
            >
              {pending ? "מתחבר..." : "כניסה"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          גישה מורשית לצוות יח&quot;צ בלבד
        </p>
      </div>
    </div>
  );
}
