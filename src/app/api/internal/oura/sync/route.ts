import type { NextRequest } from "next/server";
import { isOuraConfigured } from "@/lib/integrations/oura.server";
import {
	enqueueRollingOuraReconcileJobs,
	ensureOuraWebhookSubscriptions,
	processPendingOuraSyncJobs,
	recoverStaleOuraSyncJobs,
} from "@/lib/integrations/oura-sync.server";
import {
	jsonNoStore,
	logWearableRouteError,
} from "@/lib/integrations/wearable-route-errors.server";

export const runtime = "nodejs";

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

function syncErrorResponse(params: {
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

async function handleRequest(request: NextRequest) {
	try {
		let authorized = false;

		try {
			authorized = isAuthorized(request);
		} catch (error) {
			logWearableRouteError({
				error,
				phase: "load_authorization_secrets",
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

		if (!isOuraConfigured()) {
			return syncErrorResponse({
				code: "provider_not_configured",
				message: "Oura integration is not configured.",
				status: 503,
			});
		}

		const rawLimit = request.nextUrl.searchParams.get("limit");
		const parsedLimit = rawLimit ? Number.parseInt(rawLimit, 10) : NaN;
		const limit = Number.isFinite(parsedLimit) ? Math.max(1, parsedLimit) : 25;
		const workerId = `oura-cron-${Date.now().toString(36)}`;
		const errors: string[] = [];

		let recoveredJobs = 0;
		let ensuredSubscriptions = 0;
		let enqueuedReconciles = 0;

		try {
			recoveredJobs = await recoverStaleOuraSyncJobs();
		} catch (error) {
			errors.push(
				error instanceof Error
					? `recover_stale_jobs: ${error.message}`
					: "recover_stale_jobs: unexpected error"
			);
		}

		try {
			ensuredSubscriptions = await ensureOuraWebhookSubscriptions();
		} catch (error) {
			errors.push(
				error instanceof Error
					? `ensure_subscriptions: ${error.message}`
					: "ensure_subscriptions: unexpected error"
			);
		}

		try {
			enqueuedReconciles = await enqueueRollingOuraReconcileJobs();
		} catch (error) {
			errors.push(
				error instanceof Error
					? `enqueue_reconcile: ${error.message}`
					: "enqueue_reconcile: unexpected error"
			);
		}

		let processedJobs = {
			claimed: 0,
			completed: 0,
			rescheduled: 0,
			failed: 0,
		};

		try {
			processedJobs = await processPendingOuraSyncJobs({
				limit,
				workerId,
			});
		} catch (error) {
			errors.push(
				error instanceof Error
					? `process_jobs: ${error.message}`
					: "process_jobs: unexpected error"
			);
		}

		return jsonNoStore(
			{
				ok: errors.length === 0,
				...(errors.length > 0
					? {
							code: "partial_failure",
							message: "Oura sync completed with errors.",
						}
					: {}),
				recoveredJobs,
				ensuredSubscriptions,
				enqueuedReconciles,
				processedJobs,
				errors,
			},
			{
				status: errors.length === 0 ? 200 : 500,
			}
		);
	} catch (error) {
		logWearableRouteError({
			error,
			phase: "handle_request",
			provider: "oura",
			route: "sync",
		});
		return syncErrorResponse({
			code: "unexpected_error",
			message: "Unexpected Oura sync route failure.",
			status: 500,
		});
	}
}

export async function GET(request: NextRequest) {
	return handleRequest(request);
}

export async function POST(request: NextRequest) {
	return handleRequest(request);
}
