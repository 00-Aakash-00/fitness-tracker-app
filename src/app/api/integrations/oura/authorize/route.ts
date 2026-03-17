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
import {
	getWearableBrowserErrorMessage,
	getWearableConfigMessage,
	logWearableRouteError,
	withNoStoreHeader,
} from "@/lib/integrations/wearable-route-errors.server";

function redirectToDevices(params: {
	origin: string;
	returnTo: string;
	status: "error";
	message: string;
}) {
	const url = new URL(params.returnTo, params.origin);
	url.searchParams.set("integration", "oura");
	url.searchParams.set("status", params.status);
	url.searchParams.set("message", params.message);
	return withNoStoreHeader(NextResponse.redirect(url, { status: 303 }));
}

export async function GET(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return withNoStoreHeader(
			NextResponse.redirect(new URL("/sign-in", request.url))
		);
	}

	const origin = getCanonicalAppOrigin(request);
	const returnTo = getReturnToPath(request) ?? "/dashboard/devices";
	const redirectUri = buildOuraCallbackUrl(origin);

	if (!isOuraConfigured()) {
		return redirectToDevices({
			origin,
			returnTo,
			status: "error",
			message: getWearableConfigMessage("oura"),
		});
	}

	try {
		const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
		const ouraConnection = await getOAuthConnection({
			userId: supabaseUserId,
			provider: "oura",
		});
		const whoopConnection = await getOAuthConnection({
			userId: supabaseUserId,
			provider: "whoop",
		});

		if (ouraConnection) {
			return redirectToDevices({
				origin,
				returnTo,
				status: "error",
				message: "Oura is already connected.",
			});
		}

		if (whoopConnection) {
			return redirectToDevices({
				origin,
				returnTo,
				status: "error",
				message: "Disconnect WHOOP before connecting Oura.",
			});
		}

		const state = generateState(32);
		const scope = getOuraScopes();
		const authorizeUrl = buildOuraAuthorizeUrl({ redirectUri, state, scope });

		const response = withNoStoreHeader(NextResponse.redirect(authorizeUrl));

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
	} catch (error) {
		logWearableRouteError({
			error,
			phase: "start_authorize",
			provider: "oura",
			route: "authorize",
			userId,
		});
		return redirectToDevices({
			origin,
			returnTo,
			status: "error",
			message: getWearableBrowserErrorMessage({
				error,
				fallbackMessage: "Couldn't start Oura connection. Please try again.",
				provider: "oura",
			}),
		});
	}
}
