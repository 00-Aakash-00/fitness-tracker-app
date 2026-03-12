import "server-only";

import type { OAuthProvider } from "./oauth.server";
import { hasRequiredEnv, requireEnv } from "./oauth.server";

const WHOOP_PROVIDER: OAuthProvider = "whoop";
const WHOOP_REQUIRED_ENV = ["WHOOP_CLIENT_ID", "WHOOP_CLIENT_SECRET"];
const WHOOP_FETCH_TIMEOUT_MS = 10_000;
const WHOOP_TIMEOUT_MESSAGE = "WHOOP request timed out. Please try again.";
const WHOOP_API_BASE_URL = "https://api.prod.whoop.com/developer";
const WHOOP_COLLECTION_LIMIT = 25;

export const WHOOP_AUTHORIZATION_URL =
	"https://api.prod.whoop.com/oauth/oauth2/auth";
export const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
export const WHOOP_REVOKE_URL =
	"https://api.prod.whoop.com/developer/v2/user/access";
export const WHOOP_BASIC_PROFILE_URL =
	"https://api.prod.whoop.com/developer/v2/user/profile/basic";
export const WHOOP_CALLBACK_PATH = "/api/integrations/whoop/callback";
export const WHOOP_WEBHOOK_PATH = "/api/webhooks/whoop";

export const DEFAULT_WHOOP_SCOPES = [
	"offline",
	"read:recovery",
	"read:cycles",
	"read:workout",
	"read:sleep",
	"read:profile",
	"read:body_measurement",
];

export const WHOOP_DATA_TYPES = [
	"profile",
	"body_measurement",
	"cycle",
	"sleep",
	"recovery",
	"workout",
] as const;

export const WHOOP_COLLECTION_DATA_TYPES = [
	"cycle",
	"sleep",
	"recovery",
	"workout",
] as const;

export type WhoopDataType = (typeof WHOOP_DATA_TYPES)[number];
export type WhoopCollectionDataType =
	(typeof WHOOP_COLLECTION_DATA_TYPES)[number];

export const WHOOP_OAUTH_ERROR_CODES = [
	"access_denied",
	"invalid_client",
	"invalid_grant",
	"invalid_request",
	"invalid_scope",
	"server_error",
	"temporarily_unavailable",
	"unauthorized_client",
	"unsupported_grant_type",
] as const;

export type WhoopOAuthErrorCode =
	| (typeof WHOOP_OAUTH_ERROR_CODES)[number]
	| "unknown_error";

export type WhoopProviderErrorContext =
	| "authorize"
	| "token_exchange"
	| "token_refresh"
	| "profile"
	| "api"
	| "revoke"
	| "webhook";

export class WhoopProviderError extends Error {
	readonly code: WhoopOAuthErrorCode;
	readonly context: WhoopProviderErrorContext;
	readonly status: number | null;
	readonly requiresReconnect: boolean;

	constructor(params: {
		code: WhoopOAuthErrorCode;
		context: WhoopProviderErrorContext;
		message: string;
		status?: number | null;
		requiresReconnect?: boolean;
		cause?: unknown;
	}) {
		super(params.message, params.cause ? { cause: params.cause } : undefined);
		this.name = "WhoopProviderError";
		this.code = params.code;
		this.context = params.context;
		this.status = params.status ?? null;
		this.requiresReconnect = params.requiresReconnect ?? false;
	}
}

export type WhoopTokenResponse = {
	access_token: string;
	expires_in: number;
	refresh_token?: string;
	scope?: string;
	token_type?: string;
};

export type JsonRecord = Record<string, unknown>;

type WhoopCycleScore = {
	strain: number | null;
	kilojoule: number | null;
	average_heart_rate: number | null;
	max_heart_rate: number | null;
};

type WhoopSleepNeeded = {
	baseline_milli: number | null;
	need_from_sleep_debt_milli: number | null;
	need_from_recent_strain_milli: number | null;
	need_from_recent_nap_milli: number | null;
};

type WhoopSleepStageSummary = {
	total_in_bed_time_milli: number | null;
	total_awake_time_milli: number | null;
	total_no_data_time_milli: number | null;
	total_light_sleep_time_milli: number | null;
	total_slow_wave_sleep_time_milli: number | null;
	total_rem_sleep_time_milli: number | null;
	sleep_cycle_count: number | null;
	disturbance_count: number | null;
};

type WhoopSleepScore = {
	stage_summary: WhoopSleepStageSummary | null;
	sleep_needed: WhoopSleepNeeded | null;
	respiratory_rate: number | null;
	sleep_performance_percentage: number | null;
	sleep_consistency_percentage: number | null;
	sleep_efficiency_percentage: number | null;
};

type WhoopRecoveryScore = {
	user_calibrating: boolean | null;
	recovery_score: number | null;
	resting_heart_rate: number | null;
	hrv_rmssd_milli: number | null;
	spo2_percentage: number | null;
	skin_temp_celsius: number | null;
};

type WhoopWorkoutZoneDurations = {
	zone_zero_milli: number | null;
	zone_one_milli: number | null;
	zone_two_milli: number | null;
	zone_three_milli: number | null;
	zone_four_milli: number | null;
	zone_five_milli: number | null;
};

type WhoopWorkoutScore = {
	strain: number | null;
	average_heart_rate: number | null;
	max_heart_rate: number | null;
	kilojoule: number | null;
	percent_recorded: number | null;
	distance_meter: number | null;
	altitude_gain_meter: number | null;
	altitude_change_meter: number | null;
	zone_durations: WhoopWorkoutZoneDurations | null;
};

export type WhoopBasicProfile = JsonRecord & {
	user_id: string;
	email: string;
	first_name: string;
	last_name: string;
};

export type WhoopBodyMeasurement = JsonRecord & {
	height_meter: number | null;
	weight_kilogram: number | null;
	max_heart_rate: number | null;
};

export type WhoopCycle = JsonRecord & {
	id: string;
	user_id: string;
	created_at: string;
	updated_at: string;
	start: string;
	end: string | null;
	timezone_offset: string | null;
	score_state: string | null;
	score: WhoopCycleScore | null;
};

export type WhoopSleep = JsonRecord & {
	id: string;
	cycle_id: string;
	v1_id: string | null;
	user_id: string;
	created_at: string;
	updated_at: string;
	start: string;
	end: string;
	timezone_offset: string | null;
	nap: boolean | null;
	score_state: string | null;
	score: WhoopSleepScore | null;
};

export type WhoopRecovery = JsonRecord & {
	cycle_id: string;
	sleep_id: string | null;
	user_id: string;
	created_at: string;
	updated_at: string;
	score_state: string | null;
	score: WhoopRecoveryScore | null;
};

export type WhoopWorkout = JsonRecord & {
	id: string;
	v1_id: string | null;
	user_id: string;
	created_at: string;
	updated_at: string;
	start: string;
	end: string;
	timezone_offset: string | null;
	sport_name: string | null;
	sport_id: string | null;
	score_state: string | null;
	score: WhoopWorkoutScore | null;
};

export type WhoopCollectionQuery = {
	start?: string | null;
	end?: string | null;
	nextToken?: string | null;
	limit?: number | null;
};

export type WhoopCollectionResponse<T> = {
	records: T[];
	nextToken: string | null;
};

function isRecord(value: unknown): value is JsonRecord {
	return typeof value === "object" && value !== null;
}

function getString(value: unknown): string | null {
	return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getNumber(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getBoolean(value: unknown): boolean | null {
	return typeof value === "boolean" ? value : null;
}

function getIsoDateTimeString(value: unknown): string | null {
	const candidate = getString(value);
	if (!candidate) return null;

	const timestamp = Date.parse(candidate);
	return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function getIdString(value: unknown): string | null {
	if (typeof value === "number" && Number.isFinite(value)) {
		return String(value);
	}

	return getString(value);
}

function getWhoopErrorCode(value: unknown): WhoopOAuthErrorCode {
	if (typeof value !== "string") return "unknown_error";

	return WHOOP_OAUTH_ERROR_CODES.includes(
		value as (typeof WHOOP_OAUTH_ERROR_CODES)[number]
	)
		? (value as (typeof WHOOP_OAUTH_ERROR_CODES)[number])
		: "unknown_error";
}

function getWhoopErrorDescription(body: unknown): string | null {
	if (!isRecord(body)) return null;

	return (
		getString(body.error_description) ??
		getString(body.error_message) ??
		getString(body.message)
	);
}

function getWhoopBodyCode(body: unknown): WhoopOAuthErrorCode {
	if (!isRecord(body)) return "unknown_error";
	return getWhoopErrorCode(body.error);
}

function getWhoopUserMessage(params: {
	code: WhoopOAuthErrorCode;
	context: WhoopProviderErrorContext;
	status: number | null;
}) {
	const { code, context, status } = params;

	if (code === "access_denied") {
		return "WHOOP access was not granted.";
	}

	if (
		code === "invalid_client" ||
		code === "invalid_scope" ||
		code === "unauthorized_client"
	) {
		return "WHOOP integration is misconfigured. Contact support.";
	}

	if (context === "token_exchange" && code === "invalid_grant") {
		return "WHOOP authorization expired. Please try connecting again.";
	}

	if (context === "token_refresh" && code === "invalid_grant") {
		return "WHOOP session expired. Reconnect WHOOP.";
	}

	if ((context === "profile" || context === "api") && status === 401) {
		return "WHOOP session expired. Reconnect WHOOP.";
	}

	if (status === 429) {
		return "WHOOP rate limited the request. Please try again shortly.";
	}

	if (status !== null && status >= 500) {
		return "WHOOP is temporarily unavailable. Please try again.";
	}

	if (context === "webhook") {
		return "Invalid WHOOP webhook signature.";
	}

	return "WHOOP request failed. Please try again.";
}

function createWhoopProviderError(params: {
	context: WhoopProviderErrorContext;
	status?: number | null;
	code?: WhoopOAuthErrorCode;
	body?: unknown;
	cause?: unknown;
}) {
	const code = params.code ?? getWhoopBodyCode(params.body);
	const status = params.status ?? null;
	const message =
		getWhoopUserMessage({
			code,
			context: params.context,
			status,
		}) ?? getWhoopErrorDescription(params.body);

	return new WhoopProviderError({
		code,
		context: params.context,
		status,
		message,
		requiresReconnect:
			(params.context === "token_refresh" && code === "invalid_grant") ||
			((params.context === "profile" || params.context === "api") &&
				status === 401),
		cause: params.cause,
	});
}

async function parseWhoopBody(response: Response): Promise<unknown> {
	const text = await response.text().catch(() => "");
	if (!text) return null;

	try {
		return JSON.parse(text) as unknown;
	} catch {
		return text;
	}
}

async function fetchWhoop(
	input: RequestInfo | URL,
	init?: RequestInit,
	context: WhoopProviderErrorContext = "profile"
): Promise<Response> {
	try {
		return await fetch(input, {
			...init,
			cache: "no-store",
			signal: init?.signal ?? AbortSignal.timeout(WHOOP_FETCH_TIMEOUT_MS),
		});
	} catch (error) {
		if (
			error instanceof Error &&
			(error.name === "TimeoutError" || error.name === "AbortError")
		) {
			throw new WhoopProviderError({
				code: "unknown_error",
				context,
				status: null,
				message: WHOOP_TIMEOUT_MESSAGE,
				cause: error,
			});
		}

		throw error;
	}
}

async function performWhoopTokenRequest(params: {
	body: URLSearchParams;
	context: "token_exchange" | "token_refresh";
}): Promise<WhoopTokenResponse> {
	const response = await fetchWhoop(
		WHOOP_TOKEN_URL,
		{
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: params.body,
		},
		params.context
	);

	const data = await parseWhoopBody(response);
	if (!response.ok) {
		throw createWhoopProviderError({
			context: params.context,
			status: response.status,
			body: data,
		});
	}

	if (!isRecord(data)) {
		throw new WhoopProviderError({
			code: "unknown_error",
			context: params.context,
			status: response.status,
			message: "WHOOP returned an invalid token response.",
		});
	}

	const accessToken = getString(data.access_token);
	const expiresIn = getNumber(data.expires_in);

	if (!accessToken || expiresIn === null) {
		throw new WhoopProviderError({
			code: "unknown_error",
			context: params.context,
			status: response.status,
			message: "WHOOP returned an invalid token response.",
		});
	}

	return {
		access_token: accessToken,
		expires_in: expiresIn,
		refresh_token: getString(data.refresh_token) ?? undefined,
		scope: getString(data.scope) ?? undefined,
		token_type: getString(data.token_type) ?? undefined,
	};
}

async function performWhoopApiRequest(
	url: URL,
	accessToken: string
): Promise<JsonRecord> {
	const response = await fetchWhoop(
		url,
		{
			headers: { Authorization: `Bearer ${accessToken}` },
		},
		"api"
	);

	const data = await parseWhoopBody(response);
	if (!response.ok) {
		throw createWhoopProviderError({
			context: "api",
			status: response.status,
			body: data,
		});
	}

	if (!isRecord(data)) {
		throw new WhoopProviderError({
			code: "unknown_error",
			context: "api",
			status: response.status,
			message: "WHOOP returned an invalid API response.",
		});
	}

	return data;
}

function getWhoopApiUrl(pathname: string): URL {
	return new URL(pathname, WHOOP_API_BASE_URL);
}

function parseCycleScore(value: unknown): WhoopCycleScore | null {
	if (!isRecord(value)) return null;

	return {
		strain: getNumber(value.strain),
		kilojoule: getNumber(value.kilojoule),
		average_heart_rate: getNumber(value.average_heart_rate),
		max_heart_rate: getNumber(value.max_heart_rate),
	};
}

function parseSleepNeeded(value: unknown): WhoopSleepNeeded | null {
	if (!isRecord(value)) return null;

	return {
		baseline_milli: getNumber(value.baseline_milli),
		need_from_sleep_debt_milli: getNumber(value.need_from_sleep_debt_milli),
		need_from_recent_strain_milli: getNumber(
			value.need_from_recent_strain_milli
		),
		need_from_recent_nap_milli: getNumber(value.need_from_recent_nap_milli),
	};
}

function parseSleepStageSummary(value: unknown): WhoopSleepStageSummary | null {
	if (!isRecord(value)) return null;

	return {
		total_in_bed_time_milli: getNumber(value.total_in_bed_time_milli),
		total_awake_time_milli: getNumber(value.total_awake_time_milli),
		total_no_data_time_milli: getNumber(value.total_no_data_time_milli),
		total_light_sleep_time_milli: getNumber(value.total_light_sleep_time_milli),
		total_slow_wave_sleep_time_milli: getNumber(
			value.total_slow_wave_sleep_time_milli
		),
		total_rem_sleep_time_milli: getNumber(value.total_rem_sleep_time_milli),
		sleep_cycle_count: getNumber(value.sleep_cycle_count),
		disturbance_count: getNumber(value.disturbance_count),
	};
}

function parseSleepScore(value: unknown): WhoopSleepScore | null {
	if (!isRecord(value)) return null;

	return {
		stage_summary: parseSleepStageSummary(value.stage_summary),
		sleep_needed: parseSleepNeeded(value.sleep_needed),
		respiratory_rate: getNumber(value.respiratory_rate),
		sleep_performance_percentage: getNumber(value.sleep_performance_percentage),
		sleep_consistency_percentage: getNumber(value.sleep_consistency_percentage),
		sleep_efficiency_percentage: getNumber(value.sleep_efficiency_percentage),
	};
}

function parseRecoveryScore(value: unknown): WhoopRecoveryScore | null {
	if (!isRecord(value)) return null;

	return {
		user_calibrating: getBoolean(value.user_calibrating),
		recovery_score: getNumber(value.recovery_score),
		resting_heart_rate: getNumber(value.resting_heart_rate),
		hrv_rmssd_milli: getNumber(value.hrv_rmssd_milli),
		spo2_percentage: getNumber(value.spo2_percentage),
		skin_temp_celsius: getNumber(value.skin_temp_celsius),
	};
}

function parseWorkoutZoneDurations(
	value: unknown
): WhoopWorkoutZoneDurations | null {
	if (!isRecord(value)) return null;

	return {
		zone_zero_milli: getNumber(value.zone_zero_milli),
		zone_one_milli: getNumber(value.zone_one_milli),
		zone_two_milli: getNumber(value.zone_two_milli),
		zone_three_milli: getNumber(value.zone_three_milli),
		zone_four_milli: getNumber(value.zone_four_milli),
		zone_five_milli: getNumber(value.zone_five_milli),
	};
}

function parseWorkoutScore(value: unknown): WhoopWorkoutScore | null {
	if (!isRecord(value)) return null;

	return {
		strain: getNumber(value.strain),
		average_heart_rate: getNumber(value.average_heart_rate),
		max_heart_rate: getNumber(value.max_heart_rate),
		kilojoule: getNumber(value.kilojoule),
		percent_recorded: getNumber(value.percent_recorded),
		distance_meter: getNumber(value.distance_meter),
		altitude_gain_meter: getNumber(value.altitude_gain_meter),
		altitude_change_meter: getNumber(value.altitude_change_meter),
		zone_durations: parseWorkoutZoneDurations(value.zone_durations),
	};
}

function parseWhoopProfile(value: unknown): WhoopBasicProfile | null {
	if (!isRecord(value)) return null;

	const userId = getIdString(value.user_id);
	const email = getString(value.email);
	const firstName = getString(value.first_name);
	const lastName = getString(value.last_name);

	if (!userId || !email || !firstName || !lastName) {
		return null;
	}

	return {
		...value,
		user_id: userId,
		email,
		first_name: firstName,
		last_name: lastName,
	};
}

function parseWhoopBodyMeasurement(
	value: unknown
): WhoopBodyMeasurement | null {
	if (!isRecord(value)) return null;

	return {
		...value,
		height_meter: getNumber(value.height_meter),
		weight_kilogram: getNumber(value.weight_kilogram),
		max_heart_rate: getNumber(value.max_heart_rate),
	};
}

function parseWhoopCycle(value: unknown): WhoopCycle | null {
	if (!isRecord(value)) return null;

	const id = getIdString(value.id);
	const userId = getIdString(value.user_id);
	const createdAt = getIsoDateTimeString(value.created_at);
	const updatedAt = getIsoDateTimeString(value.updated_at);
	const start = getIsoDateTimeString(value.start);

	if (!id || !userId || !createdAt || !updatedAt || !start) {
		return null;
	}

	return {
		...value,
		id,
		user_id: userId,
		created_at: createdAt,
		updated_at: updatedAt,
		start,
		end: getIsoDateTimeString(value.end),
		timezone_offset: getString(value.timezone_offset),
		score_state: getString(value.score_state),
		score: parseCycleScore(value.score),
	};
}

function parseWhoopSleep(value: unknown): WhoopSleep | null {
	if (!isRecord(value)) return null;

	const id = getIdString(value.id);
	const cycleId = getIdString(value.cycle_id);
	const userId = getIdString(value.user_id);
	const createdAt = getIsoDateTimeString(value.created_at);
	const updatedAt = getIsoDateTimeString(value.updated_at);
	const start = getIsoDateTimeString(value.start);
	const end = getIsoDateTimeString(value.end);

	if (
		!id ||
		!cycleId ||
		!userId ||
		!createdAt ||
		!updatedAt ||
		!start ||
		!end
	) {
		return null;
	}

	return {
		...value,
		id,
		cycle_id: cycleId,
		v1_id: getIdString(value.v1_id),
		user_id: userId,
		created_at: createdAt,
		updated_at: updatedAt,
		start,
		end,
		timezone_offset: getString(value.timezone_offset),
		nap: getBoolean(value.nap),
		score_state: getString(value.score_state),
		score: parseSleepScore(value.score),
	};
}

function parseWhoopRecovery(value: unknown): WhoopRecovery | null {
	if (!isRecord(value)) return null;

	const cycleId = getIdString(value.cycle_id);
	const userId = getIdString(value.user_id);
	const createdAt = getIsoDateTimeString(value.created_at);
	const updatedAt = getIsoDateTimeString(value.updated_at);

	if (!cycleId || !userId || !createdAt || !updatedAt) {
		return null;
	}

	return {
		...value,
		cycle_id: cycleId,
		sleep_id: getIdString(value.sleep_id),
		user_id: userId,
		created_at: createdAt,
		updated_at: updatedAt,
		score_state: getString(value.score_state),
		score: parseRecoveryScore(value.score),
	};
}

function parseWhoopWorkout(value: unknown): WhoopWorkout | null {
	if (!isRecord(value)) return null;

	const id = getIdString(value.id);
	const userId = getIdString(value.user_id);
	const createdAt = getIsoDateTimeString(value.created_at);
	const updatedAt = getIsoDateTimeString(value.updated_at);
	const start = getIsoDateTimeString(value.start);
	const end = getIsoDateTimeString(value.end);

	if (!id || !userId || !createdAt || !updatedAt || !start || !end) {
		return null;
	}

	return {
		...value,
		id,
		v1_id: getIdString(value.v1_id),
		user_id: userId,
		created_at: createdAt,
		updated_at: updatedAt,
		start,
		end,
		timezone_offset: getString(value.timezone_offset),
		sport_name: getString(value.sport_name),
		score_state: getString(value.score_state),
		score: parseWorkoutScore(value.score),
		sport_id: getIdString(value.sport_id),
	};
}

function getCollectionParser(
	dataType: WhoopCollectionDataType
):
	| ((value: unknown) => WhoopCycle | null)
	| ((value: unknown) => WhoopSleep | null)
	| ((value: unknown) => WhoopRecovery | null)
	| ((value: unknown) => WhoopWorkout | null) {
	switch (dataType) {
		case "cycle":
			return parseWhoopCycle;
		case "sleep":
			return parseWhoopSleep;
		case "recovery":
			return parseWhoopRecovery;
		case "workout":
			return parseWhoopWorkout;
	}
}

function getCollectionPath(dataType: WhoopCollectionDataType): string {
	switch (dataType) {
		case "cycle":
			return "/v2/cycle";
		case "sleep":
			return "/v2/activity/sleep";
		case "recovery":
			return "/v2/recovery";
		case "workout":
			return "/v2/activity/workout";
	}
}

function buildWhoopCollectionUrl(params: {
	dataType: WhoopCollectionDataType;
	query?: WhoopCollectionQuery;
}): URL {
	const url = getWhoopApiUrl(getCollectionPath(params.dataType));
	const limit = Math.max(
		1,
		Math.min(
			WHOOP_COLLECTION_LIMIT,
			params.query?.limit ?? WHOOP_COLLECTION_LIMIT
		)
	);

	url.searchParams.set("limit", String(limit));

	if (params.query?.start) {
		url.searchParams.set("start", params.query.start);
	}

	if (params.query?.end) {
		url.searchParams.set("end", params.query.end);
	}

	if (params.query?.nextToken) {
		url.searchParams.set("nextToken", params.query.nextToken);
	}

	return url;
}

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

export function buildWhoopCallbackUrl(origin: string): string {
	return new URL(WHOOP_CALLBACK_PATH, origin).toString();
}

export function buildWhoopWebhookUrl(origin: string): string {
	return new URL(WHOOP_WEBHOOK_PATH, origin).toString();
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

export function getWhoopAuthorizationErrorMessage(params: {
	error: string;
	errorDescription?: string | null;
}) {
	void params.errorDescription;

	const code = getWhoopErrorCode(params.error);
	return getWhoopUserMessage({
		code,
		context: "authorize",
		status: null,
	});
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

	return performWhoopTokenRequest({
		body,
		context: "token_exchange",
	});
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

	return performWhoopTokenRequest({
		body,
		context: "token_refresh",
	});
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

export function isWhoopProviderError(
	error: unknown
): error is WhoopProviderError {
	return error instanceof WhoopProviderError;
}

export function isWhoopReconnectRequiredError(error: unknown): boolean {
	return isWhoopProviderError(error) && error.requiresReconnect;
}

export async function fetchWhoopBasicProfile(
	accessToken: string
): Promise<WhoopBasicProfile> {
	const response = await fetchWhoop(
		WHOOP_BASIC_PROFILE_URL,
		{
			headers: { Authorization: `Bearer ${accessToken}` },
		},
		"profile"
	);

	const data = await parseWhoopBody(response);
	if (!response.ok) {
		throw createWhoopProviderError({
			context: "profile",
			status: response.status,
			body: data,
		});
	}

	const profile = parseWhoopProfile(data);
	if (!profile) {
		throw new WhoopProviderError({
			code: "unknown_error",
			context: "profile",
			status: response.status,
			message: "WHOOP returned an invalid profile response.",
		});
	}

	return profile;
}

export async function fetchWhoopBodyMeasurement(
	accessToken: string
): Promise<WhoopBodyMeasurement> {
	const data = await performWhoopApiRequest(
		getWhoopApiUrl("/v2/user/measurement/body"),
		accessToken
	);
	const bodyMeasurement = parseWhoopBodyMeasurement(data);

	if (!bodyMeasurement) {
		throw new WhoopProviderError({
			code: "unknown_error",
			context: "api",
			message: "WHOOP returned an invalid body measurement response.",
		});
	}

	return bodyMeasurement;
}

export async function fetchWhoopCycleById(params: {
	accessToken: string;
	cycleId: string;
}): Promise<WhoopCycle> {
	const data = await performWhoopApiRequest(
		getWhoopApiUrl(`/v2/cycle/${params.cycleId}`),
		params.accessToken
	);
	const cycle = parseWhoopCycle(data);

	if (!cycle) {
		throw new WhoopProviderError({
			code: "unknown_error",
			context: "api",
			message: "WHOOP returned an invalid cycle response.",
		});
	}

	return cycle;
}

export async function fetchWhoopSleepById(params: {
	accessToken: string;
	sleepId: string;
}): Promise<WhoopSleep> {
	const data = await performWhoopApiRequest(
		getWhoopApiUrl(`/v2/activity/sleep/${params.sleepId}`),
		params.accessToken
	);
	const sleep = parseWhoopSleep(data);

	if (!sleep) {
		throw new WhoopProviderError({
			code: "unknown_error",
			context: "api",
			message: "WHOOP returned an invalid sleep response.",
		});
	}

	return sleep;
}

export async function fetchWhoopRecoveryForCycle(params: {
	accessToken: string;
	cycleId: string;
}): Promise<WhoopRecovery> {
	const data = await performWhoopApiRequest(
		getWhoopApiUrl(`/v2/cycle/${params.cycleId}/recovery`),
		params.accessToken
	);
	const recovery = parseWhoopRecovery(data);

	if (!recovery) {
		throw new WhoopProviderError({
			code: "unknown_error",
			context: "api",
			message: "WHOOP returned an invalid recovery response.",
		});
	}

	return recovery;
}

export async function fetchWhoopWorkoutById(params: {
	accessToken: string;
	workoutId: string;
}): Promise<WhoopWorkout> {
	const data = await performWhoopApiRequest(
		getWhoopApiUrl(`/v2/activity/workout/${params.workoutId}`),
		params.accessToken
	);
	const workout = parseWhoopWorkout(data);

	if (!workout) {
		throw new WhoopProviderError({
			code: "unknown_error",
			context: "api",
			message: "WHOOP returned an invalid workout response.",
		});
	}

	return workout;
}

export async function fetchWhoopCollectionDocuments(params: {
	accessToken: string;
	dataType: WhoopCollectionDataType;
	query?: WhoopCollectionQuery;
}): Promise<
	WhoopCollectionResponse<
		WhoopCycle | WhoopSleep | WhoopRecovery | WhoopWorkout
	>
> {
	const data = await performWhoopApiRequest(
		buildWhoopCollectionUrl({
			dataType: params.dataType,
			query: params.query,
		}),
		params.accessToken
	);

	if (!Array.isArray(data.records)) {
		throw new WhoopProviderError({
			code: "unknown_error",
			context: "api",
			message: `WHOOP returned an invalid ${params.dataType} collection response.`,
		});
	}

	const parser = getCollectionParser(params.dataType);
	const records = data.records
		.map((entry) => parser(entry))
		.filter(
			(
				entry
			): entry is WhoopCycle | WhoopSleep | WhoopRecovery | WhoopWorkout =>
				entry !== null
		);

	return {
		records,
		nextToken: getString(data.next_token),
	};
}

export async function revokeWhoopAccess(accessToken: string): Promise<void> {
	const response = await fetchWhoop(
		WHOOP_REVOKE_URL,
		{
			method: "DELETE",
			headers: { Authorization: `Bearer ${accessToken}` },
		},
		"revoke"
	);

	if (response.status === 204) return;

	const data = await parseWhoopBody(response);
	if (!response.ok) {
		throw createWhoopProviderError({
			context: "revoke",
			status: response.status,
			body: data,
		});
	}
}
