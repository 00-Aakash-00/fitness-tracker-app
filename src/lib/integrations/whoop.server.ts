import "server-only";

import type { OAuthProvider } from "./oauth.server";
import { hasRequiredEnv, requireEnv } from "./oauth.server";

const WHOOP_PROVIDER: OAuthProvider = "whoop";
const WHOOP_REQUIRED_ENV = ["WHOOP_CLIENT_ID", "WHOOP_CLIENT_SECRET"];

export const WHOOP_AUTHORIZATION_URL =
	"https://api.prod.whoop.com/oauth/oauth2/auth";
export const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
export const WHOOP_REVOKE_URL = "https://api.prod.whoop.com/v2/user/access";

export const DEFAULT_WHOOP_SCOPES = [
	"offline",
	"read:recovery",
	"read:cycles",
	"read:workout",
	"read:sleep",
	"read:profile",
	"read:body_measurement",
];

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

	const response = await fetch(WHOOP_TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});

	const data = (await response.json().catch(() => null)) as unknown;
	if (!response.ok) {
		throw new Error(
			`WHOOP token exchange failed (${response.status}): ${JSON.stringify(data)}`
		);
	}

	if (!data || typeof data !== "object") {
		throw new Error("WHOOP token exchange failed: invalid response");
	}

	const token = data as Partial<WhoopTokenResponse>;
	if (!token.access_token || typeof token.access_token !== "string") {
		throw new Error("WHOOP token exchange failed: missing access_token");
	}
	if (typeof token.expires_in !== "number") {
		throw new Error("WHOOP token exchange failed: missing expires_in");
	}
	return token as WhoopTokenResponse;
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

	const response = await fetch(WHOOP_TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});

	const data = (await response.json().catch(() => null)) as unknown;
	if (!response.ok) {
		throw new Error(
			`WHOOP token refresh failed (${response.status}): ${JSON.stringify(data)}`
		);
	}

	const token = data as Partial<WhoopTokenResponse>;
	if (!token.access_token || typeof token.access_token !== "string") {
		throw new Error("WHOOP token refresh failed: missing access_token");
	}
	if (typeof token.expires_in !== "number") {
		throw new Error("WHOOP token refresh failed: missing expires_in");
	}
	return token as WhoopTokenResponse;
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

export async function fetchWhoopBasicProfile(
	accessToken: string
): Promise<WhoopBasicProfile> {
	const response = await fetch(
		"https://api.prod.whoop.com/v2/user/profile/basic",
		{
			headers: { Authorization: `Bearer ${accessToken}` },
		}
	);

	const data = (await response.json().catch(() => null)) as unknown;
	if (!response.ok) {
		throw new Error(
			`WHOOP profile fetch failed (${response.status}): ${JSON.stringify(data)}`
		);
	}

	const profile = data as Partial<WhoopBasicProfile>;
	if (typeof profile.user_id !== "number") {
		throw new Error("WHOOP profile fetch failed: missing user_id");
	}
	if (typeof profile.email !== "string") {
		throw new Error("WHOOP profile fetch failed: missing email");
	}
	if (typeof profile.first_name !== "string") {
		throw new Error("WHOOP profile fetch failed: missing first_name");
	}
	if (typeof profile.last_name !== "string") {
		throw new Error("WHOOP profile fetch failed: missing last_name");
	}
	return profile as WhoopBasicProfile;
}

export async function revokeWhoopAccess(accessToken: string): Promise<void> {
	const response = await fetch(WHOOP_REVOKE_URL, {
		method: "DELETE",
		headers: { Authorization: `Bearer ${accessToken}` },
	});

	if (response.status === 204) return;

	const data = await response.text().catch(() => "");
	if (!response.ok) {
		throw new Error(
			`WHOOP revoke failed (${response.status}): ${data.slice(0, 500)}`
		);
	}
}
