import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
	encodeCookiePayload,
	generateState,
	getRequestOrigin,
	getReturnToPath,
	OAUTH_STATE_COOKIE_NAME,
	type OAuthStateCookiePayload,
	safeErrorMessage,
} from "@/lib/integrations/oauth.server";
import {
	buildWhoopAuthorizeUrl,
	getWhoopScopes,
	isWhoopConfigured,
} from "@/lib/integrations/whoop.server";

export async function GET(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.redirect(new URL("/sign-in", request.url));
	}

	const origin = getRequestOrigin(request);
	const returnTo = getReturnToPath(request) ?? "/dashboard/devices";
	const redirectUri = `${origin}/api/integrations/whoop/callback`;

	if (!isWhoopConfigured()) {
		const url = new URL(returnTo, origin);
		url.searchParams.set("integration", "whoop");
		url.searchParams.set("status", "error");
		url.searchParams.set(
			"message",
			"Coming soon. WHOOP is not configured in this environment."
		);
		return NextResponse.redirect(url, { status: 303 });
	}

	try {
		const state = generateState(32);
		const scope = getWhoopScopes();
		const authorizeUrl = buildWhoopAuthorizeUrl({ redirectUri, state, scope });

		const response = NextResponse.redirect(authorizeUrl);

		const payload: OAuthStateCookiePayload = {
			state,
			redirectUri,
			returnTo,
			createdAt: Date.now(),
		};

		response.cookies.set(
			OAUTH_STATE_COOKIE_NAME.whoop,
			encodeCookiePayload(payload),
			{
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/api/integrations/whoop/callback",
				maxAge: 60 * 10,
			}
		);

		return response;
	} catch (err) {
		const url = new URL(returnTo, origin);
		url.searchParams.set("integration", "whoop");
		url.searchParams.set("status", "error");
		url.searchParams.set("message", safeErrorMessage(err));
		return NextResponse.redirect(url, { status: 303 });
	}
}
