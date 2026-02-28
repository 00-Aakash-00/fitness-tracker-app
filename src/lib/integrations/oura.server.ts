import "server-only";

import { hasRequiredEnv, requireEnv } from "./oauth.server";

export const OURA_AUTHORIZATION_URL =
	"https://cloud.ouraring.com/oauth/authorize";
export const OURA_TOKEN_URL = "https://api.ouraring.com/oauth/token";
export const OURA_REVOKE_URL = "https://api.ouraring.com/oauth/revoke";

export const DEFAULT_OURA_SCOPES = [
	"email",
	"personal",
	"daily",
	"heartrate",
	"workout",
	"session",
	"tag",
	"spo2",
];
const OURA_REQUIRED_ENV = ["OURA_CLIENT_ID", "OURA_CLIENT_SECRET"];

export type OuraTokenResponse = {
	access_token: string;
	token_type?: string;
	expires_in: number;
	refresh_token?: string;
	scope?: string;
};

export type OuraPersonalInfo = {
	id: string;
	email?: string | null;
	age?: number | null;
	weight?: number | null;
	height?: number | null;
	biological_sex?: string | null;
};

export function getOuraClientId(): string {
	return requireEnv("OURA_CLIENT_ID");
}

export function getOuraClientSecret(): string {
	return requireEnv("OURA_CLIENT_SECRET");
}

export function isOuraConfigured(): boolean {
	return hasRequiredEnv(OURA_REQUIRED_ENV);
}

export function getOuraScopes(): string {
	const configured = process.env.OURA_SCOPES?.trim();
	if (!configured) return DEFAULT_OURA_SCOPES.join(" ");
	return configured.split(/\s+/).filter(Boolean).join(" ");
}

export function buildOuraAuthorizeUrl(params: {
	redirectUri: string;
	state: string;
	scope: string;
}): string {
	const url = new URL(OURA_AUTHORIZATION_URL);
	url.searchParams.set("response_type", "code");
	url.searchParams.set("client_id", getOuraClientId());
	url.searchParams.set("redirect_uri", params.redirectUri);
	url.searchParams.set("scope", params.scope);
	url.searchParams.set("state", params.state);
	return url.toString();
}

export async function exchangeOuraCodeForTokens(params: {
	code: string;
	redirectUri: string;
}): Promise<OuraTokenResponse> {
	const body = new URLSearchParams({
		grant_type: "authorization_code",
		code: params.code,
		redirect_uri: params.redirectUri,
		client_id: getOuraClientId(),
		client_secret: getOuraClientSecret(),
	});

	const response = await fetch(OURA_TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});

	const data = (await response.json().catch(() => null)) as unknown;
	if (!response.ok) {
		throw new Error(
			`Oura token exchange failed (${response.status}): ${JSON.stringify(data)}`
		);
	}

	const token = data as Partial<OuraTokenResponse>;
	if (!token.access_token || typeof token.access_token !== "string") {
		throw new Error("Oura token exchange failed: missing access_token");
	}
	if (typeof token.expires_in !== "number") {
		throw new Error("Oura token exchange failed: missing expires_in");
	}
	return token as OuraTokenResponse;
}

export async function refreshOuraTokens(params: {
	refreshToken: string;
}): Promise<OuraTokenResponse> {
	const body = new URLSearchParams({
		grant_type: "refresh_token",
		refresh_token: params.refreshToken,
		client_id: getOuraClientId(),
		client_secret: getOuraClientSecret(),
	});

	const response = await fetch(OURA_TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});

	const data = (await response.json().catch(() => null)) as unknown;
	if (!response.ok) {
		throw new Error(
			`Oura token refresh failed (${response.status}): ${JSON.stringify(data)}`
		);
	}

	const token = data as Partial<OuraTokenResponse>;
	if (!token.access_token || typeof token.access_token !== "string") {
		throw new Error("Oura token refresh failed: missing access_token");
	}
	if (typeof token.expires_in !== "number") {
		throw new Error("Oura token refresh failed: missing expires_in");
	}
	return token as OuraTokenResponse;
}

export function getExpiresAtFromExpiresIn(expiresInSeconds: number): string {
	const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
	return expiresAt.toISOString();
}

export async function fetchOuraPersonalInfo(
	accessToken: string
): Promise<OuraPersonalInfo> {
	const response = await fetch(
		"https://api.ouraring.com/v2/usercollection/personal_info",
		{
			headers: { Authorization: `Bearer ${accessToken}` },
		}
	);

	const data = (await response.json().catch(() => null)) as unknown;
	if (!response.ok) {
		throw new Error(
			`Oura personal_info fetch failed (${response.status}): ${JSON.stringify(data)}`
		);
	}

	const info = data as Partial<OuraPersonalInfo>;
	if (!info.id || typeof info.id !== "string") {
		throw new Error("Oura personal_info fetch failed: missing id");
	}
	return info as OuraPersonalInfo;
}

export async function revokeOuraAccess(accessToken: string): Promise<void> {
	const url = new URL(OURA_REVOKE_URL);
	url.searchParams.set("access_token", accessToken);

	const response = await fetch(url.toString(), { method: "GET" });
	if (response.ok) return;

	const text = await response.text().catch(() => "");
	throw new Error(
		`Oura revoke failed (${response.status}): ${text.slice(0, 500)}`
	);
}
