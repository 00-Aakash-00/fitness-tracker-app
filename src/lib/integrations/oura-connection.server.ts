import "server-only";

import {
	getOAuthConnection,
	upsertOAuthConnection,
} from "@/lib/integrations/oauth-connections.server";
import {
	getExpiresAtFromExpiresIn,
	refreshOuraTokens,
} from "@/lib/integrations/oura.server";

function isExpiringSoon(expiresAtIso: string | null, skewSeconds = 120) {
	if (!expiresAtIso) return true;
	const expiresAt = Date.parse(expiresAtIso);
	if (!Number.isFinite(expiresAt)) return true;
	return expiresAt - Date.now() <= skewSeconds * 1000;
}

export async function getValidOuraAccessToken(params: {
	supabaseUserId: string;
}): Promise<string> {
	const connection = await getOAuthConnection({
		userId: params.supabaseUserId,
		provider: "oura",
	});

	if (!connection) {
		throw new Error("Oura account not connected.");
	}

	if (!isExpiringSoon(connection.access_token_expires_at)) {
		return connection.access_token;
	}

	if (!connection.refresh_token) {
		throw new Error(
			"Oura access token expired and no refresh token is available. Reconnect Oura."
		);
	}

	const refreshed = await refreshOuraTokens({
		refreshToken: connection.refresh_token,
	});

	await upsertOAuthConnection({
		userId: params.supabaseUserId,
		provider: "oura",
		providerUserId: connection.provider_user_id,
		accessToken: refreshed.access_token,
		refreshToken: refreshed.refresh_token ?? connection.refresh_token,
		tokenType: refreshed.token_type ?? connection.token_type,
		scope: refreshed.scope ?? connection.scope,
		accessTokenExpiresAt: getExpiresAtFromExpiresIn(refreshed.expires_in),
	});

	return refreshed.access_token;
}
