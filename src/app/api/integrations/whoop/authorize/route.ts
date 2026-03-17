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
	getWearableBrowserErrorMessage,
	getWearableConfigMessage,
	logWearableRouteError,
	withNoStoreHeader,
} from "@/lib/integrations/wearable-route-errors.server";
import {
	buildWhoopAuthorizeUrl,
	buildWhoopCallbackUrl,
	getWhoopScopes,
	isWhoopConfigured,
} from "@/lib/integrations/whoop.server";

function redirectToDevices(params: {
	origin: string;
	returnTo: string;
	status: "error";
	message: string;
}) {
	const url = new URL(params.returnTo, params.origin);
	url.searchParams.set("integration", "whoop");
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
	const redirectUri = buildWhoopCallbackUrl(origin);

	if (!isWhoopConfigured()) {
		return redirectToDevices({
			origin,
			returnTo,
			status: "error",
			message: getWearableConfigMessage("whoop"),
		});
	}

	try {
		const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
		const whoopConnection = await getOAuthConnection({
			userId: supabaseUserId,
			provider: "whoop",
		});
		const ouraConnection = await getOAuthConnection({
			userId: supabaseUserId,
			provider: "oura",
		});

		if (whoopConnection) {
			return redirectToDevices({
				origin,
				returnTo,
				status: "error",
				message: "WHOOP is already connected.",
			});
		}

		if (ouraConnection) {
			return redirectToDevices({
				origin,
				returnTo,
				status: "error",
				message: "Disconnect Oura before connecting WHOOP.",
			});
		}

		const state = generateState(8);
		const scope = getWhoopScopes();
		const authorizeUrl = buildWhoopAuthorizeUrl({ redirectUri, state, scope });

		const response = withNoStoreHeader(NextResponse.redirect(authorizeUrl));

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
	} catch (error) {
		logWearableRouteError({
			error,
			phase: "start_authorize",
			provider: "whoop",
			route: "authorize",
			userId,
		});
		return redirectToDevices({
			origin,
			returnTo,
			status: "error",
			message: getWearableBrowserErrorMessage({
				error,
				fallbackMessage: "Couldn't start WHOOP connection. Please try again.",
				provider: "whoop",
			}),
		});
	}
}
