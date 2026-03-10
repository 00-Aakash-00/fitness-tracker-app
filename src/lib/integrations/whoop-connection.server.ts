import "server-only";

import {
	deleteOAuthConnection,
	getOAuthConnection,
	rotateOAuthConnectionTokens,
} from "@/lib/integrations/oauth-connections.server";
import {
	getExpiresAtFromExpiresIn,
	getWhoopScopes,
	isExpiringSoon,
	isWhoopProviderError,
	refreshWhoopTokens,
} from "@/lib/integrations/whoop.server";

const MAX_WHOOP_REFRESH_ATTEMPTS = 2;
const WHOOP_RECONNECT_MESSAGE = "WHOOP session expired. Reconnect WHOOP.";

export async function getValidWhoopAccessToken(params: {
	supabaseUserId: string;
}): Promise<string> {
	for (let attempt = 0; attempt < MAX_WHOOP_REFRESH_ATTEMPTS; attempt += 1) {
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
			await deleteOAuthConnection({
				userId: params.supabaseUserId,
				provider: "whoop",
			});
			throw new Error(WHOOP_RECONNECT_MESSAGE);
		}

		try {
			const refreshed = await refreshWhoopTokens({
				refreshToken: connection.refresh_token,
				scope: getWhoopScopes(),
			});

			const rotationResult = await rotateOAuthConnectionTokens({
				userId: params.supabaseUserId,
				provider: "whoop",
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
				throw new Error("WHOOP account not connected.");
			}
		} catch (error) {
			if (
				isWhoopProviderError(error) &&
				error.context === "token_refresh" &&
				error.code === "invalid_grant"
			) {
				const latest = await getOAuthConnection({
					userId: params.supabaseUserId,
					provider: "whoop",
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
					provider: "whoop",
				});
				throw new Error(WHOOP_RECONNECT_MESSAGE);
			}

			throw error;
		}
	}

	const latest = await getOAuthConnection({
		userId: params.supabaseUserId,
		provider: "whoop",
	});

	if (latest && !isExpiringSoon(latest.access_token_expires_at)) {
		return latest.access_token;
	}

	throw new Error(WHOOP_RECONNECT_MESSAGE);
}
