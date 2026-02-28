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
	exchangeOuraCodeForTokens,
	fetchOuraPersonalInfo,
	getExpiresAtFromExpiresIn,
} from "@/lib/integrations/oura.server";

const OURA_STATE_COOKIE_PATH = "/api/integrations/oura/callback";
const OURA_STATE_TTL_MS = 10 * 60 * 1000;

function redirectToDevices(params: {
	origin: string;
	returnTo?: string;
	status: "connected" | "error";
	message?: string;
}) {
	const url = new URL(params.returnTo ?? "/dashboard/devices", params.origin);
	url.searchParams.set("integration", "oura");
	url.searchParams.set("status", params.status);
	if (params.message) url.searchParams.set("message", params.message);
	return NextResponse.redirect(url, { status: 303 });
}

function clearOuraStateCookie(response: NextResponse) {
	response.cookies.set(OAUTH_STATE_COOKIE_NAME.oura, "", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: OURA_STATE_COOKIE_PATH,
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
	clearOuraStateCookie(response);
	return response;
}

export async function GET(request: NextRequest) {
	const origin = getRequestOrigin(request);
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.redirect(new URL("/sign-in", request.url));
	}

	const cookieName = OAUTH_STATE_COOKIE_NAME.oura;
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

		const expectedRedirectUri = `${origin}${OURA_STATE_COOKIE_PATH}`;
		if (cookiePayload.redirectUri !== expectedRedirectUri) {
			return redirectToDevicesWithStateReset({
				origin,
				returnTo,
				status: "error",
				message: "Invalid OAuth callback context. Please try connecting again.",
			});
		}

		if (Date.now() - cookiePayload.createdAt > OURA_STATE_TTL_MS) {
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

		const token = await exchangeOuraCodeForTokens({
			code,
			redirectUri: cookiePayload.redirectUri,
		});

		const personalInfo = await fetchOuraPersonalInfo(token.access_token);
		const supabaseUserId = await getSupabaseUserIdByClerkId(userId);

		await upsertOAuthConnection({
			userId: supabaseUserId,
			provider: "oura",
			providerUserId: personalInfo.id,
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
		clearOuraStateCookie(response);
		return response;
	} catch (err) {
		const response = redirectToDevices({
			origin,
			returnTo,
			status: "error",
			message: safeErrorMessage(err),
		});
		clearOuraStateCookie(response);
		return response;
	}
}
