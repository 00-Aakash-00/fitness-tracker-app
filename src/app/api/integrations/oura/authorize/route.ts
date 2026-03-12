import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
	encodeCookiePayload,
	generateState,
	getCanonicalAppOrigin,
	getReturnToPath,
	OAUTH_STATE_COOKIE_NAME,
	type OAuthStateCookiePayload,
	safeErrorMessage,
} from "@/lib/integrations/oauth.server";
import {
	getOAuthConnection,
	getSupabaseUserIdByClerkId,
} from "@/lib/integrations/oauth-connections.server";
import {
	buildOuraAuthorizeUrl,
	buildOuraCallbackUrl,
	getOuraScopes,
	isOuraConfigured,
} from "@/lib/integrations/oura.server";

export async function GET(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.redirect(new URL("/sign-in", request.url));
	}

	const origin = getCanonicalAppOrigin(request);
	const returnTo = getReturnToPath(request) ?? "/dashboard/devices";
	const redirectUri = buildOuraCallbackUrl(origin);

	if (!isOuraConfigured()) {
		const url = new URL(returnTo, origin);
		url.searchParams.set("integration", "oura");
		url.searchParams.set("status", "error");
		url.searchParams.set(
			"message",
			"Coming soon. Oura is not configured in this environment."
		);
		return NextResponse.redirect(url, { status: 303 });
	}

	try {
		const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
		const whoopConnection = await getOAuthConnection({
			userId: supabaseUserId,
			provider: "whoop",
		});

		if (whoopConnection) {
			const url = new URL(returnTo, origin);
			url.searchParams.set("integration", "oura");
			url.searchParams.set("status", "error");
			url.searchParams.set(
				"message",
				"Disconnect WHOOP before connecting Oura."
			);
			return NextResponse.redirect(url, { status: 303 });
		}

		const state = generateState(32);
		const scope = getOuraScopes();
		const authorizeUrl = buildOuraAuthorizeUrl({ redirectUri, state, scope });

		const response = NextResponse.redirect(authorizeUrl);

		const payload: OAuthStateCookiePayload = {
			state,
			redirectUri,
			returnTo,
			createdAt: Date.now(),
		};

		response.cookies.set(
			OAUTH_STATE_COOKIE_NAME.oura,
			encodeCookiePayload(payload),
			{
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/api/integrations/oura/callback",
				maxAge: 60 * 10,
			}
		);

		return response;
	} catch (err) {
		const url = new URL(returnTo, origin);
		url.searchParams.set("integration", "oura");
		url.searchParams.set("status", "error");
		url.searchParams.set("message", safeErrorMessage(err));
		return NextResponse.redirect(url, { status: 303 });
	}
}
