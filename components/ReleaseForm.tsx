"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { createRelease, updateRelease } from "@/app/actions/releases";
import type { PressRelease, MediaAsset } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

const TiptapEditor = dynamic(() => import("./TiptapEditor"), { ssr: false });

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

interface Props {
  initial?: Partial<PressRelease>;
}

export default function ReleaseForm({ initial }: Props) {
  const isEdit = !!initial?.id;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? true);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(
    initial?.media_assets ?? []
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setTitle(val);
    if (!isEdit) setSlug(slugify(val));
  }

  function addMediaAsset() {
    setMediaAssets([...mediaAssets, { name: "", url: "" }]);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        try {
          const form = new FormData();
          form.append("file", file);
          const res = await fetch("/api/upload", { 
            method: "POST", 
            body: form,
          });
          
          if (!res.ok) {
            let errMsg = `HTTP ${res.status}`;
            try {
              const err = await res.json();
              errMsg = err.error || errMsg;
            } catch {
              const text = await res.text();
              errMsg = text || errMsg;
            }
            alert(`שגיאה בהעלאת ${file.name}: ${errMsg}`);
            continue;
          }
          
          const data = await res.json();
          setMediaAssets((prev) => [...prev, { name: data.name, url: data.url }]);
        } catch (fileError) {
          alert(`שגיאה בהעלאת ${file.name}: ${fileError instanceof Error ? fileError.message : "Unknown error"}`);
        }
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function updateAsset(index: number, field: keyof MediaAsset, value: string) {
    setMediaAssets(mediaAssets.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  }

  function removeAsset(index: number) {
    setMediaAssets(mediaAssets.filter((_, i) => i !== index));
  }

  const action = isEdit ? updateRelease.bind(null, initial!.id!) : createRelease;

  const defaultDate = initial?.published_at
    ? new Date(initial.published_at).toISOString().substring(0, 10)
    : new Date().toISOString().substring(0, 10);

  return (
    <form action={action} className="max-w-3xl">
      {/* Hidden inputs for client-managed state */}
      <input type="hidden" name="content" value={content} readOnly />
      <input type="hidden" name="isPublished" value={String(isPublished)} readOnly />
      <input type="hidden" name="mediaAssets" value={JSON.stringify(mediaAssets)} readOnly />

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            כותרת <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            type="text"
            value={title}
            onChange={handleTitleChange}
            required
            placeholder="כותרת ההודעה לעיתונות"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0068b5]/30 focus:border-[#0068b5] bg-white"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            קטגוריה <span className="text-gray-400 font-normal">(אופציונלי)</span>
          </label>
          <select
            name="category"
            defaultValue={initial?.category ?? ""}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0068b5]/30 focus:border-[#0068b5] bg-white"
          >
            <option value="">ללא קטגוריה</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Slug + Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              כתובת URL <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#0068b5]/30 focus-within:border-[#0068b5]">
              <span className="px-3 py-2.5 text-xs text-gray-400 bg-gray-50 border-l border-gray-200 whitespace-nowrap">
                /news/
              </span>
              <input
                name="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                dir="ltr"
                placeholder="slug-here"
                className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              תאריך פרסום
            </label>
            <input
              name="publishedAt"
              type="date"
              defaultValue={defaultDate}
              dir="ltr"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0068b5]/30 focus:border-[#0068b5] bg-white"
            />
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            תקציר{" "}
            <span className="text-gray-400 font-normal">(אופציונלי)</span>
          </label>
          <textarea
            name="excerpt"
            defaultValue={initial?.excerpt ?? ""}
            rows={2}
            placeholder="משפט קצר שיופיע בדף הבית מתחת לכותרת"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0068b5]/30 focus:border-[#0068b5] bg-white"
          />
        </div>

        {/* TipTap */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            תוכן ההודעה <span className="text-red-500">*</span>
          </label>
          <TiptapEditor content={content} onChange={setContent} />
        </div>

        {/* Media assets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              נכסי מדיה
            </label>
            <div className="flex items-center gap-3">
              <label
                className={`text-xs font-medium transition-colors cursor-pointer ${
                  uploading
                    ? "text-gray-400 cursor-wait"
                    : "text-[#0068b5] hover:text-[#004f8c]"
                }`}
              >
                {uploading ? "מעלה..." : "העלה קובץ"}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.pptx,.docx,.xlsx,.zip"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={addMediaAsset}
                className="text-xs text-[#0068b5] hover:text-[#004f8c] font-medium transition-colors"
              >
                + הוסף קישור
              </button>
            </div>
          </div>
          {mediaAssets.length === 0 && (
            <p className="text-xs text-gray-400 py-1">
              העלה קבצים או הוסף קישורים חיצוניים (תמונות, PDF, מצגות)
            </p>
          )}
          <div className="space-y-2">
            {mediaAssets.map((asset, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={asset.name}
                  onChange={(e) => updateAsset(index, "name", e.target.value)}
                  placeholder="שם (למשל: תמונה ראשית)"
                  className="w-40 shrink-0 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0068b5]/30 focus:border-[#0068b5] bg-white"
                />
                <input
                  type="url"
                  value={asset.url}
                  onChange={(e) => updateAsset(index, "url", e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0068b5]/30 focus:border-[#0068b5] bg-white"
                />
                <button
                  type="button"
                  onClick={() => removeAsset(index)}
                  className="text-gray-300 hover:text-red-400 transition-colors text-xl leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Published toggle */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            role="switch"
            aria-checked={isPublished}
            onClick={() => setIsPublished(!isPublished)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              isPublished ? "bg-[#0068b5]" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                isPublished ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className="text-sm text-gray-700">
            {isPublished ? "מפורסם (גלוי לציבור)" : "טיוטה (מוסתר)"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-[#0068b5] hover:bg-[#004f8c] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            {isEdit ? "שמור שינויים" : "פרסם הודעה"}
          </button>
          <a
            href="/admin/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ביטול
          </a>
        </div>
      </div>
    </form>
  );
}
