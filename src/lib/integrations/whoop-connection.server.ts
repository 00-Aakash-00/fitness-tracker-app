import "server-only";

import {
	getOAuthConnection,
	upsertOAuthConnection,
} from "@/lib/integrations/oauth-connections.server";
import {
	getExpiresAtFromExpiresIn,
	getWhoopScopes,
	isExpiringSoon,
	refreshWhoopTokens,
} from "@/lib/integrations/whoop.server";

export async function getValidWhoopAccessToken(params: {
	supabaseUserId: string;
}): Promise<string> {
	const connection = await getOAuthConnection({
		userId: params.supabaseUserId,
		provider: "whoop",
	});

	if (!connection) {
		throw new Error("WHOOP account not connected.");
	}

	if (!isExpiringSoon(connection.access_token_expires_at)) {
		return connection.access_token;
	}

	if (!connection.refresh_token) {
		throw new Error(
			"WHOOP access token expired and no refresh token is available. Reconnect WHOOP."
		);
	}

	const refreshed = await refreshWhoopTokens({
		refreshToken: connection.refresh_token,
		scope: getWhoopScopes(),
	});

	await upsertOAuthConnection({
		userId: params.supabaseUserId,
		provider: "whoop",
		providerUserId: connection.provider_user_id,
		accessToken: refreshed.access_token,
		refreshToken: refreshed.refresh_token ?? connection.refresh_token,
		tokenType: refreshed.token_type ?? connection.token_type,
		scope: refreshed.scope ?? connection.scope,
		accessTokenExpiresAt: getExpiresAtFromExpiresIn(refreshed.expires_in),
	});

	return refreshed.access_token;
}
