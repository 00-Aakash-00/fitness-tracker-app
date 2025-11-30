import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Supabase Admin Client (Server-side only)
 * Uses service role key to bypass RLS - only use for webhooks/admin operations
 */
export function createAdminClient() {
	return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}

/**
 * Supabase Client with Clerk Auth (Client-side)
 * Uses anon key with Clerk session token for RLS-protected queries
 */
export function createClerkSupabaseClient(
	getToken: () => Promise<string | null>
) {
	return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
		accessToken: getToken,
	});
}

/**
 * Supabase Client with Clerk Auth (Server-side)
 * For use in server components/actions with Clerk's auth()
 */
export function createServerClient(token: string | null) {
	return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
		accessToken: async () => token,
	});
}
