import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { after, NextResponse } from "next/server";
import {
	decodeCookiePayload,
	getCanonicalAppOrigin,
	OAUTH_STATE_COOKIE_NAME,
} from "@/lib/integrations/oauth.server";
import {
	deleteOAuthConnection,
	getOAuthConnection,
	getSupabaseUserIdByClerkId,
	isOAuthConnectionProviderUserConflict,
	upsertOAuthConnection,
} from "@/lib/integrations/oauth-connections.server";
import {
	buildOuraCallbackUrl,
	exchangeOuraCodeForTokens,
	fetchOuraPersonalInfo,
	getExpiresAtFromExpiresIn,
	getOuraAuthorizationErrorMessage,
	type OuraTokenResponse,
	revokeOuraAccess,
} from "@/lib/integrations/oura.server";
import {
	persistOuraPersonalInfo,
	purgeOuraUserData,
} from "@/lib/integrations/oura-storage.server";
import {
	enqueueInitialOuraSyncJobs,
	processPendingOuraSyncJobs,
	purgeOuraSyncArtifacts,
} from "@/lib/integrations/oura-sync.server";
import {
	getWearableBrowserErrorMessage,
	logWearableOAuthStateFailure,
	logWearableRouteError,
	withNoStoreHeader,
} from "@/lib/integrations/wearable-route-errors.server";

export const runtime = "nodejs";

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
	return withNoStoreHeader(NextResponse.redirect(url, { status: 303 }));
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

function logOuraStateFailure(params: {
	reason:
		| "missing_cookie"
		| "redirect_uri_mismatch"
		| "expired_state"
		| "state_mismatch";
	cookiePayload: ReturnType<typeof decodeCookiePayload>;
	expectedRedirectUri?: string;
	state?: string | null;
	userId?: string | null;
}) {
	logWearableOAuthStateFailure({
		actualRedirectUri: params.cookiePayload?.redirectUri,
		expectedRedirectUri: params.expectedRedirectUri,
		hasCookiePayload: Boolean(params.cookiePayload),
		hasStateParam: Boolean(params.state),
		provider: "oura",
		reason: params.reason,
		returnTo: params.cookiePayload?.returnTo,
		stateAgeMs: params.cookiePayload
			? Date.now() - params.cookiePayload.createdAt
			: null,
		userId: params.userId,
	});
}

async function rollbackFailedOuraConnection(params: {
	supabaseUserId?: string | null;
	token?: OuraTokenResponse | null;
}) {
	if (params.token?.access_token) {
		try {
			await revokeOuraAccess(params.token.access_token);
		} catch (error) {
			logWearableRouteError({
				error,
				phase: "rollback_revoke_token",
				provider: "oura",
				route: "callback",
				userId: params.supabaseUserId,
			});
		}
	}

	if (!params.supabaseUserId) {
		return;
	}

	try {
		await purgeOuraUserData({
			userId: params.supabaseUserId,
		});
	} catch (error) {
		logWearableRouteError({
			error,
			phase: "rollback_purge_user_data",
			provider: "oura",
			route: "callback",
			userId: params.supabaseUserId,
		});
	}

	try {
		await purgeOuraSyncArtifacts({
			userId: params.supabaseUserId,
		});
	} catch (error) {
		logWearableRouteError({
			error,
			phase: "rollback_purge_sync_artifacts",
			provider: "oura",
			route: "callback",
			userId: params.supabaseUserId,
		});
	}

	try {
		await deleteOAuthConnection({
			userId: params.supabaseUserId,
			provider: "oura",
		});
	} catch (error) {
		logWearableRouteError({
			error,
			phase: "rollback_delete_connection",
			provider: "oura",
			route: "callback",
			userId: params.supabaseUserId,
		});
	}
}

export async function GET(request: NextRequest) {
	const origin = getCanonicalAppOrigin(request);
	const { userId } = await auth();
	if (!userId) {
		return withNoStoreHeader(
			NextResponse.redirect(new URL("/sign-in", origin))
		);
	}

	const cookieName = OAUTH_STATE_COOKIE_NAME.oura;
	const rawCookie = request.cookies.get(cookieName)?.value;
	const cookiePayload = rawCookie ? decodeCookiePayload(rawCookie) : null;
	const returnTo = cookiePayload?.returnTo;

	let token: OuraTokenResponse | null = null;
	let supabaseUserId: string | null = null;
	let rollbackRequired = false;

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
				message: getOuraAuthorizationErrorMessage({
					error,
					errorDescription,
				}),
			});
		}

		const code = request.nextUrl.searchParams.get("code");
		const state = request.nextUrl.searchParams.get("state");

		if (!cookiePayload) {
			logOuraStateFailure({
				reason: "missing_cookie",
				cookiePayload,
				expectedRedirectUri: buildOuraCallbackUrl(origin),
				state,
				userId,
			});
			return redirectToDevicesWithStateReset({
				origin,
				returnTo,
				status: "error",
				message: "Missing OAuth state cookie. Please try connecting again.",
			});
		}

		const expectedRedirectUri = buildOuraCallbackUrl(origin);
		if (cookiePayload.redirectUri !== expectedRedirectUri) {
			logOuraStateFailure({
				reason: "redirect_uri_mismatch",
				cookiePayload,
				expectedRedirectUri,
				state,
				userId,
			});
			return redirectToDevicesWithStateReset({
				origin,
				returnTo,
				status: "error",
				message: "Invalid OAuth callback context. Please try connecting again.",
			});
		}

		if (Date.now() - cookiePayload.createdAt > OURA_STATE_TTL_MS) {
			logOuraStateFailure({
				reason: "expired_state",
				cookiePayload,
				expectedRedirectUri,
				state,
				userId,
			});
			return redirectToDevicesWithStateReset({
				origin,
				returnTo,
				status: "error",
				message: "OAuth state expired. Please try connecting again.",
			});
		}

		if (!state || state !== cookiePayload.state) {
			logOuraStateFailure({
				reason: "state_mismatch",
				cookiePayload,
				expectedRedirectUri,
				state,
				userId,
			});
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

		supabaseUserId = await getSupabaseUserIdByClerkId(userId);

		const ouraConnection = await getOAuthConnection({
			userId: supabaseUserId,
			provider: "oura",
		});
		if (ouraConnection) {
			return redirectToDevicesWithStateReset({
				origin,
				returnTo,
				status: "error",
				message: "Oura is already connected.",
			});
		}

		const otherConnection = await getOAuthConnection({
			userId: supabaseUserId,
			provider: "whoop",
		});
		if (otherConnection) {
			return redirectToDevicesWithStateReset({
				origin,
				returnTo,
				status: "error",
				message: "Disconnect WHOOP before connecting Oura.",
			});
		}

		token = await exchangeOuraCodeForTokens({
			code,
			redirectUri: cookiePayload.redirectUri,
		});
		rollbackRequired = true;

		const personalInfo = await fetchOuraPersonalInfo(token.access_token);

		try {
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
		} catch (error) {
			if (isOAuthConnectionProviderUserConflict(error)) {
				await rollbackFailedOuraConnection({
					supabaseUserId,
					token,
				});

				return redirectToDevicesWithStateReset({
					origin,
					returnTo,
					status: "error",
					message: "This Oura account is already connected to another user.",
				});
			}

			throw error;
		}

		await persistOuraPersonalInfo({
			userId: supabaseUserId,
			personalInfo,
		});
		await enqueueInitialOuraSyncJobs({
			userId: supabaseUserId,
		});
		rollbackRequired = false;

		const response = redirectToDevices({
			origin,
			returnTo,
			status: "connected",
		});
		clearOuraStateCookie(response);

		after(() => {
			processPendingOuraSyncJobs({
				limit: 12,
				workerId: `oura-callback-${supabaseUserId}`,
			}).catch((error) => {
				logWearableRouteError({
					error,
					phase: "process_initial_sync",
					provider: "oura",
					route: "callback",
					userId: supabaseUserId,
				});
			});
		});

		return response;
	} catch (error) {
		logWearableRouteError({
			error,
			phase: "handle_callback",
			provider: "oura",
			route: "callback",
			userId: supabaseUserId,
		});

		if (rollbackRequired) {
			await rollbackFailedOuraConnection({
				supabaseUserId,
				token,
			});
		}

		return redirectToDevicesWithStateReset({
			origin,
			returnTo,
			status: "error",
			message: getWearableBrowserErrorMessage({
				error,
				fallbackMessage: "Oura connection failed. Please try again.",
				provider: "oura",
			}),
		});
	}
}
