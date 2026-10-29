import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function makeClient(key: string | undefined): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let serviceClient: SupabaseClient | null | undefined;
let publicClient: SupabaseClient | null | undefined;

/**
 * Server-side writes (and admin reads of drafts) must use this client.
 * It never falls back to the anon key. The service role bypasses RLS, so
 * writes keep working after anon is limited to SELECT on published rows.
 */
export function getServiceRoleClient(): SupabaseClient | null {
  if (serviceClient === undefined) {
    serviceClient = makeClient(process.env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return serviceClient;
}

/**
 * Public reads. Prefers the service role when it is configured so a bad or
 * missing anon key cannot blank the site. Falls back to the anon key.
 * Public queries always filter is_published = true, which is the same set
 * anon can read after RLS is limited to published rows.
 */
export function getPublicReadClient(): SupabaseClient | null {
  if (publicClient === undefined) {
    publicClient = getServiceRoleClient() ?? makeClient(process.env.SUPABASE_ANON_KEY);
  }
  return publicClient;
}
