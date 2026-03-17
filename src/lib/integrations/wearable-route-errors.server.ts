import "server-only";

import { NextResponse } from "next/server";
import type { OAuthProvider } from "./oauth.server";
import { isOuraProviderError } from "./oura.server";
import { isWhoopProviderError } from "./whoop.server";

type WearableRoute =
	| "authorize"
	| "callback"
	| "disconnect"
	| "webhook"
	| "sync";

type OAuthStateFailureReason =
	| "missing_cookie"
	| "redirect_uri_mismatch"
	| "expired_state"
	| "state_mismatch";

const NO_STORE_HEADER_VALUE = "no-store";

function getProviderLabel(provider: OAuthProvider): string {
	return provider === "oura" ? "Oura" : "WHOOP";
}

function sanitizeMessage(message: string): string {
	return message.replace(/\s+/g, " ").trim().slice(0, 200);
}

function getOriginFromUrl(value?: string | null): string | null {
	if (!value) return null;

	try {
		return new URL(value).origin;
	} catch {
		return null;
	}
}

function getProviderErrorDetails(
	provider: OAuthProvider,
	error: unknown
): {
	code: string | null;
	message: string;
	requiresReconnect: boolean;
	status: number | null;
} | null {
	if (provider === "oura" && isOuraProviderError(error)) {
		return {
			code: error.code,
			message: sanitizeMessage(error.message),
			requiresReconnect: error.requiresReconnect,
			status: error.status,
		};
	}

	if (provider === "whoop" && isWhoopProviderError(error)) {
		return {
			code: error.code,
			message: sanitizeMessage(error.message),
			requiresReconnect: error.requiresReconnect,
			status: error.status,
		};
	}

	return null;
}

function isMissingRequiredEnvError(error: unknown): boolean {
	return (
		error instanceof Error &&
		error.message.startsWith("Missing required environment variable:")
	);
}

export function getWearableConfigMessage(provider: OAuthProvider): string {
	return `${getProviderLabel(provider)} is not configured in this environment.`;
}

export function getWearableWebhookConfigMessage(
	provider: OAuthProvider
): string {
	return `${getProviderLabel(provider)} webhook is not configured in this environment.`;
}

export function getWearableBrowserErrorMessage(params: {
	error: unknown;
	fallbackMessage: string;
	provider: OAuthProvider;
}): string {
	const providerError = getProviderErrorDetails(params.provider, params.error);
	if (providerError) {
		return providerError.message;
	}

	if (isMissingRequiredEnvError(params.error)) {
		return getWearableConfigMessage(params.provider);
	}

	return params.fallbackMessage;
}

export function logWearableRouteError(params: {
	error: unknown;
	phase: string;
	provider?: OAuthProvider;
	providerUserId?: string | null;
	route: WearableRoute;
	userId?: string | null;
}) {
	const providerError =
		params.provider === undefined
			? null
			: getProviderErrorDetails(params.provider, params.error);
	const message =
		params.error instanceof Error
			? sanitizeMessage(params.error.message)
			: "Unexpected non-error thrown value";

	console.error(
		`[wearable/${params.route}] ${params.phase}`,
		{
			code: providerError?.code ?? null,
			message,
			provider: params.provider ?? null,
			providerUserId: params.providerUserId ?? null,
			requiresReconnect: providerError?.requiresReconnect ?? null,
			status: providerError?.status ?? null,
			userId: params.userId ?? null,
		},
		params.error
	);
}

export function logWearableOAuthStateFailure(params: {
	provider: OAuthProvider;
	reason: OAuthStateFailureReason;
	expectedRedirectUri?: string | null;
	actualRedirectUri?: string | null;
	hasCookiePayload: boolean;
	hasStateParam: boolean;
	returnTo?: string;
	stateAgeMs?: number | null;
	userId?: string | null;
}) {
	console.warn("[wearable/callback] oauth_state_check_failed", {
		actualRedirectOrigin: getOriginFromUrl(params.actualRedirectUri),
		expectedRedirectOrigin: getOriginFromUrl(params.expectedRedirectUri),
		hasCookiePayload: params.hasCookiePayload,
		hasStateParam: params.hasStateParam,
		provider: params.provider,
		reason: params.reason,
		returnTo: params.returnTo ? sanitizeMessage(params.returnTo) : null,
		stateAgeMs:
			typeof params.stateAgeMs === "number" &&
			Number.isFinite(params.stateAgeMs)
				? Math.max(0, Math.round(params.stateAgeMs))
				: null,
		userId: params.userId ?? null,
	});
}

export function withNoStoreHeader<T extends Response>(response: T): T {
	response.headers.set("Cache-Control", NO_STORE_HEADER_VALUE);
	return response;
}

export function jsonNoStore(body: unknown, init?: ResponseInit) {
	return withNoStoreHeader(NextResponse.json(body, init));
}

export function textNoStore(
	body: BodyInit | null | undefined,
	init?: ResponseInit
) {
	return withNoStoreHeader(
		new Response(body, {
			...init,
			headers: new Headers(init?.headers),
		})
	);
}
