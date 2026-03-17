import type { NextRequest } from "next/server";
import {
	jsonNoStore,
	logWearableRouteError,
} from "@/lib/integrations/wearable-route-errors.server";
import {
	enqueueRollingWhoopReconcileJobs,
	enqueueRollingWhoopRefreshJobs,
	recoverStaleWhoopSyncJobs,
} from "@/lib/integrations/whoop-sync.server";
import {
	authorizeWhoopSyncRequest,
	ensureWhoopSyncConfigured,
} from "../shared";

export const runtime = "nodejs";

async function handleRequest(request: NextRequest) {
	try {
		const authorizationError = authorizeWhoopSyncRequest(
			request,
			"sync/maintenance"
		);
		if (authorizationError) {
			return authorizationError;
		}

		const configurationError = ensureWhoopSyncConfigured();
		if (configurationError) {
			return configurationError;
		}

		const errors: string[] = [];
		let recoveredJobs = 0;
		let enqueuedRefreshes = 0;
		let enqueuedReconciles = 0;

		try {
			recoveredJobs = await recoverStaleWhoopSyncJobs();
		} catch (error) {
			errors.push(
				error instanceof Error
					? `recover_stale_jobs: ${error.message}`
					: "recover_stale_jobs: unexpected error"
			);
		}

		try {
			enqueuedRefreshes = await enqueueRollingWhoopRefreshJobs();
		} catch (error) {
			errors.push(
				error instanceof Error
					? `enqueue_refresh: ${error.message}`
					: "enqueue_refresh: unexpected error"
			);
		}

		try {
			enqueuedReconciles = await enqueueRollingWhoopReconcileJobs();
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
							message: "WHOOP sync maintenance completed with errors.",
						}
					: {}),
				recoveredJobs,
				enqueuedRefreshes,
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
			provider: "whoop",
			route: "sync",
		});
		return jsonNoStore(
			{
				ok: false,
				code: "unexpected_error",
				message: "Unexpected WHOOP sync maintenance route failure.",
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
