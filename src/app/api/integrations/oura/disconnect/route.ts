import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
	getRequestOrigin,
	safeErrorMessage,
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

function isExpiringSoon(expiresAtIso: string | null, skewSeconds = 0) {
	if (!expiresAtIso) return true;
	const expiresAt = Date.parse(expiresAtIso);
	if (!Number.isFinite(expiresAt)) return true;
	return expiresAt - Date.now() <= skewSeconds * 1000;
}

export async function POST(request: NextRequest) {
	const origin = getRequestOrigin(request);
	const { userId } = await auth();
	if (!userId) {
		return new Response("Unauthorized", { status: 401 });
	}

	const requestOrigin = request.headers.get("origin");
	if (requestOrigin && requestOrigin !== origin) {
		return new Response("Invalid origin", { status: 403 });
	}

	const redirectUrl = new URL("/dashboard/devices", origin);
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
			} catch {
				// Best-effort revoke; still disconnect locally.
			}

			await deleteOAuthConnection({ userId: supabaseUserId, provider: "oura" });
		}

		redirectUrl.searchParams.set("status", "disconnected");
		return NextResponse.redirect(redirectUrl, { status: 303 });
	} catch (err) {
		redirectUrl.searchParams.set("status", "error");
		redirectUrl.searchParams.set("message", safeErrorMessage(err));
		return NextResponse.redirect(redirectUrl, { status: 303 });
	}
}
