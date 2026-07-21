import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
// Server-side only. Prefer the service_role key so Row Level Security does not
// block admin writes; fall back to the anon key for read-only environments.
const supabaseKey =
	process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

export const supabase = 
	supabaseUrl && supabaseKey
		? createClient(supabaseUrl, supabaseKey, {
				auth: { persistSession: false },
			})
		: null;

// Throw error only when supabase is actually needed, not at import time
export function getSupabaseOrThrow() {
	if (!supabase) {
		throw new Error(
			"Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY environment variables"
		);
	}
	return supabase;
}
