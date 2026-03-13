"use client";

import { useTransition } from "react";
import { removeRelease } from "@/app/actions/releases";

export default function DeleteButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`למחוק את "${title}"?`)) return;
    startTransition(() => removeRelease(id));
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors px-2 py-1 rounded hover:bg-red-50"
    >
      {pending ? "..." : "מחיקה"}
    </button>
  );
}
