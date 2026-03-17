import type { NextRequest } from "next/server";
import { isOuraConfigured } from "@/lib/integrations/oura.server";
import {
	jsonNoStore,
	logWearableRouteError,
} from "@/lib/integrations/wearable-route-errors.server";

export const OURA_LIVE_PROCESS_LIMIT = 10;
export const OURA_BACKFILL_PROCESS_LIMIT = 20;

function getAuthorizedSecrets(): string[] {
	const secrets = Array.from(
		new Set(
			[process.env.OURA_SYNC_SECRET, process.env.CRON_SECRET]
				.map((value) => value?.trim() ?? "")
				.filter(Boolean)
		)
	);

	if (secrets.length === 0) {
		throw new Error(
			"Missing OURA_SYNC_SECRET or CRON_SECRET for internal Oura sync route."
		);
	}

	return secrets;
}

function isAuthorized(request: NextRequest): boolean {
	const authorization = request.headers.get("authorization")?.trim();
	if (!authorization) {
		return false;
	}

	return getAuthorizedSecrets().some(
		(secret) => authorization === `Bearer ${secret}`
	);
}

export function syncErrorResponse(params: {
	code: string;
	message: string;
	status: 401 | 500 | 503;
}) {
	return jsonNoStore(
		{
			ok: false,
			code: params.code,
			message: params.message,
		},
		{
			status: params.status,
		}
	);
}

export function authorizeOuraSyncRequest(
	request: NextRequest,
	phase: string
): Response | null {
	let authorized = false;

	try {
		authorized = isAuthorized(request);
	} catch (error) {
		logWearableRouteError({
			error,
			phase: `load_authorization_secrets:${phase}`,
			provider: "oura",
			route: "sync",
		});
		return syncErrorResponse({
			code: "not_configured",
			message: "Sync route is not configured.",
			status: 500,
		});
	}

	if (!authorized) {
		return syncErrorResponse({
			code: "unauthorized",
			message: "Unauthorized",
			status: 401,
		});
	}

	return null;
}

export function ensureOuraSyncConfigured(): Response | null {
	if (isOuraConfigured()) {
		return null;
	}

	return syncErrorResponse({
		code: "provider_not_configured",
		message: "Oura integration is not configured.",
		status: 503,
	});
}

export function buildOuraSyncWorkerId(scope: string): string {
	return `oura-${scope}-${Date.now().toString(36)}`;
}
