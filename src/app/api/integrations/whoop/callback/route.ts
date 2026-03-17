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
	getWearableBrowserErrorMessage,
	logWearableOAuthStateFailure,
	logWearableRouteError,
	withNoStoreHeader,
} from "@/lib/integrations/wearable-route-errors.server";
import {
	buildWhoopCallbackUrl,
	exchangeWhoopCodeForTokens,
	fetchWhoopBasicProfile,
	fetchWhoopBodyMeasurement,
	getExpiresAtFromExpiresIn,
	getWhoopAuthorizationErrorMessage,
	isWhoopProviderError,
	revokeWhoopAccess,
	type WhoopTokenResponse,
} from "@/lib/integrations/whoop.server";
import {
	deleteWhoopBodyMeasurement,
	persistWhoopDocuments,
	purgeWhoopUserData,
} from "@/lib/integrations/whoop-storage.server";
import {
	enqueueInitialWhoopSyncJobs,
	processPendingWhoopSyncJobs,
	purgeWhoopSyncArtifacts,
} from "@/lib/integrations/whoop-sync.server";

export const runtime = "nodejs";

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
	return withNoStoreHeader(NextResponse.redirect(url, { status: 303 }));
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

function logWhoopStateFailure(params: {
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
		provider: "whoop",
		reason: params.reason,
		returnTo: params.cookiePayload?.returnTo,
		stateAgeMs: params.cookiePayload
			? Date.now() - params.cookiePayload.createdAt
			: null,
		userId: params.userId,
	});
}

async function rollbackFailedWhoopConnection(params: {
	supabaseUserId?: string | null;
	token?: WhoopTokenResponse | null;
}) {
	if (params.token?.access_token) {
		try {
			await revokeWhoopAccess(params.token.access_token);
		} catch (error) {
			logWearableRouteError({
				error,
				phase: "rollback_revoke_token",
				provider: "whoop",
				route: "callback",
				userId: params.supabaseUserId,
			});
		}
	}

	if (!params.supabaseUserId) {
		return;
	}

	try {
		await purgeWhoopUserData({
			userId: params.supabaseUserId,
		});
	} catch (error) {
		logWearableRouteError({
			error,
			phase: "rollback_purge_user_data",
			provider: "whoop",
			route: "callback",
			userId: params.supabaseUserId,
		});
	}

	try {
		await purgeWhoopSyncArtifacts({
			userId: params.supabaseUserId,
		});
	} catch (error) {
		logWearableRouteError({
			error,
			phase: "rollback_purge_sync_artifacts",
			provider: "whoop",
			route: "callback",
			userId: params.supabaseUserId,
		});
	}

	try {
		await deleteOAuthConnection({
			userId: params.supabaseUserId,
			provider: "whoop",
		});
	} catch (error) {
		logWearableRouteError({
			error,
			phase: "rollback_delete_connection",
			provider: "whoop",
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
			NextResponse.redirect(new URL("/sign-in", request.url))
		);
	}

	const cookieName = OAUTH_STATE_COOKIE_NAME.whoop;
	const rawCookie = request.cookies.get(cookieName)?.value;
	const cookiePayload = rawCookie ? decodeCookiePayload(rawCookie) : null;
	const returnTo = cookiePayload?.returnTo;

	let token: WhoopTokenResponse | null = null;
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
				message: getWhoopAuthorizationErrorMessage({
					error,
					errorDescription,
				}),
			});
		}

		const code = request.nextUrl.searchParams.get("code");
		const state = request.nextUrl.searchParams.get("state");

		if (!cookiePayload) {
			logWhoopStateFailure({
				reason: "missing_cookie",
				cookiePayload,
				expectedRedirectUri: buildWhoopCallbackUrl(origin),
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

		const expectedRedirectUri = buildWhoopCallbackUrl(origin);
		if (cookiePayload.redirectUri !== expectedRedirectUri) {
			logWhoopStateFailure({
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

		if (Date.now() - cookiePayload.createdAt > WHOOP_STATE_TTL_MS) {
			logWhoopStateFailure({
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
			logWhoopStateFailure({
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

		const whoopConnection = await getOAuthConnection({
			userId: supabaseUserId,
			provider: "whoop",
		});
		if (whoopConnection) {
			return redirectToDevicesWithStateReset({
				origin,
				returnTo,
				status: "error",
				message: "WHOOP is already connected.",
			});
		}

		const otherConnection = await getOAuthConnection({
			userId: supabaseUserId,
			provider: "oura",
		});
		if (otherConnection) {
			return redirectToDevicesWithStateReset({
				origin,
				returnTo,
				status: "error",
				message: "Disconnect Oura before connecting WHOOP.",
			});
		}

		token = await exchangeWhoopCodeForTokens({
			code,
			redirectUri: cookiePayload.redirectUri,
		});
		rollbackRequired = true;

		const profile = await fetchWhoopBasicProfile(token.access_token);
		const bodyMeasurement = await fetchWhoopBodyMeasurement(
			token.access_token
		).catch((error) => {
			if (isWhoopProviderError(error) && error.status === 404) {
				return null;
			}

			throw error;
		});

		try {
			await upsertOAuthConnection({
				userId: supabaseUserId,
				provider: "whoop",
				providerUserId: profile.user_id,
				accessToken: token.access_token,
				refreshToken: token.refresh_token ?? null,
				tokenType: token.token_type ?? null,
				scope: token.scope ?? null,
				accessTokenExpiresAt: getExpiresAtFromExpiresIn(token.expires_in),
			});
		} catch (error) {
			if (isOAuthConnectionProviderUserConflict(error)) {
				await rollbackFailedWhoopConnection({
					supabaseUserId,
					token,
				});

				return redirectToDevicesWithStateReset({
					origin,
					returnTo,
					status: "error",
					message: "This WHOOP account is already connected to another user.",
				});
			}

			throw error;
		}

		await persistWhoopDocuments({
			userId: supabaseUserId,
			dataType: "profile",
			documents: [profile],
		});
		if (bodyMeasurement) {
			await persistWhoopDocuments({
				userId: supabaseUserId,
				dataType: "body_measurement",
				documents: [bodyMeasurement],
			});
		} else {
			await deleteWhoopBodyMeasurement({
				userId: supabaseUserId,
			});
		}
		await enqueueInitialWhoopSyncJobs({
			userId: supabaseUserId,
		});
		rollbackRequired = false;

		const response = redirectToDevices({
			origin,
			returnTo,
			status: "connected",
		});
		clearWhoopStateCookie(response);

		after(() => {
			processPendingWhoopSyncJobs({
				limit: 10,
				workerId: `whoop-callback-${supabaseUserId}`,
			}).catch((error) => {
				logWearableRouteError({
					error,
					phase: "process_initial_sync",
					provider: "whoop",
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
			provider: "whoop",
			route: "callback",
			userId: supabaseUserId,
		});

		if (rollbackRequired) {
			await rollbackFailedWhoopConnection({
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
				fallbackMessage: "WHOOP connection failed. Please try again.",
				provider: "whoop",
			}),
		});
	}
}
