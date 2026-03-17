import "server-only";

import { auth } from "@clerk/nextjs/server";
import { getSupabaseUserIdByClerkId } from "@/lib/integrations/oauth-connections.server";
import {
	type AppSupabaseClient,
	createTypedServerClient,
} from "@/lib/supabase";

export type AuthenticatedSupabaseContext = {
	clerkUserId: string;
	supabaseUserId: string;
	supabase: AppSupabaseClient;
};

export async function getUserSupabaseClient(): Promise<AppSupabaseClient | null> {
	const { userId, getToken } = await auth();
	if (!userId) {
		return null;
	}

	const token = await getToken();
	if (!token) {
		return null;
	}

	return createTypedServerClient(token);
}

export async function getAuthenticatedSupabaseContext(): Promise<AuthenticatedSupabaseContext | null> {
	const { userId, getToken } = await auth();
	if (!userId) {
		return null;
	}

	const token = await getToken();
	if (!token) {
		return null;
	}

	const supabaseUserId = await getSupabaseUserIdByClerkId(userId);

	return {
		clerkUserId: userId,
		supabaseUserId,
		supabase: createTypedServerClient(token),
	};
}
