import "server-only";

import { createAdminClient } from "@/lib/supabase";
import {
	buildOuraWebhookUrl,
	createOuraWebhookSubscription,
	deleteOuraWebhookSubscription,
	fetchOuraCollectionDocuments,
	fetchOuraPersonalInfo,
	fetchOuraSingleDocument,
	getConfiguredOuraAppOrigin,
	getOuraWebhookVerificationToken,
	hasOuraSingleDocumentPath,
	isOuraConfigured,
	listOuraWebhookSubscriptions,
	OURA_DATA_TYPES,
	OURA_WEBHOOK_DATA_TYPES,
	OURA_WEBHOOK_OPERATIONS,
	type OuraDataType,
	type OuraWebhookDataType,
	type OuraWebhookOperation,
	renewOuraWebhookSubscription,
	shouldRenewOuraWebhookSubscription,
	updateOuraWebhookSubscription,
} from "./oura.server";
import { getValidOuraAccessToken } from "./oura-connection.server";
import {
	deleteOuraDocumentById,
	getOldestOuraRingSetupAt,
	persistOuraDocuments,
	persistOuraPersonalInfo,
} from "./oura-storage.server";
import type { OuraWebhookPayload } from "./oura-webhooks.server";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const BACKFILL_PRIORITY = 10;
const PRIORITY_RING_CONFIGURATION = 15;
const PRIORITY_PERSONAL_INFO = 14;
const RECONCILE_PRIORITY = 50;
const WEBHOOK_PRIORITY = 100;
const DATE_BACKFILL_WINDOW_DAYS = 90;
const HEARTRATE_BACKFILL_WINDOW_DAYS = 14;
const RECONCILE_LOOKBACK_DAYS = 7;
const DEFAULT_HISTORY_LOOKBACK_DAYS = 3650;
const MAX_JOB_ATTEMPTS = 5;
const JOB_LOCK_TIMEOUT_MS = 15 * 60 * 1000;

type JsonRecord = Record<string, unknown>;

type OuraSyncKind =
	| "backfill"
	| "reconcile"
	| "webhook_fetch"
	| "webhook_delete";

type OuraSyncStatus = "pending" | "processing" | "completed" | "failed";

type OuraWebhookEventStatus = "queued" | "ignored" | "rejected" | "failed";

type OuraSyncJobRow = {
	id: string;
	user_id: string;
	fingerprint: string;
	data_type: OuraDataType;
	sync_kind: OuraSyncKind;
	status: OuraSyncStatus;
	priority: number;
	object_id: string | null;
	start_date: string | null;
	end_date: string | null;
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

type OuraConnectionUserRow = {
	user_id: string;
	provider_user_id: string | null;
};

type SyncJobPatch = {
	status?: OuraSyncStatus;
	priority?: number;
	object_id?: string | null;
	start_date?: string | null;
	end_date?: string | null;
	start_datetime?: string | null;
	end_datetime?: string | null;
	next_token?: string | null;
	attempts?: number;
	last_error?: string | null;
	available_at?: string;
	locked_at?: string | null;
	locked_by?: string | null;
};

type DateWindow = {
	startDate: string;
	endDate: string;
};

type DateTimeWindow = {
	startDatetime: string;
	endDatetime: string;
};

type ProcessJobsResult = {
	claimed: number;
	completed: number;
	rescheduled: number;
	failed: number;
};

type JobProcessResult = "completed" | "rescheduled";

function isRecord(value: unknown): value is JsonRecord {
	return typeof value === "object" && value !== null;
}

function formatDate(value: Date): string {
	return value.toISOString().slice(0, 10);
}

function parseDate(value: string): Date {
	return new Date(`${value}T00:00:00.000Z`);
}

function addDays(value: Date, days: number): Date {
	return new Date(value.getTime() + days * DAY_IN_MS);
}

function maxDateString(left: string, right: string): string {
	return left > right ? left : right;
}

function sanitizeError(error: unknown): string {
	if (error instanceof Error) {
		return error.message.replace(/\s+/g, " ").trim().slice(0, 500);
	}

	return "Unexpected error";
}

function parseTimestamp(value: string | null | undefined): string | null {
	if (!value) return null;
	const timestamp = Date.parse(value);
	return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function getBackfillPriority(dataType: OuraDataType): number {
	if (dataType === "ring_configuration") {
		return PRIORITY_RING_CONFIGURATION;
	}

	if (dataType === "personal_info") {
		return PRIORITY_PERSONAL_INFO;
	}

	return BACKFILL_PRIORITY;
}

function getPriorityForJob(params: {
	syncKind: OuraSyncKind;
	dataType: OuraDataType;
}): number {
	if (
		params.syncKind === "webhook_fetch" ||
		params.syncKind === "webhook_delete"
	) {
		return WEBHOOK_PRIORITY;
	}

	if (params.syncKind === "reconcile") {
		return RECONCILE_PRIORITY;
	}

	return getBackfillPriority(params.dataType);
}

function getTodayDate(): string {
	return formatDate(new Date());
}

function buildFingerprint(params: {
	syncKind: OuraSyncKind;
	dataType: OuraDataType;
	objectId?: string | null;
	dateKey?: string | null;
}): string {
	switch (params.syncKind) {
		case "backfill":
			return `backfill:${params.dataType}`;
		case "reconcile":
			return `reconcile:${params.dataType}:${params.dateKey ?? getTodayDate()}`;
		case "webhook_fetch":
			return `webhook_fetch:${params.dataType}:${params.objectId}`;
		case "webhook_delete":
			return `webhook_delete:${params.dataType}:${params.objectId}`;
		default:
			return `${params.syncKind}:${params.dataType}`;
	}
}

function isReconnectError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}

	return /not connected|Reconnect Oura|session expired/i.test(error.message);
}

async function getConnectedOuraUsers(): Promise<OuraConnectionUserRow[]> {
	const supabase = createAdminClient();
	const { data, error } = await supabase
		.from("oauth_connections")
		.select("user_id, provider_user_id")
		.eq("provider", "oura");

	if (error) {
		throw error;
	}

	return ((data ?? []) as OuraConnectionUserRow[]).filter(
		(row) => typeof row.user_id === "string"
	);
}

async function getExistingJob(params: {
	userId: string;
	fingerprint: string;
}): Promise<OuraSyncJobRow | null> {
	const supabase = createAdminClient();
	const { data, error } = await supabase
		.from("oura_sync_jobs")
		.select("*")
		.eq("user_id", params.userId)
		.eq("fingerprint", params.fingerprint)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return (data as OuraSyncJobRow | null) ?? null;
}

async function createOrResetJob(params: {
	userId: string;
	dataType: OuraDataType;
	syncKind: OuraSyncKind;
	fingerprint: string;
	objectId?: string | null;
	startDate?: string | null;
	endDate?: string | null;
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

	const priority =
		params.priority ??
		getPriorityForJob({
			syncKind: params.syncKind,
			dataType: params.dataType,
		});

	const payload = {
		user_id: params.userId,
		fingerprint: params.fingerprint,
		data_type: params.dataType,
		sync_kind: params.syncKind,
		status: "pending" as const,
		priority,
		object_id: params.objectId ?? null,
		start_date: params.startDate ?? null,
		end_date: params.endDate ?? null,
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
			.from("oura_sync_jobs")
			.update(payload)
			.eq("id", existing.id);

		if (error) {
			throw error;
		}

		return;
	}

	const { error } = await supabase.from("oura_sync_jobs").insert(payload);

	if (error) {
		throw error;
	}
}

async function updateJob(id: string, patch: SyncJobPatch): Promise<void> {
	const supabase = createAdminClient();
	const { error } = await supabase
		.from("oura_sync_jobs")
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

async function failJob(job: OuraSyncJobRow, error: unknown): Promise<void> {
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

async function claimNextJob(workerId: string): Promise<OuraSyncJobRow | null> {
	const supabase = createAdminClient();
	const nowIso = new Date().toISOString();
	const { data, error } = await supabase
		.from("oura_sync_jobs")
		.select("*")
		.eq("status", "pending")
		.lte("available_at", nowIso)
		.order("priority", { ascending: false })
		.order("created_at", { ascending: true })
		.limit(10);

	if (error) {
		throw error;
	}

	for (const candidate of (data ?? []) as OuraSyncJobRow[]) {
		const { data: claimed, error: claimError } = await supabase
			.from("oura_sync_jobs")
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

		if (claimed?.id) {
			return claimed as OuraSyncJobRow;
		}
	}

	return null;
}

function getDefaultBackfillLowerBoundDate(): string {
	return formatDate(addDays(new Date(), -DEFAULT_HISTORY_LOOKBACK_DAYS));
}

async function seedRingConfigurationHistory(params: {
	userId: string;
	accessToken: string;
}): Promise<void> {
	let nextToken: string | null = null;

	do {
		const response: Awaited<
			ReturnType<typeof fetchOuraCollectionDocuments<unknown>>
		> = await fetchOuraCollectionDocuments<unknown>({
			accessToken: params.accessToken,
			dataType: "ring_configuration",
			query: {
				nextToken,
			},
		});

		if (response.data.length > 0) {
			await persistOuraDocuments({
				userId: params.userId,
				dataType: "ring_configuration",
				documents: response.data,
			});
		}

		nextToken = response.nextToken;
	} while (nextToken);
}

async function getBackfillLowerBoundDate(params: {
	userId: string;
	accessToken: string;
}): Promise<string> {
	let oldestSetupAt = await getOldestOuraRingSetupAt({
		userId: params.userId,
	});

	if (!oldestSetupAt) {
		await seedRingConfigurationHistory(params);
		oldestSetupAt = await getOldestOuraRingSetupAt({
			userId: params.userId,
		});
	}

	const parsed = parseTimestamp(oldestSetupAt);
	if (!parsed) {
		return getDefaultBackfillLowerBoundDate();
	}

	return formatDate(new Date(parsed));
}

async function getBackfillLowerBoundDatetime(params: {
	userId: string;
	accessToken: string;
}): Promise<string> {
	let oldestSetupAt = await getOldestOuraRingSetupAt({
		userId: params.userId,
	});

	if (!oldestSetupAt) {
		await seedRingConfigurationHistory(params);
		oldestSetupAt = await getOldestOuraRingSetupAt({
			userId: params.userId,
		});
	}

	return (
		parseTimestamp(oldestSetupAt) ??
		new Date(
			Date.now() - DEFAULT_HISTORY_LOOKBACK_DAYS * DAY_IN_MS
		).toISOString()
	);
}

function getInitialDateWindow(lowerBoundDate: string): DateWindow {
	const today = getTodayDate();
	const initialStart = formatDate(
		addDays(parseDate(today), -(DATE_BACKFILL_WINDOW_DAYS - 1))
	);

	return {
		startDate: maxDateString(lowerBoundDate, initialStart),
		endDate: today,
	};
}

function getPreviousDateWindow(
	currentStartDate: string,
	lowerBoundDate: string
): DateWindow | null {
	if (currentStartDate <= lowerBoundDate) {
		return null;
	}

	const previousEndDate = formatDate(addDays(parseDate(currentStartDate), -1));
	if (previousEndDate < lowerBoundDate) {
		return null;
	}

	const previousStartCandidate = formatDate(
		addDays(parseDate(previousEndDate), -(DATE_BACKFILL_WINDOW_DAYS - 1))
	);

	return {
		startDate: maxDateString(lowerBoundDate, previousStartCandidate),
		endDate: previousEndDate,
	};
}

function getInitialDateTimeWindow(lowerBound: string): DateTimeWindow {
	const end = new Date();
	const lowerBoundDate = new Date(lowerBound);
	const startCandidate = new Date(
		end.getTime() - HEARTRATE_BACKFILL_WINDOW_DAYS * DAY_IN_MS
	);
	const start =
		startCandidate < lowerBoundDate ? lowerBoundDate : startCandidate;

	return {
		startDatetime: start.toISOString(),
		endDatetime: end.toISOString(),
	};
}

function getPreviousDateTimeWindow(
	currentStartDatetime: string,
	lowerBound: string
): DateTimeWindow | null {
	const currentStart = new Date(currentStartDatetime);
	const lowerBoundDate = new Date(lowerBound);

	if (currentStart <= lowerBoundDate) {
		return null;
	}

	const previousEnd = new Date(currentStart.getTime() - 1000);
	if (previousEnd < lowerBoundDate) {
		return null;
	}

	const previousStartCandidate = new Date(
		previousEnd.getTime() - HEARTRATE_BACKFILL_WINDOW_DAYS * DAY_IN_MS
	);
	const previousStart =
		previousStartCandidate < lowerBoundDate
			? lowerBoundDate
			: previousStartCandidate;

	return {
		startDatetime: previousStart.toISOString(),
		endDatetime: previousEnd.toISOString(),
	};
}

function getReconcileDateWindow(): DateWindow {
	const endDate = getTodayDate();
	return {
		startDate: formatDate(
			addDays(parseDate(endDate), -(RECONCILE_LOOKBACK_DAYS - 1))
		),
		endDate,
	};
}

function getReconcileDateTimeWindow(): DateTimeWindow {
	const end = new Date();
	return {
		startDatetime: new Date(
			end.getTime() - RECONCILE_LOOKBACK_DAYS * DAY_IN_MS
		).toISOString(),
		endDatetime: end.toISOString(),
	};
}

function getDateWindowFromJob(
	job: OuraSyncJobRow,
	lowerBoundDate: string
): DateWindow {
	if (job.sync_kind === "reconcile") {
		return {
			startDate: job.start_date ?? getReconcileDateWindow().startDate,
			endDate: job.end_date ?? getReconcileDateWindow().endDate,
		};
	}

	if (job.start_date && job.end_date) {
		return {
			startDate: job.start_date,
			endDate: job.end_date,
		};
	}

	return getInitialDateWindow(lowerBoundDate);
}

function getDateTimeWindowFromJob(
	job: OuraSyncJobRow,
	lowerBoundDatetime: string
): DateTimeWindow {
	if (job.sync_kind === "reconcile") {
		return {
			startDatetime:
				job.start_datetime ?? getReconcileDateTimeWindow().startDatetime,
			endDatetime: job.end_datetime ?? getReconcileDateTimeWindow().endDatetime,
		};
	}

	if (job.start_datetime && job.end_datetime) {
		return {
			startDatetime: job.start_datetime,
			endDatetime: job.end_datetime,
		};
	}

	return getInitialDateTimeWindow(lowerBoundDatetime);
}

async function deleteMissingCardiovascularAgeRows(params: {
	userId: string;
	window: DateWindow;
	documents: unknown[];
}): Promise<void> {
	const days = params.documents
		.filter((document): document is JsonRecord => isRecord(document))
		.map((document) => (typeof document.day === "string" ? document.day : null))
		.filter((day): day is string => Boolean(day));

	const supabase = createAdminClient();
	let query = supabase
		.from("oura_daily_cardiovascular_age")
		.delete()
		.eq("user_id", params.userId)
		.gte("day", params.window.startDate)
		.lte("day", params.window.endDate);

	if (days.length > 0) {
		query = query.not(
			"day",
			"in",
			`(${days.map((day) => `"${day}"`).join(",")})`
		);
	}

	const { error } = await query;

	if (error) {
		throw error;
	}
}

async function selectOuraDocumentIdsByDateColumn(params: {
	table:
		| "oura_tags"
		| "oura_workouts"
		| "oura_sessions"
		| "oura_daily_activity"
		| "oura_daily_sleep"
		| "oura_daily_spo2"
		| "oura_daily_readiness"
		| "oura_sleep"
		| "oura_sleep_time"
		| "oura_daily_stress"
		| "oura_daily_resilience"
		| "oura_vo2_max";
	column: "day";
	userId: string;
	window: DateWindow;
}): Promise<string[]> {
	const supabase = createAdminClient();
	const { data, error } = await supabase
		.from(params.table)
		.select("oura_document_id")
		.eq("user_id", params.userId)
		.gte(params.column, params.window.startDate)
		.lte(params.column, params.window.endDate);

	if (error) {
		throw error;
	}

	return ((data ?? []) as Array<{ oura_document_id: string | null }>)
		.map((row) => row.oura_document_id)
		.filter((value): value is string => typeof value === "string");
}

async function selectOuraDocumentIdsByDateOverlap(params: {
	table: "oura_enhanced_tags" | "oura_rest_mode_periods";
	userId: string;
	window: DateWindow;
}): Promise<string[]> {
	const supabase = createAdminClient();
	const { data, error } = await supabase
		.from(params.table)
		.select("oura_document_id, start_day, end_day")
		.eq("user_id", params.userId)
		.lte("start_day", params.window.endDate);

	if (error) {
		throw error;
	}

	return (
		(data ?? []) as Array<{
			oura_document_id: string | null;
			start_day: string | null;
			end_day: string | null;
		}>
	)
		.filter(
			(row) =>
				typeof row.oura_document_id === "string" &&
				(row.end_day === null || row.end_day >= params.window.startDate)
		)
		.map((row) => row.oura_document_id as string);
}

async function selectAllOuraDocumentIds(params: {
	table: "oura_ring_configurations";
	userId: string;
}): Promise<string[]> {
	const supabase = createAdminClient();
	const { data, error } = await supabase
		.from(params.table)
		.select("oura_document_id")
		.eq("user_id", params.userId);

	if (error) {
		throw error;
	}

	return ((data ?? []) as Array<{ oura_document_id: string | null }>)
		.map((row) => row.oura_document_id)
		.filter((value): value is string => typeof value === "string");
}

function getOuraDocumentIds(
	documents: unknown[],
	dataType: OuraDataType
): string[] {
	const ids: string[] = [];

	for (const document of documents) {
		if (!isRecord(document)) {
			throw new Error(`Invalid Oura ${dataType} document payload.`);
		}

		if (typeof document.id !== "string" || document.id.trim().length === 0) {
			throw new Error(`Missing Oura ${dataType} document id.`);
		}

		ids.push(document.id);
	}

	return ids;
}

async function deleteMissingOuraDocumentsInWindow(params: {
	userId: string;
	dataType: Exclude<
		OuraDataType,
		"personal_info" | "heartrate" | "daily_cardiovascular_age"
	>;
	documents: unknown[];
	window?: DateWindow;
}): Promise<void> {
	const keepIds = new Set(
		getOuraDocumentIds(params.documents, params.dataType)
	);

	const localIds = await (async () => {
		switch (params.dataType) {
			case "tag":
				return selectOuraDocumentIdsByDateColumn({
					table: "oura_tags",
					column: "day",
					userId: params.userId,
					window: params.window as DateWindow,
				});
			case "enhanced_tag":
				return selectOuraDocumentIdsByDateOverlap({
					table: "oura_enhanced_tags",
					userId: params.userId,
					window: params.window as DateWindow,
				});
			case "workout":
				return selectOuraDocumentIdsByDateColumn({
					table: "oura_workouts",
					column: "day",
					userId: params.userId,
					window: params.window as DateWindow,
				});
			case "session":
				return selectOuraDocumentIdsByDateColumn({
					table: "oura_sessions",
					column: "day",
					userId: params.userId,
					window: params.window as DateWindow,
				});
			case "daily_activity":
				return selectOuraDocumentIdsByDateColumn({
					table: "oura_daily_activity",
					column: "day",
					userId: params.userId,
					window: params.window as DateWindow,
				});
			case "daily_sleep":
				return selectOuraDocumentIdsByDateColumn({
					table: "oura_daily_sleep",
					column: "day",
					userId: params.userId,
					window: params.window as DateWindow,
				});
			case "daily_spo2":
				return selectOuraDocumentIdsByDateColumn({
					table: "oura_daily_spo2",
					column: "day",
					userId: params.userId,
					window: params.window as DateWindow,
				});
			case "daily_readiness":
				return selectOuraDocumentIdsByDateColumn({
					table: "oura_daily_readiness",
					column: "day",
					userId: params.userId,
					window: params.window as DateWindow,
				});
			case "sleep":
				return selectOuraDocumentIdsByDateColumn({
					table: "oura_sleep",
					column: "day",
					userId: params.userId,
					window: params.window as DateWindow,
				});
			case "sleep_time":
				return selectOuraDocumentIdsByDateColumn({
					table: "oura_sleep_time",
					column: "day",
					userId: params.userId,
					window: params.window as DateWindow,
				});
			case "rest_mode_period":
				return selectOuraDocumentIdsByDateOverlap({
					table: "oura_rest_mode_periods",
					userId: params.userId,
					window: params.window as DateWindow,
				});
			case "ring_configuration":
				return selectAllOuraDocumentIds({
					table: "oura_ring_configurations",
					userId: params.userId,
				});
			case "daily_stress":
				return selectOuraDocumentIdsByDateColumn({
					table: "oura_daily_stress",
					column: "day",
					userId: params.userId,
					window: params.window as DateWindow,
				});
			case "daily_resilience":
				return selectOuraDocumentIdsByDateColumn({
					table: "oura_daily_resilience",
					column: "day",
					userId: params.userId,
					window: params.window as DateWindow,
				});
			case "vo2_max":
				return selectOuraDocumentIdsByDateColumn({
					table: "oura_vo2_max",
					column: "day",
					userId: params.userId,
					window: params.window as DateWindow,
				});
		}
	})();

	for (const documentId of localIds) {
		if (keepIds.has(documentId)) {
			continue;
		}

		await deleteOuraDocumentById({
			userId: params.userId,
			dataType: params.dataType,
			documentId,
		});
	}
}

async function processRingConfigurationJob(
	job: OuraSyncJobRow,
	accessToken: string
): Promise<JobProcessResult> {
	if (job.sync_kind === "reconcile") {
		const allDocuments: unknown[] = [];
		let nextToken = job.next_token;

		do {
			const response = await fetchOuraCollectionDocuments<unknown>({
				accessToken,
				dataType: "ring_configuration",
				query: {
					nextToken,
				},
			});

			allDocuments.push(...response.data);
			nextToken = response.nextToken;
		} while (nextToken);

		if (allDocuments.length > 0) {
			await persistOuraDocuments({
				userId: job.user_id,
				dataType: "ring_configuration",
				documents: allDocuments,
			});
		}

		await deleteMissingOuraDocumentsInWindow({
			userId: job.user_id,
			dataType: "ring_configuration",
			documents: allDocuments,
		});

		await completeJob(job.id);
		return "completed";
	}

	const response = await fetchOuraCollectionDocuments<unknown>({
		accessToken,
		dataType: "ring_configuration",
		query: {
			nextToken: job.next_token,
		},
	});

	if (response.data.length > 0) {
		await persistOuraDocuments({
			userId: job.user_id,
			dataType: "ring_configuration",
			documents: response.data,
		});
	}

	if (response.nextToken) {
		await rescheduleJob(job.id, {
			next_token: response.nextToken,
		});
		return "rescheduled";
	}

	await completeJob(job.id);
	return "completed";
}

async function processPersonalInfoJob(
	job: OuraSyncJobRow,
	accessToken: string
): Promise<JobProcessResult> {
	const personalInfo = await fetchOuraPersonalInfo(accessToken);
	await persistOuraPersonalInfo({
		userId: job.user_id,
		personalInfo,
	});
	await completeJob(job.id);
	return "completed";
}

async function processHeartRateJob(
	job: OuraSyncJobRow,
	accessToken: string
): Promise<JobProcessResult> {
	const lowerBoundDatetime =
		job.sync_kind === "backfill"
			? await getBackfillLowerBoundDatetime({
					userId: job.user_id,
					accessToken,
				})
			: getReconcileDateTimeWindow().startDatetime;
	const window = getDateTimeWindowFromJob(job, lowerBoundDatetime);

	const response = await fetchOuraCollectionDocuments<unknown>({
		accessToken,
		dataType: "heartrate",
		query: {
			startDateTime: window.startDatetime,
			endDateTime: window.endDatetime,
			nextToken: job.next_token,
		},
	});

	if (response.data.length > 0) {
		await persistOuraDocuments({
			userId: job.user_id,
			dataType: "heartrate",
			documents: response.data,
		});
	}

	if (response.nextToken) {
		await rescheduleJob(job.id, {
			start_datetime: window.startDatetime,
			end_datetime: window.endDatetime,
			next_token: response.nextToken,
		});
		return "rescheduled";
	}

	if (job.sync_kind === "reconcile") {
		await completeJob(job.id);
		return "completed";
	}

	const nextWindow = getPreviousDateTimeWindow(
		window.startDatetime,
		lowerBoundDatetime
	);

	if (!nextWindow) {
		await completeJob(job.id);
		return "completed";
	}

	await rescheduleJob(job.id, {
		start_datetime: nextWindow.startDatetime,
		end_datetime: nextWindow.endDatetime,
		next_token: null,
	});
	return "rescheduled";
}

async function processDateWindowCollectionJob(
	job: OuraSyncJobRow,
	accessToken: string
): Promise<JobProcessResult> {
	if (job.data_type === "ring_configuration") {
		return processRingConfigurationJob(job, accessToken);
	}

	if (job.data_type === "heartrate") {
		return processHeartRateJob(job, accessToken);
	}

	const lowerBoundDate =
		job.sync_kind === "backfill"
			? await getBackfillLowerBoundDate({
					userId: job.user_id,
					accessToken,
				})
			: getReconcileDateWindow().startDate;

	const window = getDateWindowFromJob(job, lowerBoundDate);

	if (job.sync_kind === "reconcile") {
		const allDocuments: unknown[] = [];
		let nextToken = job.next_token;

		do {
			const response = await fetchOuraCollectionDocuments<unknown>({
				accessToken,
				dataType: job.data_type as Exclude<
					OuraDataType,
					"personal_info" | "heartrate"
				>,
				query: {
					startDate: window.startDate,
					endDate: window.endDate,
					nextToken,
				},
			});

			allDocuments.push(...response.data);
			nextToken = response.nextToken;
		} while (nextToken);

		if (allDocuments.length > 0) {
			await persistOuraDocuments({
				userId: job.user_id,
				dataType: job.data_type,
				documents: allDocuments,
			});
		}

		if (job.data_type === "daily_cardiovascular_age") {
			await deleteMissingCardiovascularAgeRows({
				userId: job.user_id,
				window,
				documents: allDocuments,
			});
		} else if (hasOuraSingleDocumentPath(job.data_type)) {
			await deleteMissingOuraDocumentsInWindow({
				userId: job.user_id,
				dataType: job.data_type,
				window,
				documents: allDocuments,
			});
		}

		await completeJob(job.id);
		return "completed";
	}

	const response = await fetchOuraCollectionDocuments<unknown>({
		accessToken,
		dataType: job.data_type as Exclude<
			OuraDataType,
			"personal_info" | "heartrate"
		>,
		query: {
			startDate: window.startDate,
			endDate: window.endDate,
			nextToken: job.next_token,
		},
	});

	if (response.data.length > 0) {
		await persistOuraDocuments({
			userId: job.user_id,
			dataType: job.data_type,
			documents: response.data,
		});
	}

	if (response.nextToken) {
		await rescheduleJob(job.id, {
			start_date: window.startDate,
			end_date: window.endDate,
			next_token: response.nextToken,
		});
		return "rescheduled";
	}

	const nextWindow = getPreviousDateWindow(window.startDate, lowerBoundDate);
	if (!nextWindow) {
		await completeJob(job.id);
		return "completed";
	}

	await rescheduleJob(job.id, {
		start_date: nextWindow.startDate,
		end_date: nextWindow.endDate,
		next_token: null,
	});
	return "rescheduled";
}

async function processWebhookFetchJob(
	job: OuraSyncJobRow,
	accessToken: string
): Promise<JobProcessResult> {
	if (!job.object_id) {
		await completeJob(job.id);
		return "completed";
	}

	if (!hasOuraSingleDocumentPath(job.data_type)) {
		await completeJob(job.id);
		return "completed";
	}

	try {
		const document = await fetchOuraSingleDocument<unknown>({
			accessToken,
			dataType: job.data_type,
			documentId: job.object_id,
		});

		await persistOuraDocuments({
			userId: job.user_id,
			dataType: job.data_type,
			documents: [document],
			documentIds: [job.object_id],
		});
		await completeJob(job.id);
		return "completed";
	} catch (error) {
		if (error instanceof Error && /404|not found/i.test(error.message)) {
			await deleteOuraDocumentById({
				userId: job.user_id,
				dataType: job.data_type,
				documentId: job.object_id,
			});
			await completeJob(job.id);
			return "completed";
		}

		throw error;
	}
}

async function processWebhookDeleteJob(
	job: OuraSyncJobRow
): Promise<JobProcessResult> {
	if (!job.object_id || !hasOuraSingleDocumentPath(job.data_type)) {
		await completeJob(job.id);
		return "completed";
	}

	await deleteOuraDocumentById({
		userId: job.user_id,
		dataType: job.data_type,
		documentId: job.object_id,
	});
	await completeJob(job.id);
	return "completed";
}

async function processClaimedJob(
	job: OuraSyncJobRow
): Promise<JobProcessResult> {
	if (!isOuraConfigured()) {
		throw new Error("Oura is not configured in this environment.");
	}

	const accessToken = await getValidOuraAccessToken({
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
		case "backfill":
		case "reconcile":
			if (job.data_type === "personal_info") {
				return processPersonalInfoJob(job, accessToken);
			}
			return processDateWindowCollectionJob(job, accessToken);
		case "webhook_fetch":
			return processWebhookFetchJob(job, accessToken);
		case "webhook_delete":
			return processWebhookDeleteJob(job);
		default:
			await completeJob(job.id);
			return "completed";
	}
}

export async function enqueueInitialOuraSyncJobs(params: {
	userId: string;
}): Promise<void> {
	for (const dataType of OURA_DATA_TYPES) {
		await createOrResetJob({
			userId: params.userId,
			dataType,
			syncKind: "backfill",
			fingerprint: buildFingerprint({
				syncKind: "backfill",
				dataType,
			}),
		});
	}
}

export async function enqueueRollingOuraReconcileJobs(): Promise<number> {
	const users = await getConnectedOuraUsers();
	if (users.length === 0) {
		return 0;
	}

	const dateKey = getTodayDate();
	let count = 0;
	const dateWindow = getReconcileDateWindow();
	const dateTimeWindow = getReconcileDateTimeWindow();

	for (const user of users) {
		for (const dataType of OURA_DATA_TYPES) {
			await createOrResetJob({
				userId: user.user_id,
				dataType,
				syncKind: "reconcile",
				fingerprint: buildFingerprint({
					syncKind: "reconcile",
					dataType,
					dateKey,
				}),
				startDate:
					dataType === "heartrate" || dataType === "personal_info"
						? null
						: dateWindow.startDate,
				endDate:
					dataType === "heartrate" || dataType === "personal_info"
						? null
						: dateWindow.endDate,
				startDatetime:
					dataType === "heartrate" ? dateTimeWindow.startDatetime : null,
				endDatetime:
					dataType === "heartrate" ? dateTimeWindow.endDatetime : null,
			});
			count += 1;
		}
	}

	return count;
}

export async function enqueueOuraWebhookSync(params: {
	userId: string;
	payload: OuraWebhookPayload;
}): Promise<void> {
	const syncKind =
		params.payload.event_type === "delete" ? "webhook_delete" : "webhook_fetch";

	await createOrResetJob({
		userId: params.userId,
		dataType: params.payload.data_type,
		syncKind,
		fingerprint: buildFingerprint({
			syncKind,
			dataType: params.payload.data_type,
			objectId: params.payload.object_id,
		}),
		objectId: params.payload.object_id,
	});
}

export async function recordOuraWebhookEvent(params: {
	userId?: string | null;
	providerUserId?: string | null;
	payload: unknown;
	signature?: string | null;
	timestampHeader?: string | null;
	status: OuraWebhookEventStatus;
	errorText?: string | null;
}) {
	const payloadRecord = isRecord(params.payload)
		? params.payload
		: { raw_body: String(params.payload ?? "") };
	const eventType =
		typeof payloadRecord.event_type === "string"
			? payloadRecord.event_type
			: null;
	const dataType =
		typeof payloadRecord.data_type === "string"
			? payloadRecord.data_type
			: null;
	const objectId =
		typeof payloadRecord.object_id === "string"
			? payloadRecord.object_id
			: null;
	const eventTime =
		typeof payloadRecord.event_time === "string"
			? parseTimestamp(payloadRecord.event_time)
			: null;

	const supabase = createAdminClient();
	const { error } = await supabase.from("oura_webhook_events").insert({
		user_id: params.userId ?? null,
		provider_user_id:
			params.providerUserId ??
			(typeof payloadRecord.user_id === "string"
				? payloadRecord.user_id
				: null),
		event_type: eventType,
		data_type: dataType,
		object_id: objectId,
		event_time: eventTime,
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

export async function purgeOuraSyncArtifacts(params: {
	userId: string;
}): Promise<void> {
	const supabase = createAdminClient();

	const { error: jobsError } = await supabase
		.from("oura_sync_jobs")
		.delete()
		.eq("user_id", params.userId);

	if (jobsError) {
		throw jobsError;
	}

	const { error: eventsError } = await supabase
		.from("oura_webhook_events")
		.delete()
		.eq("user_id", params.userId);

	if (eventsError) {
		throw eventsError;
	}
}

export async function recoverStaleOuraSyncJobs(): Promise<number> {
	const cutoffIso = new Date(Date.now() - JOB_LOCK_TIMEOUT_MS).toISOString();
	const supabase = createAdminClient();
	const { data, error } = await supabase
		.from("oura_sync_jobs")
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

async function upsertLocalWebhookSubscriptions(
	rows: Array<{
		provider_subscription_id: string;
		callback_url: string;
		event_type: OuraWebhookOperation;
		data_type: OuraWebhookDataType;
		expiration_time: string;
		last_synced_at: string;
	}>
): Promise<void> {
	if (rows.length === 0) {
		return;
	}

	const supabase = createAdminClient();
	const { error } = await supabase
		.from("oura_webhook_subscriptions")
		.upsert(rows, {
			onConflict: "event_type,data_type",
		});

	if (error) {
		throw error;
	}
}

async function deleteLocalStaleWebhookSubscriptions(
	expectedKeys: Set<string>
): Promise<void> {
	const supabase = createAdminClient();
	const { data, error } = await supabase
		.from("oura_webhook_subscriptions")
		.select("id, event_type, data_type");

	if (error) {
		throw error;
	}

	for (const row of (data ?? []) as Array<{
		id: string;
		event_type: OuraWebhookOperation;
		data_type: OuraWebhookDataType;
	}>) {
		const key = `${row.event_type}:${row.data_type}`;
		if (expectedKeys.has(key)) {
			continue;
		}

		const { error: deleteError } = await supabase
			.from("oura_webhook_subscriptions")
			.delete()
			.eq("id", row.id);

		if (deleteError) {
			throw deleteError;
		}
	}
}

export async function ensureOuraWebhookSubscriptions(): Promise<number> {
	const users = await getConnectedOuraUsers();
	if (users.length === 0) {
		return 0;
	}

	const origin = getConfiguredOuraAppOrigin();
	if (!origin) {
		throw new Error("Missing APP_URL for Oura webhook subscriptions.");
	}

	const callbackUrl = buildOuraWebhookUrl(origin);
	const verificationToken = getOuraWebhookVerificationToken();
	const nowIso = new Date().toISOString();
	const remoteSubscriptions = await listOuraWebhookSubscriptions();
	const expectedRows: Array<{
		provider_subscription_id: string;
		callback_url: string;
		event_type: OuraWebhookOperation;
		data_type: OuraWebhookDataType;
		expiration_time: string;
		last_synced_at: string;
	}> = [];
	const expectedKeys = new Set<string>();

	for (const eventType of OURA_WEBHOOK_OPERATIONS) {
		for (const dataType of OURA_WEBHOOK_DATA_TYPES) {
			const key = `${eventType}:${dataType}`;
			expectedKeys.add(key);

			const matches = remoteSubscriptions
				.filter(
					(subscription) =>
						subscription.event_type === eventType &&
						subscription.data_type === dataType
				)
				.sort((left, right) =>
					right.expiration_time.localeCompare(left.expiration_time)
				);

			let subscription = matches[0] ?? null;
			for (const extra of matches.slice(1)) {
				await deleteOuraWebhookSubscription(extra.id).catch((error) => {
					console.error(
						"Failed to delete duplicate Oura webhook subscription",
						error
					);
				});
			}

			if (!subscription) {
				subscription = await createOuraWebhookSubscription({
					callbackUrl,
					verificationToken,
					eventType,
					dataType,
				});
			} else if (
				subscription.callback_url !== callbackUrl ||
				subscription.event_type !== eventType ||
				subscription.data_type !== dataType
			) {
				subscription = await updateOuraWebhookSubscription({
					subscriptionId: subscription.id,
					verificationToken,
					callbackUrl,
					eventType,
					dataType,
				});
			} else if (
				shouldRenewOuraWebhookSubscription(subscription.expiration_time)
			) {
				subscription = await renewOuraWebhookSubscription(subscription.id);
			}

			expectedRows.push({
				provider_subscription_id: subscription.id,
				callback_url: subscription.callback_url,
				event_type: subscription.event_type,
				data_type: subscription.data_type,
				expiration_time: subscription.expiration_time,
				last_synced_at: nowIso,
			});
		}
	}

	await upsertLocalWebhookSubscriptions(expectedRows);
	await deleteLocalStaleWebhookSubscriptions(expectedKeys);
	return expectedRows.length;
}

export async function processPendingOuraSyncJobs(params?: {
	limit?: number;
	workerId?: string;
}): Promise<ProcessJobsResult> {
	const result: ProcessJobsResult = {
		claimed: 0,
		completed: 0,
		rescheduled: 0,
		failed: 0,
	};
	const limit = Math.max(1, params?.limit ?? 10);
	const workerId =
		params?.workerId ?? `oura-sync-${process.pid}-${Date.now().toString(36)}`;

	for (let index = 0; index < limit; index += 1) {
		const job = await claimNextJob(workerId);
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
