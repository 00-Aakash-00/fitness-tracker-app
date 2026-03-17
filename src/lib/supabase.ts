import {
	createClient as createSupabaseClient,
	type SupabaseClient,
} from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type AppSupabaseClient = SupabaseClient<Database>;

function getRequiredEnv(
	name: "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY"
): string {
	const value = process.env[name]?.trim();
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

function getSupabasePublishableKey(): string {
	const publishableKey =
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
	if (publishableKey) {
		return publishableKey;
	}

	const legacyAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
	if (legacyAnonKey) {
		return legacyAnonKey;
	}

	throw new Error(
		"Missing required Supabase publishable key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY."
	);
}

/**
 * Supabase Admin Client (Server-side only)
 * Uses service role key to bypass RLS - only use for webhooks/admin operations
 */
export function createAdminClient() {
	return createSupabaseClient(
		getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
		getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		}
	);
}

export function createTypedAdminClient(): AppSupabaseClient {
	return createSupabaseClient<Database>(
		getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
		getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		}
	);
}

/**
 * Supabase Client with Clerk Auth (Client-side)
 * Uses the Supabase publishable key with the current Clerk session token for RLS-protected queries.
 */
export function createClerkSupabaseClient(
	getToken: () => Promise<string | null>
) {
	return createSupabaseClient(
		getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
		getSupabasePublishableKey(),
		{
			accessToken: getToken,
		}
	);
}

export function createTypedClerkSupabaseClient(
	getToken: () => Promise<string | null>
): AppSupabaseClient {
	return createSupabaseClient<Database>(
		getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
		getSupabasePublishableKey(),
		{
			accessToken: getToken,
		}
	);
}

/**
 * Supabase Client with Clerk Auth (Server-side)
 * For use in server components/actions with Clerk's auth().
 */
export function createServerClient(token: string | null) {
	return createSupabaseClient(
		getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
		getSupabasePublishableKey(),
		{
			accessToken: async () => token,
		}
	);
}

export function createTypedServerClient(
	token: string | null
): AppSupabaseClient {
	return createSupabaseClient<Database>(
		getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
		getSupabasePublishableKey(),
		{
			accessToken: async () => token,
		}
	);
}
