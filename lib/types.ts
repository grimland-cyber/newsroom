export interface MediaAsset {
  name: string;
  url: string;
}

export interface PressRelease {
  id: string;
  title: string;
  slug: string;
  content: string; // HTML from TipTap
  excerpt: string | null;
  published_at: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  media_assets: MediaAsset[];
  category: string | null;
}

export const CATEGORIES: { id: string; label: string }[] = [
  { id: "products", label: "מוצרים" },
  { id: "ai", label: "בינה מלאכותית" },
  { id: "innovation", label: "חדשנות" },
  { id: "partnerships", label: "שותפויות" },
  { id: "community", label: "קהילה ואחריות" },
  { id: "infrastructure", label: "תשתיות ומחשוב" },
];
