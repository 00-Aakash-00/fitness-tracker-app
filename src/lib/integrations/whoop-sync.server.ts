import "server-only";

import { createAdminClient } from "@/lib/supabase";
import {
	fetchWhoopBasicProfile,
	fetchWhoopBodyMeasurement,
	fetchWhoopCollectionDocuments,
	fetchWhoopCycleById,
	fetchWhoopRecoveryForCycle,
	fetchWhoopSleepById,
	fetchWhoopWorkoutById,
	isWhoopConfigured,
	isWhoopProviderError,
	type JsonRecord,
	WHOOP_DATA_TYPES,
	type WhoopCollectionDataType,
	type WhoopDataType,
	type WhoopSleep,
} from "./whoop.server";
import { getValidWhoopAccessToken } from "./whoop-connection.server";
import {
	deleteWhoopBodyMeasurement,
	deleteWhoopCycleById,
	deleteWhoopRecoveryByCycleId,
	deleteWhoopRecoveryBySleepId,
	deleteWhoopSleepById,
	deleteWhoopWorkoutById,
	persistWhoopDocuments,
} from "./whoop-storage.server";
import type { WhoopWebhookEvent } from "./whoop-webhooks.server";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const WEBHOOK_PRIORITY = 100;
const REFRESH_PRIORITY = 70;
const RECONCILE_PRIORITY = 50;
const BACKFILL_PRIORITY = 10;
const FULL_HISTORY_LOOKBACK_DAYS = 365 * 15;
const RECONCILE_LOOKBACK_DAYS = 14;
const MAX_JOB_ATTEMPTS = 5;
const JOB_LOCK_TIMEOUT_MS = 15 * 60 * 1000;

type WhoopSyncKind =
	| "refresh"
	| "backfill"
	| "reconcile"
	| "webhook_fetch"
	| "webhook_delete";

type WhoopSyncStatus = "pending" | "processing" | "completed" | "failed";

type WhoopWebhookEventStatus = "queued" | "ignored" | "rejected" | "failed";

type WhoopSyncJobRow = {
	id: string;
	user_id: string;
	fingerprint: string;
	data_type: WhoopDataType;
	sync_kind: WhoopSyncKind;
	status: WhoopSyncStatus;
	priority: number;
	object_id: string | null;
	start_datetime: string | null;
	end_datetime: string | null;
	next_token: string | null;
	attempts: number;
	last_error: string | null;
	available_at: string;
	locked_at: string | null;
	locked_by: string | null;
	created_at: string | null;
	updated_at: string | null;
};

type SyncJobPatch = {
	status?: WhoopSyncStatus;
	priority?: number;
	object_id?: string | null;
	start_datetime?: string | null;
	end_datetime?: string | null;
	next_token?: string | null;
	attempts?: number;
	last_error?: string | null;
	available_at?: string;
	locked_at?: string | null;
	locked_by?: string | null;
};

type ProcessJobsResult = {
	claimed: number;
	completed: number;
	rescheduled: number;
	failed: number;
};

type JobProcessResult = "completed" | "rescheduled";

type ClaimJobFilters = {
	syncKinds?: WhoopSyncKind[];
	minPriority?: number;
};

type WhoopConnectionUserRow = {
	user_id: string;
};

type DateTimeWindow = {
	start: string;
	end: string;
};

function isRecord(value: unknown): value is JsonRecord {
	return typeof value === "object" && value !== null;
}

function sanitizeError(error: unknown): string {
	if (error instanceof Error) {
		return error.message.replace(/\s+/g, " ").trim().slice(0, 500);
	}

	return "Unexpected error";
}

function formatDate(value: Date): string {
	return value.toISOString().slice(0, 10);
}

function getTodayDate(): string {
	return formatDate(new Date());
}

function buildDateKey(): string {
	return getTodayDate();
}

function buildFingerprint(params: {
	syncKind: WhoopSyncKind;
	dataType: WhoopDataType;
	objectId?: string | null;
	dateKey?: string | null;
}): string {
	switch (params.syncKind) {
		case "refresh":
			return `refresh:${params.dataType}:${params.dateKey ?? buildDateKey()}`;
		case "backfill":
			return `backfill:${params.dataType}`;
		case "reconcile":
			return `reconcile:${params.dataType}:${params.dateKey ?? buildDateKey()}`;
		case "webhook_fetch":
			return `webhook_fetch:${params.dataType}:${params.objectId}`;
		case "webhook_delete":
			return `webhook_delete:${params.dataType}:${params.objectId}`;
		default:
			return `${params.syncKind}:${params.dataType}`;
	}
}

function getPriorityForJob(syncKind: WhoopSyncKind): number {
	switch (syncKind) {
		case "webhook_fetch":
		case "webhook_delete":
			return WEBHOOK_PRIORITY;
		case "refresh":
			return REFRESH_PRIORITY;
		case "reconcile":
			return RECONCILE_PRIORITY;
		default:
			return BACKFILL_PRIORITY;
	}
}

function getBackfillWindow(): { start: string; end: string } {
	return {
		start: new Date(
			Date.now() - FULL_HISTORY_LOOKBACK_DAYS * DAY_IN_MS
		).toISOString(),
		end: new Date().toISOString(),
	};
}

function getReconcileWindow(): { start: string; end: string } {
	return {
		start: new Date(
			Date.now() - RECONCILE_LOOKBACK_DAYS * DAY_IN_MS
		).toISOString(),
		end: new Date().toISOString(),
	};
}

function isReconnectError(error: unknown): boolean {
	if (
		isWhoopProviderError(error) &&
		(error.requiresReconnect || error.status === 401)
	) {
		return true;
	}

	return (
		error instanceof Error &&
		/not connected|Reconnect WHOOP|session expired/i.test(error.message)
	);
}

function getSleepCycleId(sleep: WhoopSleep): string {
	return sleep.cycle_id;
}

async function getConnectedWhoopUsers(): Promise<WhoopConnectionUserRow[]> {
	const supabase = createAdminClient();
	const { data, error } = await supabase
		.from("oauth_connections")
		.select("user_id")
		.eq("provider", "whoop");

	if (error) {
		throw error;
	}

	return ((data ?? []) as WhoopConnectionUserRow[]).filter(
		(row) => typeof row.user_id === "string"
	);
}

async function getExistingJob(params: {
	userId: string;
	fingerprint: string;
}): Promise<WhoopSyncJobRow | null> {
	const supabase = createAdminClient();
	const { data, error } = await supabase
		.from("whoop_sync_jobs")
		.select("*")
		.eq("user_id", params.userId)
		.eq("fingerprint", params.fingerprint)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return (data as WhoopSyncJobRow | null) ?? null;
}

async function createOrResetJob(params: {
	userId: string;
	dataType: WhoopDataType;
	syncKind: WhoopSyncKind;
	fingerprint: string;
	objectId?: string | null;
	startDatetime?: string | null;
	endDatetime?: string | null;
	nextToken?: string | null;
	availableAt?: string;
	priority?: number;
}): Promise<void> {
	const existing = await getExistingJob({
		userId: params.userId,
		fingerprint: params.fingerprint,
	});

	const payload = {
		user_id: params.userId,
		fingerprint: params.fingerprint,
		data_type: params.dataType,
		sync_kind: params.syncKind,
		status: "pending" as const,
		priority: params.priority ?? getPriorityForJob(params.syncKind),
		object_id: params.objectId ?? null,
		start_datetime: params.startDatetime ?? null,
		end_datetime: params.endDatetime ?? null,
		next_token: params.nextToken ?? null,
		attempts: 0,
		last_error: null,
		available_at: params.availableAt ?? new Date().toISOString(),
		locked_at: null,
		locked_by: null,
	};

	const supabase = createAdminClient();

	if (existing) {
		if (existing.status === "processing") {
			return;
		}

		const { error } = await supabase
			.from("whoop_sync_jobs")
			.update(payload)
			.eq("id", existing.id);

		if (error) {
			throw error;
		}

		return;
	}

	const { error } = await supabase.from("whoop_sync_jobs").insert(payload);

	if (error) {
		throw error;
	}
}

async function updateJob(id: string, patch: SyncJobPatch): Promise<void> {
	const supabase = createAdminClient();
	const { error } = await supabase
		.from("whoop_sync_jobs")
		.update(patch)
		.eq("id", id);

	if (error) {
		throw error;
	}
}

async function completeJob(id: string): Promise<void> {
	await updateJob(id, {
		status: "completed",
		next_token: null,
		attempts: 0,
		last_error: null,
		locked_at: null,
		locked_by: null,
		available_at: new Date().toISOString(),
	});
}

async function rescheduleJob(
	id: string,
	patch: Omit<SyncJobPatch, "status">
): Promise<void> {
	await updateJob(id, {
		...patch,
		status: "pending",
		attempts: 0,
		last_error: null,
		locked_at: null,
		locked_by: null,
		available_at: patch.available_at ?? new Date().toISOString(),
	});
}

function getRetryDelayMs(attempt: number, error: unknown): number {
	const multiplier = Math.max(1, attempt);
	const baseMs =
		error instanceof Error && /rate limit/i.test(error.message)
			? 5 * 60 * 1000
			: 60 * 1000;

	return Math.min(baseMs * 2 ** (multiplier - 1), 60 * 60 * 1000);
}

async function failJob(job: WhoopSyncJobRow, error: unknown): Promise<void> {
	const nextAttempts = Math.max(0, job.attempts ?? 0) + 1;
	const message = sanitizeError(error);

	if (nextAttempts >= MAX_JOB_ATTEMPTS || isReconnectError(error)) {
		await updateJob(job.id, {
			status: "failed",
			attempts: nextAttempts,
			last_error: message,
			locked_at: null,
			locked_by: null,
		});
		return;
	}

	await updateJob(job.id, {
		status: "pending",
		attempts: nextAttempts,
		last_error: message,
		locked_at: null,
		locked_by: null,
		available_at: new Date(
			Date.now() + getRetryDelayMs(nextAttempts, error)
		).toISOString(),
	});
}

async function claimNextJob(
	workerId: string,
	filters?: ClaimJobFilters
): Promise<WhoopSyncJobRow | null> {
	const supabase = createAdminClient();
	const nowIso = new Date().toISOString();
	let query = supabase
		.from("whoop_sync_jobs")
		.select("*")
		.eq("status", "pending")
		.lte("available_at", nowIso);

	if (typeof filters?.minPriority === "number") {
		query = query.gte("priority", filters.minPriority);
	}

	if (filters?.syncKinds?.length) {
		query = query.in("sync_kind", filters.syncKinds);
	}

	const { data, error } = await query
		.order("priority", { ascending: false })
		.order("created_at", { ascending: true })
		.limit(10);

	if (error) {
		throw error;
	}

	for (const candidate of (data ?? []) as WhoopSyncJobRow[]) {
		const { data: claimed, error: claimError } = await supabase
			.from("whoop_sync_jobs")
			.update({
				status: "processing",
				locked_at: nowIso,
				locked_by: workerId,
			})
			.eq("id", candidate.id)
			.eq("status", "pending")
			.select("*")
			.maybeSingle();

		if (claimError) {
			throw claimError;
		}

		if (claimed) {
			return claimed as WhoopSyncJobRow;
		}
	}

	return null;
}

async function selectWhoopIdsByStartWindow(params: {
	table: "whoop_cycles" | "whoop_sleeps" | "whoop_workouts";
	idColumn: "whoop_cycle_id" | "whoop_sleep_id" | "whoop_workout_id";
	userId: string;
	window: DateTimeWindow;
}): Promise<string[]> {
	const supabase = createAdminClient();
	const { data, error } = await supabase
		.from(params.table)
		.select(params.idColumn)
		.eq("user_id", params.userId)
		.gte("start_at", params.window.start)
		.lte("start_at", params.window.end);

	if (error) {
		throw error;
	}

	return ((data ?? []) as Array<Record<string, unknown>>)
		.map((row) =>
			typeof row[params.idColumn] === "string" ? row[params.idColumn] : null
		)
		.filter((value): value is string => value !== null);
}

function getWhoopCollectionRecordId(
	dataType: WhoopCollectionDataType,
	record: JsonRecord
): string | null {
	switch (dataType) {
		case "cycle":
		case "sleep":
		case "workout":
			return typeof record.id === "string" && record.id.length > 0
				? record.id
				: null;
		case "recovery":
			return typeof record.cycle_id === "string" && record.cycle_id.length > 0
				? record.cycle_id
				: null;
	}
}

async function deleteMissingWhoopCollectionRecords(params: {
	userId: string;
	dataType: WhoopCollectionDataType;
	window: DateTimeWindow;
	records: JsonRecord[];
}): Promise<void> {
	const keepIds = new Set<string>();

	for (const record of params.records) {
		const recordId = getWhoopCollectionRecordId(params.dataType, record);
		if (recordId) {
			keepIds.add(recordId);
		}
	}

	switch (params.dataType) {
		case "cycle": {
			const localIds = await selectWhoopIdsByStartWindow({
				table: "whoop_cycles",
				idColumn: "whoop_cycle_id",
				userId: params.userId,
				window: params.window,
			});

			for (const cycleId of localIds) {
				if (keepIds.has(cycleId)) {
					continue;
				}

				await deleteWhoopCycleById({
					userId: params.userId,
					cycleId,
				});
			}

			return;
		}
		case "sleep": {
			const localIds = await selectWhoopIdsByStartWindow({
				table: "whoop_sleeps",
				idColumn: "whoop_sleep_id",
				userId: params.userId,
				window: params.window,
			});

			for (const sleepId of localIds) {
				if (keepIds.has(sleepId)) {
					continue;
				}

				await deleteWhoopSleepById({
					userId: params.userId,
					sleepId,
				});
				await deleteWhoopRecoveryBySleepId({
					userId: params.userId,
					sleepId,
				});
			}

			return;
		}
		case "workout": {
			const localIds = await selectWhoopIdsByStartWindow({
				table: "whoop_workouts",
				idColumn: "whoop_workout_id",
				userId: params.userId,
				window: params.window,
			});

			for (const workoutId of localIds) {
				if (keepIds.has(workoutId)) {
					continue;
				}

				await deleteWhoopWorkoutById({
					userId: params.userId,
					workoutId,
				});
			}

			return;
		}
		case "recovery": {
			const [localCycleIds, localSleepIds] = await Promise.all([
				selectWhoopIdsByStartWindow({
					table: "whoop_cycles",
					idColumn: "whoop_cycle_id",
					userId: params.userId,
					window: params.window,
				}),
				selectWhoopIdsByStartWindow({
					table: "whoop_sleeps",
					idColumn: "whoop_sleep_id",
					userId: params.userId,
					window: params.window,
				}),
			]);

			if (localCycleIds.length === 0 && localSleepIds.length === 0) {
				return;
			}

			const cycleIdSet = new Set(localCycleIds);
			const sleepIdSet = new Set(localSleepIds);
			const supabase = createAdminClient();
			const { data, error } = await supabase
				.from("whoop_recoveries")
				.select("whoop_cycle_id, whoop_sleep_id")
				.eq("user_id", params.userId);

			if (error) {
				throw error;
			}

			for (const row of (data ?? []) as Array<{
				whoop_cycle_id: string;
				whoop_sleep_id: string | null;
			}>) {
				const isInWindow =
					cycleIdSet.has(row.whoop_cycle_id) ||
					(typeof row.whoop_sleep_id === "string" &&
						sleepIdSet.has(row.whoop_sleep_id));

				if (!isInWindow || keepIds.has(row.whoop_cycle_id)) {
					continue;
				}

				await deleteWhoopRecoveryByCycleId({
					userId: params.userId,
					cycleId: row.whoop_cycle_id,
				});
			}
		}
	}
}

async function processProfileJob(
	job: WhoopSyncJobRow,
	accessToken: string
): Promise<JobProcessResult> {
	const profile = await fetchWhoopBasicProfile(accessToken);
	await persistWhoopDocuments({
		userId: job.user_id,
		dataType: "profile",
		documents: [profile],
	});
	await completeJob(job.id);
	return "completed";
}

async function processBodyMeasurementJob(
	job: WhoopSyncJobRow,
	accessToken: string
): Promise<JobProcessResult> {
	try {
		const bodyMeasurement = await fetchWhoopBodyMeasurement(accessToken);
		await persistWhoopDocuments({
			userId: job.user_id,
			dataType: "body_measurement",
			documents: [bodyMeasurement],
		});
	} catch (error) {
		if (isWhoopProviderError(error) && error.status === 404) {
			await deleteWhoopBodyMeasurement({
				userId: job.user_id,
			});
			await completeJob(job.id);
			return "completed";
		}

		throw error;
	}

	await completeJob(job.id);
	return "completed";
}

async function processCollectionJob(
	job: WhoopSyncJobRow,
	accessToken: string
): Promise<JobProcessResult> {
	if (!job.start_datetime || !job.end_datetime) {
		const window =
			job.sync_kind === "reconcile"
				? getReconcileWindow()
				: getBackfillWindow();

		await rescheduleJob(job.id, {
			start_datetime: window.start,
			end_datetime: window.end,
			next_token: job.next_token,
		});
		return "rescheduled";
	}

	if (job.sync_kind === "reconcile") {
		const records: JsonRecord[] = [];
		let nextToken = job.next_token;

		do {
			const response = await fetchWhoopCollectionDocuments({
				accessToken,
				dataType: job.data_type as WhoopCollectionDataType,
				query: {
					start: job.start_datetime,
					end: job.end_datetime,
					nextToken,
				},
			});

			records.push(...response.records.filter(isRecord));
			nextToken = response.nextToken;
		} while (nextToken);

		if (records.length > 0) {
			await persistWhoopDocuments({
				userId: job.user_id,
				dataType: job.data_type,
				documents: records,
			});
		}

		await deleteMissingWhoopCollectionRecords({
			userId: job.user_id,
			dataType: job.data_type as WhoopCollectionDataType,
			window: {
				start: job.start_datetime,
				end: job.end_datetime,
			},
			records,
		});

		await completeJob(job.id);
		return "completed";
	}

	const response = await fetchWhoopCollectionDocuments({
		accessToken,
		dataType: job.data_type as WhoopCollectionDataType,
		query: {
			start: job.start_datetime,
			end: job.end_datetime,
			nextToken: job.next_token,
		},
	});

	if (response.records.length > 0) {
		await persistWhoopDocuments({
			userId: job.user_id,
			dataType: job.data_type,
			documents: response.records,
		});
	}

	if (response.nextToken) {
		await rescheduleJob(job.id, {
			start_datetime: job.start_datetime,
			end_datetime: job.end_datetime,
			next_token: response.nextToken,
		});
		return "rescheduled";
	}

	await completeJob(job.id);
	return "completed";
}

async function refreshCycleAndRecoveryFromSleep(params: {
	userId: string;
	accessToken: string;
	sleep: WhoopSleep;
}): Promise<void> {
	const cycle = await fetchWhoopCycleById({
		accessToken: params.accessToken,
		cycleId: getSleepCycleId(params.sleep),
	});

	await persistWhoopDocuments({
		userId: params.userId,
		dataType: "cycle",
		documents: [cycle],
	});

	try {
		const recovery = await fetchWhoopRecoveryForCycle({
			accessToken: params.accessToken,
			cycleId: cycle.id,
		});

		await persistWhoopDocuments({
			userId: params.userId,
			dataType: "recovery",
			documents: [recovery],
		});
	} catch (error) {
		if (isWhoopProviderError(error) && error.status === 404) {
			await deleteWhoopRecoveryByCycleId({
				userId: params.userId,
				cycleId: cycle.id,
			});
			return;
		}

		throw error;
	}
}

async function processSleepLinkedWebhookFetch(params: {
	job: WhoopSyncJobRow;
	accessToken: string;
}): Promise<JobProcessResult> {
	if (!params.job.object_id) {
		await completeJob(params.job.id);
		return "completed";
	}

	try {
		const sleep = await fetchWhoopSleepById({
			accessToken: params.accessToken,
			sleepId: params.job.object_id,
		});

		await persistWhoopDocuments({
			userId: params.job.user_id,
			dataType: "sleep",
			documents: [sleep],
		});

		await refreshCycleAndRecoveryFromSleep({
			userId: params.job.user_id,
			accessToken: params.accessToken,
			sleep,
		});

		await completeJob(params.job.id);
		return "completed";
	} catch (error) {
		if (isWhoopProviderError(error) && error.status === 404) {
			await deleteWhoopSleepById({
				userId: params.job.user_id,
				sleepId: params.job.object_id,
			});
			await deleteWhoopRecoveryBySleepId({
				userId: params.job.user_id,
				sleepId: params.job.object_id,
			});
			await completeJob(params.job.id);
			return "completed";
		}

		throw error;
	}
}

async function processWebhookFetchJob(
	job: WhoopSyncJobRow,
	accessToken: string
): Promise<JobProcessResult> {
	if (!job.object_id) {
		await completeJob(job.id);
		return "completed";
	}

	switch (job.data_type) {
		case "workout": {
			try {
				const workout = await fetchWhoopWorkoutById({
					accessToken,
					workoutId: job.object_id,
				});

				await persistWhoopDocuments({
					userId: job.user_id,
					dataType: "workout",
					documents: [workout],
				});
			} catch (error) {
				if (isWhoopProviderError(error) && error.status === 404) {
					await deleteWhoopWorkoutById({
						userId: job.user_id,
						workoutId: job.object_id,
					});
					await completeJob(job.id);
					return "completed";
				}

				throw error;
			}

			await completeJob(job.id);
			return "completed";
		}
		case "sleep":
			return processSleepLinkedWebhookFetch({ job, accessToken });
		case "recovery":
			// WHOOP recovery webhooks use the related sleep UUID as the object id.
			return processSleepLinkedWebhookFetch({ job, accessToken });
		default:
			await completeJob(job.id);
			return "completed";
	}
}

async function processWebhookDeleteJob(
	job: WhoopSyncJobRow
): Promise<JobProcessResult> {
	if (!job.object_id) {
		await completeJob(job.id);
		return "completed";
	}

	switch (job.data_type) {
		case "workout":
			await deleteWhoopWorkoutById({
				userId: job.user_id,
				workoutId: job.object_id,
			});
			break;
		case "sleep":
			await deleteWhoopSleepById({
				userId: job.user_id,
				sleepId: job.object_id,
			});
			await deleteWhoopRecoveryBySleepId({
				userId: job.user_id,
				sleepId: job.object_id,
			});
			break;
		case "recovery":
			await deleteWhoopRecoveryBySleepId({
				userId: job.user_id,
				sleepId: job.object_id,
			});
			break;
		default:
			break;
	}

	await completeJob(job.id);
	return "completed";
}

async function processClaimedJob(
	job: WhoopSyncJobRow
): Promise<JobProcessResult> {
	if (!isWhoopConfigured()) {
		throw new Error("WHOOP is not configured in this environment.");
	}

	const accessToken = await getValidWhoopAccessToken({
		supabaseUserId: job.user_id,
	}).catch(async (error) => {
		if (isReconnectError(error)) {
			await completeJob(job.id);
			return null;
		}

		throw error;
	});

	if (!accessToken) {
		return "completed";
	}

	switch (job.sync_kind) {
		case "refresh":
			if (job.data_type === "profile") {
				return processProfileJob(job, accessToken);
			}

			if (job.data_type === "body_measurement") {
				return processBodyMeasurementJob(job, accessToken);
			}

			await completeJob(job.id);
			return "completed";
		case "backfill":
		case "reconcile":
			return processCollectionJob(job, accessToken);
		case "webhook_fetch":
			return processWebhookFetchJob(job, accessToken);
		case "webhook_delete":
			return processWebhookDeleteJob(job);
		default:
			await completeJob(job.id);
			return "completed";
	}
}

function getWebhookDataType(
	eventType: WhoopWebhookEvent["type"]
): WhoopDataType {
	if (eventType.startsWith("workout.")) {
		return "workout";
	}

	if (eventType.startsWith("sleep.")) {
		return "sleep";
	}

	return "recovery";
}

export async function enqueueInitialWhoopSyncJobs(params: {
	userId: string;
}): Promise<void> {
	const backfillWindow = getBackfillWindow();

	await createOrResetJob({
		userId: params.userId,
		dataType: "profile",
		syncKind: "refresh",
		fingerprint: buildFingerprint({
			syncKind: "refresh",
			dataType: "profile",
		}),
	});

	await createOrResetJob({
		userId: params.userId,
		dataType: "body_measurement",
		syncKind: "refresh",
		fingerprint: buildFingerprint({
			syncKind: "refresh",
			dataType: "body_measurement",
		}),
	});

	for (const dataType of WHOOP_DATA_TYPES) {
		if (dataType === "profile" || dataType === "body_measurement") {
			continue;
		}

		await createOrResetJob({
			userId: params.userId,
			dataType,
			syncKind: "backfill",
			fingerprint: buildFingerprint({
				syncKind: "backfill",
				dataType,
			}),
			startDatetime: backfillWindow.start,
			endDatetime: backfillWindow.end,
		});
	}
}

export async function enqueueRollingWhoopRefreshJobs(): Promise<number> {
	const users = await getConnectedWhoopUsers();
	if (users.length === 0) {
		return 0;
	}

	const dateKey = buildDateKey();
	let count = 0;

	for (const user of users) {
		for (const dataType of ["profile", "body_measurement"] as const) {
			await createOrResetJob({
				userId: user.user_id,
				dataType,
				syncKind: "refresh",
				fingerprint: buildFingerprint({
					syncKind: "refresh",
					dataType,
					dateKey,
				}),
			});
			count += 1;
		}
	}

	return count;
}

export async function enqueueRollingWhoopReconcileJobs(): Promise<number> {
	const users = await getConnectedWhoopUsers();
	if (users.length === 0) {
		return 0;
	}

	const dateKey = buildDateKey();
	const window = getReconcileWindow();
	let count = 0;

	for (const user of users) {
		for (const dataType of ["cycle", "sleep", "recovery", "workout"] as const) {
			await createOrResetJob({
				userId: user.user_id,
				dataType,
				syncKind: "reconcile",
				fingerprint: buildFingerprint({
					syncKind: "reconcile",
					dataType,
					dateKey,
				}),
				startDatetime: window.start,
				endDatetime: window.end,
			});
			count += 1;
		}
	}

	return count;
}

export async function enqueueWhoopWebhookSync(params: {
	userId: string;
	payload: WhoopWebhookEvent;
}): Promise<void> {
	const dataType = getWebhookDataType(params.payload.type);
	const syncKind = params.payload.type.endsWith(".deleted")
		? "webhook_delete"
		: "webhook_fetch";

	await createOrResetJob({
		userId: params.userId,
		dataType,
		syncKind,
		fingerprint: buildFingerprint({
			syncKind,
			dataType,
			objectId: params.payload.id,
		}),
		objectId: params.payload.id,
	});
}

export async function recordWhoopWebhookEvent(params: {
	userId?: string | null;
	providerUserId?: string | null;
	payload: unknown;
	signature?: string | null;
	timestampHeader?: string | null;
	status: WhoopWebhookEventStatus;
	errorText?: string | null;
}) {
	const payloadRecord = isRecord(params.payload)
		? params.payload
		: { raw_body: String(params.payload ?? "") };

	const supabase = createAdminClient();
	const { error } = await supabase.from("whoop_webhook_events").insert({
		user_id: params.userId ?? null,
		provider_user_id:
			params.providerUserId ??
			(typeof payloadRecord.user_id === "number" ||
			typeof payloadRecord.user_id === "string"
				? String(payloadRecord.user_id)
				: null),
		event_type:
			typeof payloadRecord.type === "string" ? payloadRecord.type : null,
		object_id:
			typeof payloadRecord.id === "string" ||
			typeof payloadRecord.id === "number"
				? String(payloadRecord.id)
				: null,
		trace_id:
			typeof payloadRecord.trace_id === "string"
				? payloadRecord.trace_id
				: null,
		signature: params.signature ?? null,
		timestamp_header: params.timestampHeader ?? null,
		payload: payloadRecord,
		status: params.status,
		error_text: params.errorText ?? null,
	});

	if (error) {
		throw error;
	}
}

export async function purgeWhoopSyncArtifacts(params: {
	userId: string;
}): Promise<void> {
	const supabase = createAdminClient();

	const { error: jobsError } = await supabase
		.from("whoop_sync_jobs")
		.delete()
		.eq("user_id", params.userId);

	if (jobsError) {
		throw jobsError;
	}

	const { error: eventsError } = await supabase
		.from("whoop_webhook_events")
		.delete()
		.eq("user_id", params.userId);

	if (eventsError) {
		throw eventsError;
	}
}

export async function recoverStaleWhoopSyncJobs(): Promise<number> {
	const cutoffIso = new Date(Date.now() - JOB_LOCK_TIMEOUT_MS).toISOString();
	const supabase = createAdminClient();
	const { data, error } = await supabase
		.from("whoop_sync_jobs")
		.update({
			status: "pending",
			locked_at: null,
			locked_by: null,
			available_at: new Date().toISOString(),
		})
		.eq("status", "processing")
		.lt("locked_at", cutoffIso)
		.select("id");

	if (error) {
		throw error;
	}

	return (data ?? []).length;
}

export async function processPendingWhoopSyncJobs(params?: {
	limit?: number;
	workerId?: string;
	syncKinds?: WhoopSyncKind[];
	minPriority?: number;
}): Promise<ProcessJobsResult> {
	const result: ProcessJobsResult = {
		claimed: 0,
		completed: 0,
		rescheduled: 0,
		failed: 0,
	};
	const limit = Math.max(1, params?.limit ?? 10);
	const workerId =
		params?.workerId ?? `whoop-sync-${process.pid}-${Date.now().toString(36)}`;

	for (let index = 0; index < limit; index += 1) {
		const job = await claimNextJob(workerId, {
			syncKinds: params?.syncKinds,
			minPriority: params?.minPriority,
		});
		if (!job) {
			break;
		}

		result.claimed += 1;

		try {
			const outcome = await processClaimedJob(job);
			if (outcome === "completed") {
				result.completed += 1;
			} else {
				result.rescheduled += 1;
			}
		} catch (error) {
			result.failed += 1;
			await failJob(job, error);
		}
	}

	return result;
}
