import "server-only";

import { createAdminClient } from "@/lib/supabase";
import type { OuraDataType, OuraPersonalInfo } from "./oura.server";

type JsonRecord = Record<string, unknown>;

type PersistContext = {
	userId: string;
	documentId?: string | null;
};

type PersistConfig = {
	table: string;
	onConflict: string;
	mapRow: (document: JsonRecord, context: PersistContext) => JsonRecord;
	deleteByDocumentId?: boolean;
};

const OURA_TABLES_TO_PURGE = [
	"oura_personal_info",
	"oura_tags",
	"oura_enhanced_tags",
	"oura_workouts",
	"oura_sessions",
	"oura_daily_activity",
	"oura_daily_sleep",
	"oura_daily_spo2",
	"oura_daily_readiness",
	"oura_sleep",
	"oura_sleep_time",
	"oura_rest_mode_periods",
	"oura_ring_configurations",
	"oura_daily_stress",
	"oura_daily_resilience",
	"oura_daily_cardiovascular_age",
	"oura_vo2_max",
	"oura_heart_rate",
] as const;

function isRecord(value: unknown): value is JsonRecord {
	return typeof value === "object" && value !== null;
}

function cleanRecord(value: JsonRecord): JsonRecord {
	const next: JsonRecord = {};

	for (const [key, entry] of Object.entries(value)) {
		if (typeof entry === "undefined") continue;
		next[key] = entry;
	}

	return next;
}

function omitKeys(value: JsonRecord, keys: string[]): JsonRecord {
	const next: JsonRecord = {};

	for (const [key, entry] of Object.entries(value)) {
		if (keys.includes(key) || typeof entry === "undefined") {
			continue;
		}

		next[key] = entry;
	}

	return next;
}

function mapDocumentWithProviderId(
	document: JsonRecord,
	context: PersistContext
) {
	const ouraDocumentId =
		typeof context.documentId === "string" && context.documentId.length > 0
			? context.documentId
			: typeof document.id === "string" && document.id.length > 0
				? document.id
				: null;

	if (!ouraDocumentId) {
		throw new Error("Missing Oura document id for persistence.");
	}

	return cleanRecord({
		user_id: context.userId,
		oura_document_id: ouraDocumentId,
		...omitKeys(document, ["id"]),
		raw_payload: document,
	});
}

const OURA_PERSISTENCE_CONFIG: Record<OuraDataType, PersistConfig> = {
	personal_info: {
		table: "oura_personal_info",
		onConflict: "user_id",
		mapRow: (document, context) => {
			const ouraUserId = typeof document.id === "string" ? document.id : null;
			if (!ouraUserId) {
				throw new Error("Missing Oura user id for personal info persistence.");
			}

			return cleanRecord({
				user_id: context.userId,
				oura_user_id: ouraUserId,
				...omitKeys(document, ["id"]),
				raw_payload: document,
			});
		},
	},
	tag: {
		table: "oura_tags",
		onConflict: "user_id,oura_document_id",
		mapRow: mapDocumentWithProviderId,
		deleteByDocumentId: true,
	},
	enhanced_tag: {
		table: "oura_enhanced_tags",
		onConflict: "user_id,oura_document_id",
		mapRow: mapDocumentWithProviderId,
		deleteByDocumentId: true,
	},
	workout: {
		table: "oura_workouts",
		onConflict: "user_id,oura_document_id",
		mapRow: mapDocumentWithProviderId,
		deleteByDocumentId: true,
	},
	session: {
		table: "oura_sessions",
		onConflict: "user_id,oura_document_id",
		mapRow: mapDocumentWithProviderId,
		deleteByDocumentId: true,
	},
	daily_activity: {
		table: "oura_daily_activity",
		onConflict: "user_id,oura_document_id",
		mapRow: mapDocumentWithProviderId,
		deleteByDocumentId: true,
	},
	daily_sleep: {
		table: "oura_daily_sleep",
		onConflict: "user_id,oura_document_id",
		mapRow: mapDocumentWithProviderId,
		deleteByDocumentId: true,
	},
	daily_spo2: {
		table: "oura_daily_spo2",
		onConflict: "user_id,oura_document_id",
		mapRow: mapDocumentWithProviderId,
		deleteByDocumentId: true,
	},
	daily_readiness: {
		table: "oura_daily_readiness",
		onConflict: "user_id,oura_document_id",
		mapRow: mapDocumentWithProviderId,
		deleteByDocumentId: true,
	},
	sleep: {
		table: "oura_sleep",
		onConflict: "user_id,oura_document_id",
		mapRow: mapDocumentWithProviderId,
		deleteByDocumentId: true,
	},
	sleep_time: {
		table: "oura_sleep_time",
		onConflict: "user_id,oura_document_id",
		mapRow: mapDocumentWithProviderId,
		deleteByDocumentId: true,
	},
	rest_mode_period: {
		table: "oura_rest_mode_periods",
		onConflict: "user_id,oura_document_id",
		mapRow: mapDocumentWithProviderId,
		deleteByDocumentId: true,
	},
	ring_configuration: {
		table: "oura_ring_configurations",
		onConflict: "user_id,oura_document_id",
		mapRow: mapDocumentWithProviderId,
		deleteByDocumentId: true,
	},
	daily_stress: {
		table: "oura_daily_stress",
		onConflict: "user_id,oura_document_id",
		mapRow: mapDocumentWithProviderId,
		deleteByDocumentId: true,
	},
	daily_resilience: {
		table: "oura_daily_resilience",
		onConflict: "user_id,oura_document_id",
		mapRow: mapDocumentWithProviderId,
		deleteByDocumentId: true,
	},
	daily_cardiovascular_age: {
		table: "oura_daily_cardiovascular_age",
		onConflict: "user_id,day",
		mapRow: (document, context) =>
			cleanRecord({
				user_id: context.userId,
				oura_document_id:
					typeof context.documentId === "string" &&
					context.documentId.length > 0
						? context.documentId
						: null,
				...document,
				raw_payload: document,
			}),
		deleteByDocumentId: true,
	},
	vo2_max: {
		table: "oura_vo2_max",
		onConflict: "user_id,oura_document_id",
		mapRow: mapDocumentWithProviderId,
		deleteByDocumentId: true,
	},
	heartrate: {
		table: "oura_heart_rate",
		onConflict: "user_id,timestamp,source",
		mapRow: (document, context) =>
			cleanRecord({
				user_id: context.userId,
				...document,
				raw_payload: document,
			}),
	},
};

async function upsertRows(
	table: string,
	rows: JsonRecord[],
	onConflict: string
): Promise<void> {
	if (rows.length === 0) return;

	const supabase = createAdminClient();
	const chunkSize = 250;

	for (let index = 0; index < rows.length; index += chunkSize) {
		const chunk = rows.slice(index, index + chunkSize);
		const { error } = await supabase
			.from(table)
			.upsert(chunk, { onConflict, ignoreDuplicates: false });

		if (error) {
			throw error;
		}
	}
}

export async function persistOuraPersonalInfo(params: {
	userId: string;
	personalInfo: OuraPersonalInfo;
}): Promise<void> {
	const config = OURA_PERSISTENCE_CONFIG.personal_info;
	await upsertRows(
		config.table,
		[
			config.mapRow(params.personalInfo as JsonRecord, {
				userId: params.userId,
			}),
		],
		config.onConflict
	);
}

export async function persistOuraDocuments(params: {
	userId: string;
	dataType: OuraDataType;
	documents: unknown[];
	documentIds?: Array<string | null | undefined>;
}): Promise<void> {
	const config = OURA_PERSISTENCE_CONFIG[params.dataType];
	const rows = params.documents.map((document, index) => {
		if (!isRecord(document)) {
			throw new Error(`Invalid Oura ${params.dataType} document payload.`);
		}

		return config.mapRow(document, {
			userId: params.userId,
			documentId: params.documentIds?.[index] ?? null,
		});
	});

	await upsertRows(config.table, rows, config.onConflict);
}

export async function deleteOuraDocumentById(params: {
	userId: string;
	dataType: Exclude<OuraDataType, "personal_info" | "heartrate">;
	documentId: string;
}): Promise<void> {
	const config = OURA_PERSISTENCE_CONFIG[params.dataType];
	if (!config.deleteByDocumentId) {
		return;
	}

	const supabase = createAdminClient();
	const { error } = await supabase
		.from(config.table)
		.delete()
		.eq("user_id", params.userId)
		.eq("oura_document_id", params.documentId);

	if (error) {
		throw error;
	}
}

export async function purgeOuraUserData(params: {
	userId: string;
}): Promise<void> {
	const supabase = createAdminClient();

	for (const table of OURA_TABLES_TO_PURGE) {
		const { error } = await supabase
			.from(table)
			.delete()
			.eq("user_id", params.userId);

		if (error) {
			throw error;
		}
	}
}

export async function getOldestOuraRingSetupAt(params: {
	userId: string;
}): Promise<string | null> {
	const supabase = createAdminClient();
	const { data, error } = await supabase
		.from("oura_ring_configurations")
		.select("set_up_at")
		.eq("user_id", params.userId)
		.not("set_up_at", "is", null)
		.order("set_up_at", { ascending: true })
		.limit(1)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return (data?.set_up_at as string | null | undefined) ?? null;
}
