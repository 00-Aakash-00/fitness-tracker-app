import "server-only";

import { createAdminClient } from "@/lib/supabase";
import type { OAuthProvider } from "./oauth.server";

export type OAuthConnectionRow = {
	id: string;
	user_id: string;
	provider: OAuthProvider;
	provider_user_id: string | null;
	access_token: string;
	refresh_token: string | null;
	token_type: string | null;
	scope: string | null;
	access_token_expires_at: string | null;
	refresh_token_expires_at: string | null;
	created_at: string | null;
	updated_at: string | null;
};

export async function getSupabaseUserIdByClerkId(
	clerkUserId: string
): Promise<string> {
	const supabase = createAdminClient();
	const { data, error } = await supabase
		.from("users")
		.select("id")
		.eq("clerk_id", clerkUserId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!data?.id) {
		// Webhook provisioning can lag or be misconfigured; create the user row on-demand
		// so first-time flows (like OAuth connect) still work.
		const { data: created, error: createError } = await supabase
			.from("users")
			.insert({ clerk_id: clerkUserId })
			.select("id")
			.single();

		if (createError) {
			// If another request/webhook created the row concurrently, re-read it.
			const isUniqueViolation =
				typeof (createError as { code?: string }).code === "string" &&
				(createError as { code?: string }).code === "23505";
			if (!isUniqueViolation) {
				throw createError;
			}

			const { data: existing, error: rereadError } = await supabase
				.from("users")
				.select("id")
				.eq("clerk_id", clerkUserId)
				.maybeSingle();
			if (rereadError) throw rereadError;
			if (!existing?.id) {
				throw new Error("User not found in Supabase. Please try again.");
			}
			return existing.id;
		}

		return created.id;
	}

	return data.id;
}

export async function upsertOAuthConnection(params: {
	userId: string;
	provider: OAuthProvider;
	providerUserId?: string | null;
	accessToken: string;
	refreshToken?: string | null;
	tokenType?: string | null;
	scope?: string | null;
	accessTokenExpiresAt?: string | null;
	refreshTokenExpiresAt?: string | null;
}): Promise<void> {
	const supabase = createAdminClient();

	const { error } = await supabase.from("oauth_connections").upsert(
		{
			user_id: params.userId,
			provider: params.provider,
			provider_user_id: params.providerUserId ?? null,
			access_token: params.accessToken,
			refresh_token: params.refreshToken ?? null,
			token_type: params.tokenType ?? null,
			scope: params.scope ?? null,
			access_token_expires_at: params.accessTokenExpiresAt ?? null,
			refresh_token_expires_at: params.refreshTokenExpiresAt ?? null,
		},
		{ onConflict: "user_id,provider" }
	);

	if (error) {
		throw error;
	}
}

export async function getOAuthConnection(params: {
	userId: string;
	provider: OAuthProvider;
}): Promise<OAuthConnectionRow | null> {
	const supabase = createAdminClient();
	const { data, error } = await supabase
		.from("oauth_connections")
		.select("*")
		.eq("user_id", params.userId)
		.eq("provider", params.provider)
		.maybeSingle();

	if (error) throw error;
	return (data as OAuthConnectionRow | null) ?? null;
}

export async function deleteOAuthConnection(params: {
	userId: string;
	provider: OAuthProvider;
}): Promise<void> {
	const supabase = createAdminClient();
	const { error } = await supabase
		.from("oauth_connections")
		.delete()
		.eq("user_id", params.userId)
		.eq("provider", params.provider);

	if (error) throw error;
}
