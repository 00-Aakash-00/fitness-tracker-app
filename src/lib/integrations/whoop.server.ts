import "server-only";

import type { OAuthProvider } from "./oauth.server";
import { hasRequiredEnv, requireEnv } from "./oauth.server";

const WHOOP_PROVIDER: OAuthProvider = "whoop";
const WHOOP_REQUIRED_ENV = ["WHOOP_CLIENT_ID", "WHOOP_CLIENT_SECRET"];
const WHOOP_FETCH_TIMEOUT_MS = 10_000;
const WHOOP_TIMEOUT_MESSAGE = "WHOOP request timed out. Please try again.";

export const WHOOP_AUTHORIZATION_URL =
	"https://api.prod.whoop.com/oauth/oauth2/auth";
export const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
export const WHOOP_REVOKE_URL = "https://api.prod.whoop.com/v2/user/access";
export const WHOOP_BASIC_PROFILE_URL =
	"https://api.prod.whoop.com/v2/user/profile/basic";
export const WHOOP_CALLBACK_PATH = "/api/integrations/whoop/callback";
export const WHOOP_WEBHOOK_PATH = "/api/webhooks/whoop";

export const DEFAULT_WHOOP_SCOPES = [
	"offline",
	"read:recovery",
	"read:cycles",
	"read:workout",
	"read:sleep",
	"read:profile",
	"read:body_measurement",
];

export const WHOOP_OAUTH_ERROR_CODES = [
	"access_denied",
	"invalid_client",
	"invalid_grant",
	"invalid_request",
	"invalid_scope",
	"server_error",
	"temporarily_unavailable",
	"unauthorized_client",
	"unsupported_grant_type",
] as const;

export type WhoopOAuthErrorCode =
	| (typeof WHOOP_OAUTH_ERROR_CODES)[number]
	| "unknown_error";

export type WhoopProviderErrorContext =
	| "authorize"
	| "token_exchange"
	| "token_refresh"
	| "profile"
	| "revoke"
	| "webhook";

export class WhoopProviderError extends Error {
	readonly code: WhoopOAuthErrorCode;
	readonly context: WhoopProviderErrorContext;
	readonly status: number | null;
	readonly requiresReconnect: boolean;

	constructor(params: {
		code: WhoopOAuthErrorCode;
		context: WhoopProviderErrorContext;
		message: string;
		status?: number | null;
		requiresReconnect?: boolean;
		cause?: unknown;
	}) {
		super(params.message, params.cause ? { cause: params.cause } : undefined);
		this.name = "WhoopProviderError";
		this.code = params.code;
		this.context = params.context;
		this.status = params.status ?? null;
		this.requiresReconnect = params.requiresReconnect ?? false;
	}
}

export type WhoopTokenResponse = {
	access_token: string;
	expires_in: number;
	refresh_token?: string;
	scope?: string;
	token_type?: string;
};

export type WhoopBasicProfile = {
	user_id: number;
	email: string;
	first_name: string;
	last_name: string;
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
	return typeof value === "object" && value !== null;
}

function getString(value: unknown): string | null {
	return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getWhoopErrorCode(value: unknown): WhoopOAuthErrorCode {
	if (typeof value !== "string") return "unknown_error";

	return WHOOP_OAUTH_ERROR_CODES.includes(
		value as (typeof WHOOP_OAUTH_ERROR_CODES)[number]
	)
		? (value as (typeof WHOOP_OAUTH_ERROR_CODES)[number])
		: "unknown_error";
}

function getWhoopErrorDescription(body: unknown): string | null {
	if (!isRecord(body)) return null;

	return (
		getString(body.error_description) ??
		getString(body.error_message) ??
		getString(body.message)
	);
}

function getWhoopBodyCode(body: unknown): WhoopOAuthErrorCode {
	if (!isRecord(body)) return "unknown_error";
	return getWhoopErrorCode(body.error);
}

function getWhoopUserMessage(params: {
	code: WhoopOAuthErrorCode;
	context: WhoopProviderErrorContext;
	status: number | null;
}) {
	const { code, context, status } = params;

	if (code === "access_denied") {
		return "WHOOP access was not granted.";
	}

	if (
		code === "invalid_client" ||
		code === "invalid_scope" ||
		code === "unauthorized_client"
	) {
		return "WHOOP integration is misconfigured. Contact support.";
	}

	if (context === "token_exchange" && code === "invalid_grant") {
		return "WHOOP authorization expired. Please try connecting again.";
	}

	if (context === "token_refresh" && code === "invalid_grant") {
		return "WHOOP session expired. Reconnect WHOOP.";
	}

	if (context === "profile" && status === 401) {
		return "WHOOP session expired. Reconnect WHOOP.";
	}

	if (status === 429) {
		return "WHOOP rate limited the request. Please try again shortly.";
	}

	if (status !== null && status >= 500) {
		return "WHOOP is temporarily unavailable. Please try again.";
	}

	if (context === "webhook") {
		return "Invalid WHOOP webhook signature.";
	}

	return "WHOOP request failed. Please try again.";
}

function createWhoopProviderError(params: {
	context: WhoopProviderErrorContext;
	status?: number | null;
	code?: WhoopOAuthErrorCode;
	body?: unknown;
	cause?: unknown;
}) {
	const code = params.code ?? getWhoopBodyCode(params.body);
	const status = params.status ?? null;
	const message =
		getWhoopUserMessage({
			code,
			context: params.context,
			status,
		}) ?? getWhoopErrorDescription(params.body);

	return new WhoopProviderError({
		code,
		context: params.context,
		status,
		message,
		requiresReconnect:
			(params.context === "token_refresh" && code === "invalid_grant") ||
			(params.context === "profile" && status === 401),
		cause: params.cause,
	});
}

async function parseWhoopBody(response: Response): Promise<unknown> {
	const text = await response.text().catch(() => "");
	if (!text) return null;

	try {
		return JSON.parse(text) as unknown;
	} catch {
		return text;
	}
}

async function fetchWhoop(
	input: RequestInfo | URL,
	init?: RequestInit,
	context: WhoopProviderErrorContext = "profile"
): Promise<Response> {
	try {
		return await fetch(input, {
			...init,
			cache: "no-store",
			signal: init?.signal ?? AbortSignal.timeout(WHOOP_FETCH_TIMEOUT_MS),
		});
	} catch (error) {
		if (
			error instanceof Error &&
			(error.name === "TimeoutError" || error.name === "AbortError")
		) {
			throw new WhoopProviderError({
				code: "unknown_error",
				context,
				status: null,
				message: WHOOP_TIMEOUT_MESSAGE,
				cause: error,
			});
		}

		throw error;
	}
}

async function performWhoopTokenRequest(params: {
	body: URLSearchParams;
	context: "token_exchange" | "token_refresh";
}): Promise<WhoopTokenResponse> {
	const response = await fetchWhoop(
		WHOOP_TOKEN_URL,
		{
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: params.body,
		},
		params.context
	);

	const data = await parseWhoopBody(response);
	if (!response.ok) {
		throw createWhoopProviderError({
			context: params.context,
			status: response.status,
			body: data,
		});
	}

	if (!isRecord(data)) {
		throw new WhoopProviderError({
			code: "unknown_error",
			context: params.context,
			status: response.status,
			message: "WHOOP returned an invalid token response.",
		});
	}

	const accessToken = getString(data.access_token);
	const expiresIn =
		typeof data.expires_in === "number" && Number.isFinite(data.expires_in)
			? data.expires_in
			: null;

	if (!accessToken || expiresIn === null) {
		throw new WhoopProviderError({
			code: "unknown_error",
			context: params.context,
			status: response.status,
			message: "WHOOP returned an invalid token response.",
		});
	}

	return {
		access_token: accessToken,
		expires_in: expiresIn,
		refresh_token: getString(data.refresh_token) ?? undefined,
		scope: getString(data.scope) ?? undefined,
		token_type: getString(data.token_type) ?? undefined,
	};
}

export function getWhoopProvider(): OAuthProvider {
	return WHOOP_PROVIDER;
}

export function getWhoopClientId(): string {
	return requireEnv("WHOOP_CLIENT_ID");
}

export function getWhoopClientSecret(): string {
	return requireEnv("WHOOP_CLIENT_SECRET");
}

export function isWhoopConfigured(): boolean {
	return hasRequiredEnv(WHOOP_REQUIRED_ENV);
}

export function getWhoopScopes(): string {
	const configured = process.env.WHOOP_SCOPES?.trim();
	if (!configured) return DEFAULT_WHOOP_SCOPES.join(" ");

	const scopes = configured.split(/\s+/).filter(Boolean);
	if (!scopes.includes("offline")) scopes.unshift("offline");
	return Array.from(new Set(scopes)).join(" ");
}

export function buildWhoopCallbackUrl(origin: string): string {
	return new URL(WHOOP_CALLBACK_PATH, origin).toString();
}

export function buildWhoopWebhookUrl(origin: string): string {
	return new URL(WHOOP_WEBHOOK_PATH, origin).toString();
}

export function buildWhoopAuthorizeUrl(params: {
	redirectUri: string;
	state: string;
	scope: string;
}): string {
	const url = new URL(WHOOP_AUTHORIZATION_URL);
	url.searchParams.set("response_type", "code");
	url.searchParams.set("client_id", getWhoopClientId());
	url.searchParams.set("redirect_uri", params.redirectUri);
	url.searchParams.set("scope", params.scope);
	url.searchParams.set("state", params.state);
	return url.toString();
}

export function getWhoopAuthorizationErrorMessage(params: {
	error: string;
	errorDescription?: string | null;
}) {
	void params.errorDescription;

	const code = getWhoopErrorCode(params.error);
	return getWhoopUserMessage({
		code,
		context: "authorize",
		status: null,
	});
}

export async function exchangeWhoopCodeForTokens(params: {
	code: string;
	redirectUri: string;
}): Promise<WhoopTokenResponse> {
	const body = new URLSearchParams({
		grant_type: "authorization_code",
		code: params.code,
		redirect_uri: params.redirectUri,
		client_id: getWhoopClientId(),
		client_secret: getWhoopClientSecret(),
	});

	return performWhoopTokenRequest({
		body,
		context: "token_exchange",
	});
}

export async function refreshWhoopTokens(params: {
	refreshToken: string;
	scope?: string;
}): Promise<WhoopTokenResponse> {
	const scope = params.scope ?? "offline";

	const body = new URLSearchParams({
		grant_type: "refresh_token",
		refresh_token: params.refreshToken,
		client_id: getWhoopClientId(),
		client_secret: getWhoopClientSecret(),
		scope,
	});

	return performWhoopTokenRequest({
		body,
		context: "token_refresh",
	});
}

export function getExpiresAtFromExpiresIn(expiresInSeconds: number): string {
	const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
	return expiresAt.toISOString();
}

export function isExpiringSoon(expiresAtIso: string | null, skewSeconds = 120) {
	if (!expiresAtIso) return true;
	const expiresAt = Date.parse(expiresAtIso);
	if (!Number.isFinite(expiresAt)) return true;
	return expiresAt - Date.now() <= skewSeconds * 1000;
}

export function isWhoopProviderError(
	error: unknown
): error is WhoopProviderError {
	return error instanceof WhoopProviderError;
}

export function isWhoopReconnectRequiredError(error: unknown): boolean {
	return isWhoopProviderError(error) && error.requiresReconnect;
}

export async function fetchWhoopBasicProfile(
	accessToken: string
): Promise<WhoopBasicProfile> {
	const response = await fetchWhoop(
		WHOOP_BASIC_PROFILE_URL,
		{
			headers: { Authorization: `Bearer ${accessToken}` },
		},
		"profile"
	);

	const data = await parseWhoopBody(response);
	if (!response.ok) {
		throw createWhoopProviderError({
			context: "profile",
			status: response.status,
			body: data,
		});
	}

	if (!isRecord(data)) {
		throw new WhoopProviderError({
			code: "unknown_error",
			context: "profile",
			status: response.status,
			message: "WHOOP returned an invalid profile response.",
		});
	}

	const userId =
		typeof data.user_id === "number" && Number.isFinite(data.user_id)
			? data.user_id
			: null;
	const email = getString(data.email);
	const firstName = getString(data.first_name);
	const lastName = getString(data.last_name);

	if (userId === null || !email || !firstName || !lastName) {
		throw new WhoopProviderError({
			code: "unknown_error",
			context: "profile",
			status: response.status,
			message: "WHOOP returned an invalid profile response.",
		});
	}

	return {
		user_id: userId,
		email,
		first_name: firstName,
		last_name: lastName,
	};
}

export async function revokeWhoopAccess(accessToken: string): Promise<void> {
	const response = await fetchWhoop(
		WHOOP_REVOKE_URL,
		{
			method: "DELETE",
			headers: { Authorization: `Bearer ${accessToken}` },
		},
		"revoke"
	);

	if (response.status === 204) return;

	const data = await parseWhoopBody(response);
	if (!response.ok) {
		throw createWhoopProviderError({
			context: "revoke",
			status: response.status,
			body: data,
		});
	}
}
