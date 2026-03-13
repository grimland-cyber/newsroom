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
}
