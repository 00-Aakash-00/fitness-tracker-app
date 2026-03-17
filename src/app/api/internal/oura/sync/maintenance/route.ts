import type { NextRequest } from "next/server";
import {
	enqueueRollingOuraReconcileJobs,
	ensureOuraWebhookSubscriptions,
	recoverStaleOuraSyncJobs,
} from "@/lib/integrations/oura-sync.server";
import {
	jsonNoStore,
	logWearableRouteError,
} from "@/lib/integrations/wearable-route-errors.server";
import { authorizeOuraSyncRequest, ensureOuraSyncConfigured } from "../shared";

export const runtime = "nodejs";

async function handleRequest(request: NextRequest) {
	try {
		const authorizationError = authorizeOuraSyncRequest(
			request,
			"sync/maintenance"
		);
		if (authorizationError) {
			return authorizationError;
		}

		const configurationError = ensureOuraSyncConfigured();
		if (configurationError) {
			return configurationError;
		}

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

		return jsonNoStore(
			{
				ok: errors.length === 0,
				...(errors.length > 0
					? {
							code: "partial_failure",
							message: "Oura sync maintenance completed with errors.",
						}
					: {}),
				recoveredJobs,
				ensuredSubscriptions,
				enqueuedReconciles,
				errors,
			},
			{
				status: errors.length === 0 ? 200 : 500,
			}
		);
	} catch (error) {
		logWearableRouteError({
			error,
			phase: "handle_request:maintenance",
			provider: "oura",
			route: "sync",
		});
		return jsonNoStore(
			{
				ok: false,
				code: "unexpected_error",
				message: "Unexpected Oura sync maintenance route failure.",
			},
			{
				status: 500,
			}
		);
	}
}

export async function GET(request: NextRequest) {
	return handleRequest(request);
}

export async function POST(request: NextRequest) {
	return handleRequest(request);
}
