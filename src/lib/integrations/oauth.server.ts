import "server-only";

import crypto from "node:crypto";
import type { NextRequest } from "next/server";

export type OAuthProvider = "whoop" | "oura";

export type OAuthStateCookiePayload = {
	state: string;
	redirectUri: string;
	returnTo?: string;
	createdAt: number;
};

export const OAUTH_STATE_COOKIE_NAME: Record<OAuthProvider, string> = {
	whoop: "__ft_whoop_oauth_state",
	oura: "__ft_oura_oauth_state",
};

export function getRequestOrigin(request: NextRequest): string {
	const firstHeaderValue = (value: string | null) =>
		value?.split(",")[0]?.trim() || null;

	const forwardedProto = firstHeaderValue(
		request.headers.get("x-forwarded-proto")
	);
	const forwardedHost = firstHeaderValue(
		request.headers.get("x-forwarded-host")
	);
	if (forwardedProto && forwardedHost) {
		return `${forwardedProto}://${forwardedHost}`;
	}

	const host = request.headers.get("host");
	if (host) {
		const protocol =
			firstHeaderValue(request.headers.get("x-forwarded-proto")) ??
			(request.nextUrl.protocol
				? request.nextUrl.protocol.replace(":", "")
				: "https");
		return `${protocol}://${host}`;
	}

	return new URL(request.url).origin;
}

export function generateState(length: number): string {
	if (length <= 0) {
		throw new Error("State length must be > 0");
	}

	const bytes = crypto.randomBytes(Math.ceil((length * 6) / 8));
	const base64 = bytes.toString("base64url");
	return base64.slice(0, length);
}

export function encodeCookiePayload(payload: OAuthStateCookiePayload): string {
	return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeCookiePayload(
	value: string
): OAuthStateCookiePayload | null {
	try {
		const json = Buffer.from(value, "base64url").toString("utf8");
		const parsed = JSON.parse(json) as Partial<OAuthStateCookiePayload>;
		const hasValidReturnTo =
			typeof parsed.returnTo === "undefined" ||
			(typeof parsed.returnTo === "string" &&
				isSafeReturnToPath(parsed.returnTo));

		if (
			typeof parsed !== "object" ||
			parsed === null ||
			typeof parsed.state !== "string" ||
			typeof parsed.redirectUri !== "string" ||
			typeof parsed.createdAt !== "number" ||
			!Number.isFinite(parsed.createdAt) ||
			parsed.createdAt <= 0 ||
			!hasValidReturnTo
		) {
			return null;
		}

		new URL(parsed.redirectUri);
		return parsed as OAuthStateCookiePayload;
	} catch {
		return null;
	}
}

function isSafeReturnToPath(value: string): boolean {
	return value.startsWith("/") && !value.startsWith("//");
}

export function getReturnToPath(request: NextRequest): string | undefined {
	const raw = request.nextUrl.searchParams.get("returnTo");
	if (!raw) return undefined;
	if (!isSafeReturnToPath(raw)) return undefined;
	return raw;
}

export function safeErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message.replace(/\s+/g, " ").slice(0, 200);
	}
	return "Unexpected error";
}

export function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

export function hasRequiredEnv(names: string[]): boolean {
	return names.every((name) => Boolean(process.env[name]?.trim()));
}
