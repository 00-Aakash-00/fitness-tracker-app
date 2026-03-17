import type { NextRequest } from "next/server";
import {
	jsonNoStore,
	logWearableRouteError,
} from "@/lib/integrations/wearable-route-errors.server";
import { isWhoopConfigured } from "@/lib/integrations/whoop.server";

export const WHOOP_LIVE_PROCESS_LIMIT = 6;
export const WHOOP_BACKFILL_PROCESS_LIMIT = 10;

function getAuthorizedSecrets(): string[] {
	const secrets = Array.from(
		new Set(
			[process.env.WHOOP_SYNC_SECRET, process.env.CRON_SECRET]
				.map((value) => value?.trim() ?? "")
				.filter(Boolean)
		)
	);

	if (secrets.length === 0) {
		throw new Error(
			"Missing WHOOP_SYNC_SECRET or CRON_SECRET for internal Whoop sync route."
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

export function authorizeWhoopSyncRequest(
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
			provider: "whoop",
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

export function ensureWhoopSyncConfigured(): Response | null {
	if (isWhoopConfigured()) {
		return null;
	}

	return syncErrorResponse({
		code: "provider_not_configured",
		message: "WHOOP integration is not configured.",
		status: 503,
	});
}

export function buildWhoopSyncWorkerId(scope: string): string {
	return `whoop-${scope}-${Date.now().toString(36)}`;
}
