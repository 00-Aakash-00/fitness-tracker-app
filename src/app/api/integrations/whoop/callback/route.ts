import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
	decodeCookiePayload,
	getRequestOrigin,
	OAUTH_STATE_COOKIE_NAME,
	safeErrorMessage,
} from "@/lib/integrations/oauth.server";
import {
	getSupabaseUserIdByClerkId,
	upsertOAuthConnection,
} from "@/lib/integrations/oauth-connections.server";
import {
	exchangeWhoopCodeForTokens,
	fetchWhoopBasicProfile,
	getExpiresAtFromExpiresIn,
} from "@/lib/integrations/whoop.server";

const WHOOP_STATE_COOKIE_PATH = "/api/integrations/whoop/callback";
const WHOOP_STATE_TTL_MS = 10 * 60 * 1000;

function redirectToDevices(params: {
	origin: string;
	returnTo?: string;
	status: "connected" | "error";
	message?: string;
}) {
	const url = new URL(params.returnTo ?? "/dashboard/devices", params.origin);
	url.searchParams.set("integration", "whoop");
	url.searchParams.set("status", params.status);
	if (params.message) url.searchParams.set("message", params.message);
	return NextResponse.redirect(url, { status: 303 });
}

function clearWhoopStateCookie(response: NextResponse) {
	response.cookies.set(OAUTH_STATE_COOKIE_NAME.whoop, "", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: WHOOP_STATE_COOKIE_PATH,
		maxAge: 0,
	});
}

function redirectToDevicesWithStateReset(params: {
	origin: string;
	returnTo?: string;
	status: "connected" | "error";
	message?: string;
}) {
	const response = redirectToDevices(params);
	clearWhoopStateCookie(response);
	return response;
}

export async function GET(request: NextRequest) {
	const origin = getRequestOrigin(request);
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.redirect(new URL("/sign-in", request.url));
	}

	const cookieName = OAUTH_STATE_COOKIE_NAME.whoop;
	const rawCookie = request.cookies.get(cookieName)?.value;
	const cookiePayload = rawCookie ? decodeCookiePayload(rawCookie) : null;
	const returnTo = cookiePayload?.returnTo;

	try {
		const error = request.nextUrl.searchParams.get("error");
		const errorDescription =
			request.nextUrl.searchParams.get("error_description") ||
			request.nextUrl.searchParams.get("error_message");
		if (error) {
			return redirectToDevicesWithStateReset({
				origin,
				returnTo,
				status: "error",
				message: errorDescription ? `${error}: ${errorDescription}` : error,
			});
		}

		const code = request.nextUrl.searchParams.get("code");
		const state = request.nextUrl.searchParams.get("state");

		if (!cookiePayload) {
			return redirectToDevicesWithStateReset({
				origin,
				returnTo,
				status: "error",
				message: "Missing OAuth state cookie. Please try connecting again.",
			});
		}

		const expectedRedirectUri = `${origin}${WHOOP_STATE_COOKIE_PATH}`;
		if (cookiePayload.redirectUri !== expectedRedirectUri) {
			return redirectToDevicesWithStateReset({
				origin,
				returnTo,
				status: "error",
				message: "Invalid OAuth callback context. Please try connecting again.",
			});
		}

		if (Date.now() - cookiePayload.createdAt > WHOOP_STATE_TTL_MS) {
			return redirectToDevicesWithStateReset({
				origin,
				returnTo,
				status: "error",
				message: "OAuth state expired. Please try connecting again.",
			});
		}

		if (!state || state !== cookiePayload.state) {
			return redirectToDevicesWithStateReset({
				origin,
				returnTo,
				status: "error",
				message: "Invalid OAuth state. Please try connecting again.",
			});
		}

		if (!code) {
			return redirectToDevicesWithStateReset({
				origin,
				returnTo,
				status: "error",
				message: "Missing authorization code. Please try connecting again.",
			});
		}

		const token = await exchangeWhoopCodeForTokens({
			code,
			redirectUri: cookiePayload.redirectUri,
		});

		const profile = await fetchWhoopBasicProfile(token.access_token);
		const supabaseUserId = await getSupabaseUserIdByClerkId(userId);

		await upsertOAuthConnection({
			userId: supabaseUserId,
			provider: "whoop",
			providerUserId: String(profile.user_id),
			accessToken: token.access_token,
			refreshToken: token.refresh_token ?? null,
			tokenType: token.token_type ?? null,
			scope: token.scope ?? null,
			accessTokenExpiresAt: getExpiresAtFromExpiresIn(token.expires_in),
		});

		const response = redirectToDevices({
			origin,
			returnTo,
			status: "connected",
		});
		clearWhoopStateCookie(response);
		return response;
	} catch (err) {
		const response = redirectToDevices({
			origin,
			returnTo,
			status: "error",
			message: safeErrorMessage(err),
		});
		clearWhoopStateCookie(response);
		return response;
	}
}
