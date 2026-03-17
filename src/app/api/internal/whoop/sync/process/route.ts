import type { NextRequest } from "next/server";
import {
	jsonNoStore,
	logWearableRouteError,
} from "@/lib/integrations/wearable-route-errors.server";
import { processPendingWhoopSyncJobs } from "@/lib/integrations/whoop-sync.server";
import {
	authorizeWhoopSyncRequest,
	buildWhoopSyncWorkerId,
	ensureWhoopSyncConfigured,
	WHOOP_BACKFILL_PROCESS_LIMIT,
	WHOOP_LIVE_PROCESS_LIMIT,
} from "../shared";

export const runtime = "nodejs";

async function handleRequest(request: NextRequest) {
	try {
		const authorizationError = authorizeWhoopSyncRequest(
			request,
			"sync/process"
		);
		if (authorizationError) {
			return authorizationError;
		}

		const configurationError = ensureWhoopSyncConfigured();
		if (configurationError) {
			return configurationError;
		}

		const errors: string[] = [];
		let liveProcessedJobs = {
			claimed: 0,
			completed: 0,
			rescheduled: 0,
			failed: 0,
		};
		let backfillProcessedJobs = {
			claimed: 0,
			completed: 0,
			rescheduled: 0,
			failed: 0,
		};

		try {
			liveProcessedJobs = await processPendingWhoopSyncJobs({
				limit: WHOOP_LIVE_PROCESS_LIMIT,
				workerId: buildWhoopSyncWorkerId("process-live"),
				syncKinds: ["refresh", "reconcile", "webhook_fetch", "webhook_delete"],
			});
		} catch (error) {
			errors.push(
				error instanceof Error
					? `process_live_jobs: ${error.message}`
					: "process_live_jobs: unexpected error"
			);
		}

		try {
			backfillProcessedJobs = await processPendingWhoopSyncJobs({
				limit: WHOOP_BACKFILL_PROCESS_LIMIT,
				workerId: buildWhoopSyncWorkerId("process-backfill"),
				syncKinds: ["backfill"],
			});
		} catch (error) {
			errors.push(
				error instanceof Error
					? `process_backfill_jobs: ${error.message}`
					: "process_backfill_jobs: unexpected error"
			);
		}

		return jsonNoStore(
			{
				ok: errors.length === 0,
				...(errors.length > 0
					? {
							code: "partial_failure",
							message: "WHOOP sync processing completed with errors.",
						}
					: {}),
				liveProcessedJobs,
				backfillProcessedJobs,
				errors,
			},
			{
				status: errors.length === 0 ? 200 : 500,
			}
		);
	} catch (error) {
		logWearableRouteError({
			error,
			phase: "handle_request:process",
			provider: "whoop",
			route: "sync",
		});
		return jsonNoStore(
			{
				ok: false,
				code: "unexpected_error",
				message: "Unexpected WHOOP sync process route failure.",
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
