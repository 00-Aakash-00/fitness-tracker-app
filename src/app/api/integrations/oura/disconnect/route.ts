import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
	getCanonicalAppOrigin,
	getReturnToPath,
} from "@/lib/integrations/oauth.server";
import {
	deleteOAuthConnection,
	getOAuthConnection,
	getSupabaseUserIdByClerkId,
} from "@/lib/integrations/oauth-connections.server";
import {
	refreshOuraTokens,
	revokeOuraAccess,
} from "@/lib/integrations/oura.server";
import { purgeOuraUserData } from "@/lib/integrations/oura-storage.server";
import { purgeOuraSyncArtifacts } from "@/lib/integrations/oura-sync.server";
import {
	getWearableBrowserErrorMessage,
	logWearableRouteError,
} from "@/lib/integrations/wearable-route-errors.server";

export const runtime = "nodejs";

function isExpiringSoon(expiresAtIso: string | null, skewSeconds = 0) {
	if (!expiresAtIso) return true;
	const expiresAt = Date.parse(expiresAtIso);
	if (!Number.isFinite(expiresAt)) return true;
	return expiresAt - Date.now() <= skewSeconds * 1000;
}

export async function POST(request: NextRequest) {
	const origin = getCanonicalAppOrigin(request);
	const returnTo = getReturnToPath(request) ?? "/dashboard/devices";
	const { userId } = await auth();
	if (!userId) {
		return new Response("Unauthorized", { status: 401 });
	}

	const requestOrigin = request.headers.get("origin");
	if (requestOrigin && requestOrigin !== origin) {
		return new Response("Invalid origin", { status: 403 });
	}

	const redirectUrl = new URL(returnTo, origin);
	redirectUrl.searchParams.set("integration", "oura");

	try {
		const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
		const connection = await getOAuthConnection({
			userId: supabaseUserId,
			provider: "oura",
		});

		if (connection) {
			const accessToken = connection.access_token;
			const refreshToken = connection.refresh_token;

			try {
				if (!isExpiringSoon(connection.access_token_expires_at)) {
					await revokeOuraAccess(accessToken);
				} else if (refreshToken) {
					const refreshed = await refreshOuraTokens({ refreshToken });
					await revokeOuraAccess(refreshed.access_token);
				} else {
					await revokeOuraAccess(accessToken);
				}
			} catch (error) {
				// Best-effort revoke; still disconnect locally.
				logWearableRouteError({
					error,
					phase: "revoke_remote_grant",
					provider: "oura",
					route: "disconnect",
					userId: supabaseUserId,
				});
			}

			await purgeOuraUserData({ userId: supabaseUserId });
			await purgeOuraSyncArtifacts({ userId: supabaseUserId });
			await deleteOAuthConnection({ userId: supabaseUserId, provider: "oura" });
		}

		redirectUrl.searchParams.set("status", "disconnected");
		return NextResponse.redirect(redirectUrl, { status: 303 });
	} catch (error) {
		logWearableRouteError({
			error,
			phase: "disconnect_local_state",
			provider: "oura",
			route: "disconnect",
			userId,
		});
		redirectUrl.searchParams.set("status", "error");
		redirectUrl.searchParams.set(
			"message",
			getWearableBrowserErrorMessage({
				error,
				fallbackMessage: "Couldn't disconnect Oura. Please try again.",
				provider: "oura",
			})
		);
		return NextResponse.redirect(redirectUrl, { status: 303 });
	}
}
