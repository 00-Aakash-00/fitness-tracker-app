import "server-only";

import type { OAuthProvider } from "./oauth.server";
import {
	getConfiguredAppOrigin,
	hasRequiredEnv,
	requireEnv,
} from "./oauth.server";

const OURA_PROVIDER: OAuthProvider = "oura";
const OURA_REQUIRED_ENV = ["OURA_CLIENT_ID", "OURA_CLIENT_SECRET"];
const OURA_FETCH_TIMEOUT_MS = 10_000;
const OURA_TIMEOUT_MESSAGE = "Oura request timed out. Please try again.";
const OURA_RENEWAL_WINDOW_SECONDS = 60 * 60 * 24 * 3;

export const OURA_AUTHORIZATION_URL =
	"https://cloud.ouraring.com/oauth/authorize";
export const OURA_TOKEN_URL = "https://api.ouraring.com/oauth/token";
export const OURA_REVOKE_URL = "https://api.ouraring.com/oauth/revoke";
export const OURA_WEBHOOK_SUBSCRIPTIONS_URL =
	"https://api.ouraring.com/v2/webhook/subscription";
export const OURA_CALLBACK_PATH = "/api/integrations/oura/callback";
export const OURA_WEBHOOK_PATH = "/api/webhooks/oura";

export const DEFAULT_OURA_SCOPES = [
	"email",
	"personal",
	"daily",
	"heartrate",
	"workout",
	"session",
	"tag",
	"spo2",
];

export const OURA_DATA_TYPES = [
	"personal_info",
	"tag",
	"enhanced_tag",
	"workout",
	"session",
	"daily_activity",
	"daily_sleep",
	"daily_spo2",
	"daily_readiness",
	"sleep",
	"sleep_time",
	"rest_mode_period",
	"ring_configuration",
	"daily_stress",
	"daily_resilience",
	"daily_cardiovascular_age",
	"vo2_max",
	"heartrate",
] as const;

export const OURA_WEBHOOK_DATA_TYPES = [
	"tag",
	"enhanced_tag",
	"workout",
	"session",
	"sleep",
	"daily_sleep",
	"daily_readiness",
	"daily_activity",
	"daily_spo2",
	"sleep_time",
	"rest_mode_period",
	"ring_configuration",
	"daily_stress",
	"daily_cardiovascular_age",
	"daily_resilience",
	"vo2_max",
] as const;

export const OURA_WEBHOOK_OPERATIONS = ["create", "update", "delete"] as const;

type JsonRecord = Record<string, unknown>;

type OuraResourceConfig = {
	resourcePath: string;
	windowKind: "none" | "date" | "datetime";
	webhookCapable: boolean;
	hasSingleDocumentPath: boolean;
};

const OURA_RESOURCE_CONFIG: Record<
	Exclude<OuraDataType, "personal_info">,
	OuraResourceConfig
> = {
	tag: {
		resourcePath: "tag",
		windowKind: "date",
		webhookCapable: true,
		hasSingleDocumentPath: true,
	},
	enhanced_tag: {
		resourcePath: "enhanced_tag",
		windowKind: "date",
		webhookCapable: true,
		hasSingleDocumentPath: true,
	},
	workout: {
		resourcePath: "workout",
		windowKind: "date",
		webhookCapable: true,
		hasSingleDocumentPath: true,
	},
	session: {
		resourcePath: "session",
		windowKind: "date",
		webhookCapable: true,
		hasSingleDocumentPath: true,
	},
	daily_activity: {
		resourcePath: "daily_activity",
		windowKind: "date",
		webhookCapable: true,
		hasSingleDocumentPath: true,
	},
	daily_sleep: {
		resourcePath: "daily_sleep",
		windowKind: "date",
		webhookCapable: true,
		hasSingleDocumentPath: true,
	},
	daily_spo2: {
		resourcePath: "daily_spo2",
		windowKind: "date",
		webhookCapable: true,
		hasSingleDocumentPath: true,
	},
	daily_readiness: {
		resourcePath: "daily_readiness",
		windowKind: "date",
		webhookCapable: true,
		hasSingleDocumentPath: true,
	},
	sleep: {
		resourcePath: "sleep",
		windowKind: "date",
		webhookCapable: true,
		hasSingleDocumentPath: true,
	},
	sleep_time: {
		resourcePath: "sleep_time",
		windowKind: "date",
		webhookCapable: true,
		hasSingleDocumentPath: true,
	},
	rest_mode_period: {
		resourcePath: "rest_mode_period",
		windowKind: "date",
		webhookCapable: true,
		hasSingleDocumentPath: true,
	},
	ring_configuration: {
		resourcePath: "ring_configuration",
		windowKind: "none",
		webhookCapable: true,
		hasSingleDocumentPath: true,
	},
	daily_stress: {
		resourcePath: "daily_stress",
		windowKind: "date",
		webhookCapable: true,
		hasSingleDocumentPath: true,
	},
	daily_resilience: {
		resourcePath: "daily_resilience",
		windowKind: "date",
		webhookCapable: true,
		hasSingleDocumentPath: true,
	},
	daily_cardiovascular_age: {
		resourcePath: "daily_cardiovascular_age",
		windowKind: "date",
		webhookCapable: true,
		hasSingleDocumentPath: true,
	},
	vo2_max: {
		resourcePath: "vO2_max",
		windowKind: "date",
		webhookCapable: true,
		hasSingleDocumentPath: true,
	},
	heartrate: {
		resourcePath: "heartrate",
		windowKind: "datetime",
		webhookCapable: false,
		hasSingleDocumentPath: false,
	},
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

function getOuraErrorDescription(body: unknown): string | null {
	if (!isRecord(body)) return null;

	return (
		getString(body.error_description) ??
		getString(body.error) ??
		getString(body.message)
	);
}

async function parseOuraBody(response: Response): Promise<unknown> {
	const text = await response.text().catch(() => "");
	if (!text) return null;

	try {
		return JSON.parse(text) as unknown;
	} catch {
		return text;
	}
}

export type OuraDataType = (typeof OURA_DATA_TYPES)[number];
export type OuraWebhookDataType = (typeof OURA_WEBHOOK_DATA_TYPES)[number];
export type OuraWebhookOperation = (typeof OURA_WEBHOOK_OPERATIONS)[number];

export type OuraTokenResponse = {
	access_token: string;
	token_type?: string;
	expires_in: number;
	refresh_token?: string;
	scope?: string;
};

export type OuraPersonalInfo = {
	id: string;
	email?: string | null;
	age?: number | null;
	weight?: number | null;
	height?: number | null;
	biological_sex?: string | null;
};

export type OuraWebhookSubscription = {
	id: string;
	callback_url: string;
	event_type: OuraWebhookOperation;
	data_type: OuraWebhookDataType;
	expiration_time: string;
};

export type OuraCollectionResponse<T> = {
	data: T[];
	nextToken: string | null;
};

export type OuraCollectionQuery = {
	startDate?: string | null;
	endDate?: string | null;
	startDateTime?: string | null;
	endDateTime?: string | null;
	nextToken?: string | null;
	sandbox?: boolean;
};

export type OuraProviderErrorContext =
	| "authorize"
	| "token_exchange"
	| "token_refresh"
	| "api"
	| "revoke"
	| "webhook_subscription";

export class OuraProviderError extends Error {
	readonly code: string | null;
	readonly context: OuraProviderErrorContext;
	readonly status: number | null;
	readonly requiresReconnect: boolean;

	constructor(params: {
		code?: string | null;
		context: OuraProviderErrorContext;
		message: string;
		status?: number | null;
		requiresReconnect?: boolean;
		cause?: unknown;
	}) {
		super(params.message, params.cause ? { cause: params.cause } : undefined);
		this.name = "OuraProviderError";
		this.code = params.code ?? null;
		this.context = params.context;
		this.status = params.status ?? null;
		this.requiresReconnect = params.requiresReconnect ?? false;
	}
}

function getOuraUserMessage(params: {
	context: OuraProviderErrorContext;
	status: number | null;
	code: string | null;
}) {
	const { context, status, code } = params;

	if (context === "authorize") {
		return "Oura access was not granted.";
	}

	if (context === "token_refresh" && code === "invalid_grant") {
		return "Oura session expired. Reconnect Oura.";
	}

	if (context === "token_exchange" && code === "invalid_grant") {
		return "Oura authorization expired. Please try connecting again.";
	}

	if (status === 401) {
		return "Oura session expired. Reconnect Oura.";
	}

	if (status === 403) {
		return "Oura denied access to this resource. Confirm the granted scopes and membership status.";
	}

	if (status === 429) {
		return "Oura rate limited the request. Please try again shortly.";
	}

	if (status !== null && status >= 500) {
		return "Oura is temporarily unavailable. Please try again.";
	}

	if (context === "webhook_subscription") {
		return "Oura webhook subscription request failed.";
	}

	return "Oura request failed. Please try again.";
}

function createOuraProviderError(params: {
	context: OuraProviderErrorContext;
	status?: number | null;
	code?: string | null;
	body?: unknown;
	cause?: unknown;
}) {
	const code =
		params.code ??
		(isRecord(params.body) ? getString(params.body.error) : null) ??
		null;
	const status = params.status ?? null;
	const message =
		getOuraUserMessage({
			context: params.context,
			status,
			code,
		}) ?? getOuraErrorDescription(params.body);

	return new OuraProviderError({
		code,
		context: params.context,
		status,
		message,
		requiresReconnect:
			(params.context === "token_refresh" && code === "invalid_grant") ||
			status === 401,
		cause: params.cause,
	});
}

async function fetchOura(
	input: RequestInfo | URL,
	init: RequestInit | undefined,
	context: OuraProviderErrorContext
): Promise<Response> {
	try {
		return await fetch(input, {
			...init,
			cache: "no-store",
			signal: init?.signal ?? AbortSignal.timeout(OURA_FETCH_TIMEOUT_MS),
		});
	} catch (error) {
		if (
			error instanceof Error &&
			(error.name === "TimeoutError" || error.name === "AbortError")
		) {
			throw new OuraProviderError({
				code: null,
				context,
				status: null,
				message: OURA_TIMEOUT_MESSAGE,
				cause: error,
			});
		}

		throw error;
	}
}

function getOuraApiOrigin(): string {
	return process.env.OURA_API_ORIGIN?.trim() || "https://api.ouraring.com";
}

function normalizeOuraScope(scope: string): string {
	return Array.from(new Set(scope.split(/\s+/).filter(Boolean))).join(" ");
}

function getOuraCollectionBasePath(sandbox = false): string {
	return sandbox ? "/v2/sandbox/usercollection" : "/v2/usercollection";
}

function getOuraCollectionUrl(
	dataType: Exclude<OuraDataType, "personal_info">,
	sandbox = false
) {
	const resource = OURA_RESOURCE_CONFIG[dataType];
	return new URL(
		`${getOuraCollectionBasePath(sandbox)}/${resource.resourcePath}`,
		getOuraApiOrigin()
	);
}

function getOuraSingleDocumentUrl(
	dataType: Exclude<OuraDataType, "personal_info" | "heartrate">,
	documentId: string,
	sandbox = false
) {
	const resource = OURA_RESOURCE_CONFIG[dataType];
	if (!resource.hasSingleDocumentPath) {
		throw new Error(
			`Oura ${dataType} does not support single-document fetches.`
		);
	}

	return new URL(
		`${getOuraCollectionBasePath(sandbox)}/${resource.resourcePath}/${documentId}`,
		getOuraApiOrigin()
	);
}

async function performOuraTokenRequest(params: {
	body: URLSearchParams;
	context: "token_exchange" | "token_refresh";
}): Promise<OuraTokenResponse> {
	const response = await fetchOura(
		OURA_TOKEN_URL,
		{
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: params.body,
		},
		params.context
	);

	const data = await parseOuraBody(response);
	if (!response.ok) {
		throw createOuraProviderError({
			context: params.context,
			status: response.status,
			body: data,
		});
	}

	if (!isRecord(data)) {
		throw new OuraProviderError({
			context: params.context,
			status: response.status,
			message: "Oura returned an invalid token response.",
		});
	}

	const accessToken = getString(data.access_token);
	const expiresIn = getNumber(data.expires_in);

	if (!accessToken || expiresIn === null) {
		throw new OuraProviderError({
			context: params.context,
			status: response.status,
			message: "Oura returned an invalid token response.",
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

async function performWebhookSubscriptionRequest<T>(params: {
	input: string | URL;
	method: "GET" | "POST" | "PUT" | "DELETE";
	body?: JsonRecord;
}) {
	const response = await fetchOura(
		params.input,
		{
			method: params.method,
			headers: {
				"x-client-id": getOuraClientId(),
				"x-client-secret": getOuraClientSecret(),
				...(params.body ? { "Content-Type": "application/json" } : {}),
			},
			body: params.body ? JSON.stringify(params.body) : undefined,
		},
		"webhook_subscription"
	);

	if (response.status === 204) {
		return null;
	}

	const data = await parseOuraBody(response);
	if (!response.ok) {
		throw createOuraProviderError({
			context: "webhook_subscription",
			status: response.status,
			body: data,
		});
	}

	return data as T;
}

function parseWebhookSubscription(
	value: unknown
): OuraWebhookSubscription | null {
	if (!isRecord(value)) return null;

	const id = getString(value.id);
	const callbackUrl = getString(value.callback_url);
	const eventType = getString(value.event_type);
	const dataType = getString(value.data_type);
	const expirationTime = getString(value.expiration_time);

	if (!id || !callbackUrl || !eventType || !dataType || !expirationTime) {
		return null;
	}

	if (
		!OURA_WEBHOOK_OPERATIONS.includes(eventType as OuraWebhookOperation) ||
		!OURA_WEBHOOK_DATA_TYPES.includes(dataType as OuraWebhookDataType)
	) {
		return null;
	}

	return {
		id,
		callback_url: callbackUrl,
		event_type: eventType as OuraWebhookOperation,
		data_type: dataType as OuraWebhookDataType,
		expiration_time: expirationTime,
	};
}

export function getOuraProvider(): OAuthProvider {
	return OURA_PROVIDER;
}

export function getOuraClientId(): string {
	return requireEnv("OURA_CLIENT_ID");
}

export function getOuraClientSecret(): string {
	return requireEnv("OURA_CLIENT_SECRET");
}

export function getOuraWebhookVerificationToken(): string {
	return requireEnv("OURA_WEBHOOK_VERIFICATION_TOKEN");
}

export function getOuraSyncSecret(): string {
	return requireEnv("OURA_SYNC_SECRET");
}

export function isOuraConfigured(): boolean {
	return hasRequiredEnv(OURA_REQUIRED_ENV);
}

export function getOuraScopes(): string {
	const configured = process.env.OURA_SCOPES?.trim();
	if (!configured) return DEFAULT_OURA_SCOPES.join(" ");
	return normalizeOuraScope(configured);
}

export function buildOuraCallbackUrl(origin: string): string {
	return new URL(OURA_CALLBACK_PATH, origin).toString();
}

export function buildOuraWebhookUrl(origin: string): string {
	return new URL(OURA_WEBHOOK_PATH, origin).toString();
}

export function getConfiguredOuraAppOrigin(): string | null {
	return getConfiguredAppOrigin();
}

export function buildOuraAuthorizeUrl(params: {
	redirectUri: string;
	state: string;
	scope: string;
}): string {
	const url = new URL(OURA_AUTHORIZATION_URL);
	url.searchParams.set("response_type", "code");
	url.searchParams.set("client_id", getOuraClientId());
	url.searchParams.set("redirect_uri", params.redirectUri);
	url.searchParams.set("scope", normalizeOuraScope(params.scope));
	url.searchParams.set("state", params.state);
	return url.toString();
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

export function isOuraProviderError(
	error: unknown
): error is OuraProviderError {
	return error instanceof OuraProviderError;
}

export async function exchangeOuraCodeForTokens(params: {
	code: string;
	redirectUri: string;
}): Promise<OuraTokenResponse> {
	const body = new URLSearchParams({
		grant_type: "authorization_code",
		code: params.code,
		redirect_uri: params.redirectUri,
		client_id: getOuraClientId(),
		client_secret: getOuraClientSecret(),
	});

	return performOuraTokenRequest({
		body,
		context: "token_exchange",
	});
}

export async function refreshOuraTokens(params: {
	refreshToken: string;
}): Promise<OuraTokenResponse> {
	const body = new URLSearchParams({
		grant_type: "refresh_token",
		refresh_token: params.refreshToken,
		client_id: getOuraClientId(),
		client_secret: getOuraClientSecret(),
	});

	return performOuraTokenRequest({
		body,
		context: "token_refresh",
	});
}

export async function fetchOuraPersonalInfo(
	accessToken: string
): Promise<OuraPersonalInfo> {
	const response = await fetchOura(
		new URL("/v2/usercollection/personal_info", getOuraApiOrigin()),
		{
			headers: { Authorization: `Bearer ${accessToken}` },
		},
		"api"
	);

	const data = await parseOuraBody(response);
	if (!response.ok) {
		throw createOuraProviderError({
			context: "api",
			status: response.status,
			body: data,
		});
	}

	if (!isRecord(data)) {
		throw new OuraProviderError({
			context: "api",
			status: response.status,
			message: "Oura returned an invalid personal info response.",
		});
	}

	const id = getString(data.id);
	if (!id) {
		throw new OuraProviderError({
			context: "api",
			status: response.status,
			message: "Oura returned an invalid personal info response.",
		});
	}

	return {
		id,
		email: getString(data.email),
		age: getNumber(data.age),
		weight: getNumber(data.weight),
		height: getNumber(data.height),
		biological_sex: getString(data.biological_sex),
	};
}

export async function fetchOuraCollectionDocuments<T>(params: {
	accessToken: string;
	dataType: Exclude<OuraDataType, "personal_info">;
	query?: OuraCollectionQuery;
}): Promise<OuraCollectionResponse<T>> {
	const resource = OURA_RESOURCE_CONFIG[params.dataType];
	const url = getOuraCollectionUrl(
		params.dataType,
		params.query?.sandbox ?? false
	);

	if (resource.windowKind === "date") {
		if (params.query?.startDate) {
			url.searchParams.set("start_date", params.query.startDate);
		}
		if (params.query?.endDate) {
			url.searchParams.set("end_date", params.query.endDate);
		}
	}

	if (resource.windowKind === "datetime") {
		if (params.query?.startDateTime) {
			url.searchParams.set("start_datetime", params.query.startDateTime);
		}
		if (params.query?.endDateTime) {
			url.searchParams.set("end_datetime", params.query.endDateTime);
		}
	}

	if (params.query?.nextToken) {
		url.searchParams.set("next_token", params.query.nextToken);
	}

	const response = await fetchOura(
		url,
		{
			headers: { Authorization: `Bearer ${params.accessToken}` },
		},
		"api"
	);

	const data = await parseOuraBody(response);
	if (!response.ok) {
		throw createOuraProviderError({
			context: "api",
			status: response.status,
			body: data,
		});
	}

	if (!isRecord(data) || !Array.isArray(data.data)) {
		throw new OuraProviderError({
			context: "api",
			status: response.status,
			message: `Oura returned an invalid ${params.dataType} collection response.`,
		});
	}

	return {
		data: data.data as T[],
		nextToken: getString(data.next_token),
	};
}

export async function fetchOuraSingleDocument<T>(params: {
	accessToken: string;
	dataType: Exclude<OuraDataType, "personal_info" | "heartrate">;
	documentId: string;
	sandbox?: boolean;
}): Promise<T> {
	const response = await fetchOura(
		getOuraSingleDocumentUrl(
			params.dataType,
			params.documentId,
			params.sandbox ?? false
		),
		{
			headers: { Authorization: `Bearer ${params.accessToken}` },
		},
		"api"
	);

	const data = await parseOuraBody(response);
	if (!response.ok) {
		throw createOuraProviderError({
			context: "api",
			status: response.status,
			body: data,
		});
	}

	if (!isRecord(data)) {
		throw new OuraProviderError({
			context: "api",
			status: response.status,
			message: `Oura returned an invalid ${params.dataType} document response.`,
		});
	}

	return data as T;
}

export async function listOuraWebhookSubscriptions(): Promise<
	OuraWebhookSubscription[]
> {
	const data = await performWebhookSubscriptionRequest<unknown>({
		input: OURA_WEBHOOK_SUBSCRIPTIONS_URL,
		method: "GET",
	});

	if (!Array.isArray(data)) {
		throw new OuraProviderError({
			context: "webhook_subscription",
			message: "Oura returned an invalid webhook subscriptions response.",
		});
	}

	return data
		.map((item) => parseWebhookSubscription(item))
		.filter((item): item is OuraWebhookSubscription => item !== null);
}

export async function createOuraWebhookSubscription(params: {
	callbackUrl: string;
	verificationToken: string;
	eventType: OuraWebhookOperation;
	dataType: OuraWebhookDataType;
}): Promise<OuraWebhookSubscription> {
	const data = await performWebhookSubscriptionRequest<unknown>({
		input: OURA_WEBHOOK_SUBSCRIPTIONS_URL,
		method: "POST",
		body: {
			callback_url: params.callbackUrl,
			verification_token: params.verificationToken,
			event_type: params.eventType,
			data_type: params.dataType,
		},
	});

	const parsed = parseWebhookSubscription(data);
	if (!parsed) {
		throw new OuraProviderError({
			context: "webhook_subscription",
			message: "Oura returned an invalid webhook subscription response.",
		});
	}

	return parsed;
}

export async function updateOuraWebhookSubscription(params: {
	subscriptionId: string;
	verificationToken: string;
	callbackUrl: string;
	eventType: OuraWebhookOperation;
	dataType: OuraWebhookDataType;
}): Promise<OuraWebhookSubscription> {
	const data = await performWebhookSubscriptionRequest<unknown>({
		input: `${OURA_WEBHOOK_SUBSCRIPTIONS_URL}/${params.subscriptionId}`,
		method: "PUT",
		body: {
			verification_token: params.verificationToken,
			callback_url: params.callbackUrl,
			event_type: params.eventType,
			data_type: params.dataType,
		},
	});

	const parsed = parseWebhookSubscription(data);
	if (!parsed) {
		throw new OuraProviderError({
			context: "webhook_subscription",
			message: "Oura returned an invalid webhook subscription response.",
		});
	}

	return parsed;
}

export async function renewOuraWebhookSubscription(
	subscriptionId: string
): Promise<OuraWebhookSubscription> {
	const data = await performWebhookSubscriptionRequest<unknown>({
		input: `${OURA_WEBHOOK_SUBSCRIPTIONS_URL}/renew/${subscriptionId}`,
		method: "PUT",
	});

	const parsed = parseWebhookSubscription(data);
	if (!parsed) {
		throw new OuraProviderError({
			context: "webhook_subscription",
			message: "Oura returned an invalid webhook subscription response.",
		});
	}

	return parsed;
}

export async function deleteOuraWebhookSubscription(
	subscriptionId: string
): Promise<void> {
	await performWebhookSubscriptionRequest({
		input: `${OURA_WEBHOOK_SUBSCRIPTIONS_URL}/${subscriptionId}`,
		method: "DELETE",
	});
}

export async function revokeOuraAccess(accessToken: string): Promise<void> {
	const url = new URL(OURA_REVOKE_URL);
	url.searchParams.set("access_token", accessToken);

	const response = await fetchOura(url, { method: "GET" }, "revoke");
	if (response.ok) return;

	const data = await parseOuraBody(response);
	throw createOuraProviderError({
		context: "revoke",
		status: response.status,
		body: data,
	});
}

export function getOuraBackfillRenewalWindowSeconds(): number {
	return OURA_RENEWAL_WINDOW_SECONDS;
}

export function getOuraResourceConfig(
	dataType: Exclude<OuraDataType, "personal_info">
) {
	return OURA_RESOURCE_CONFIG[dataType];
}

export function isOuraWebhookCapableDataType(
	dataType: OuraDataType
): dataType is OuraWebhookDataType {
	return OURA_WEBHOOK_DATA_TYPES.includes(dataType as OuraWebhookDataType);
}

export function hasOuraSingleDocumentPath(
	dataType: OuraDataType
): dataType is Exclude<OuraDataType, "personal_info" | "heartrate"> {
	if (dataType === "personal_info" || dataType === "heartrate") {
		return false;
	}

	return OURA_RESOURCE_CONFIG[dataType].hasSingleDocumentPath;
}

export function shouldRenewOuraWebhookSubscription(expirationTime: string) {
	return isExpiringSoon(expirationTime, OURA_RENEWAL_WINDOW_SECONDS);
}

export function parseOuraBoolean(value: unknown): boolean | null {
	return getBoolean(value);
}
