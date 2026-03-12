import "server-only";

import {
	deleteOAuthConnection,
	getOAuthConnection,
	rotateOAuthConnectionTokens,
} from "@/lib/integrations/oauth-connections.server";
import {
	getExpiresAtFromExpiresIn,
	isExpiringSoon,
	isOuraProviderError,
	refreshOuraTokens,
} from "@/lib/integrations/oura.server";

const MAX_OURA_REFRESH_ATTEMPTS = 2;
const OURA_RECONNECT_MESSAGE = "Oura session expired. Reconnect Oura.";

export async function getValidOuraAccessToken(params: {
	supabaseUserId: string;
}): Promise<string> {
	for (let attempt = 0; attempt < MAX_OURA_REFRESH_ATTEMPTS; attempt += 1) {
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
			await deleteOAuthConnection({
				userId: params.supabaseUserId,
				provider: "oura",
			});
			throw new Error(OURA_RECONNECT_MESSAGE);
		}

		try {
			const refreshed = await refreshOuraTokens({
				refreshToken: connection.refresh_token,
			});

			const rotationResult = await rotateOAuthConnectionTokens({
				userId: params.supabaseUserId,
				provider: "oura",
				previousRefreshToken: connection.refresh_token,
				providerUserId: connection.provider_user_id,
				accessToken: refreshed.access_token,
				refreshToken: refreshed.refresh_token ?? connection.refresh_token,
				tokenType: refreshed.token_type ?? connection.token_type,
				scope: refreshed.scope ?? connection.scope,
				accessTokenExpiresAt: getExpiresAtFromExpiresIn(refreshed.expires_in),
				refreshTokenExpiresAt: connection.refresh_token_expires_at,
			});

			if (rotationResult === "updated") {
				return refreshed.access_token;
			}

			if (rotationResult === "missing") {
				throw new Error("Oura account not connected.");
			}
		} catch (error) {
			if (
				isOuraProviderError(error) &&
				error.context === "token_refresh" &&
				error.code === "invalid_grant"
			) {
				const latest = await getOAuthConnection({
					userId: params.supabaseUserId,
					provider: "oura",
				});

				if (
					latest &&
					(latest.refresh_token !== connection.refresh_token ||
						!isExpiringSoon(latest.access_token_expires_at))
				) {
					continue;
				}

				await deleteOAuthConnection({
					userId: params.supabaseUserId,
					provider: "oura",
				});
				throw new Error(OURA_RECONNECT_MESSAGE);
			}

			throw error;
		}
	}

	const latest = await getOAuthConnection({
		userId: params.supabaseUserId,
		provider: "oura",
	});

	if (latest && !isExpiringSoon(latest.access_token_expires_at)) {
		return latest.access_token;
	}

	throw new Error(OURA_RECONNECT_MESSAGE);
}
