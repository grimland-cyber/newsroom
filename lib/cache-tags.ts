/** Shared by public data caches and the admin save/delete revalidation. */
export const RELEASES_CACHE_TAG = "releases";

/** ISR / data-cache window for the public site. Admin writes purge this immediately. */
export const PUBLIC_REVALIDATE_SECONDS = 300;
