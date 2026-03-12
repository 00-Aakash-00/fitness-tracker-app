import "server-only";

import { createAdminClient } from "@/lib/supabase";
import type {
	JsonRecord,
	WhoopBasicProfile,
	WhoopBodyMeasurement,
	WhoopCycle,
	WhoopDataType,
	WhoopRecovery,
	WhoopSleep,
	WhoopWorkout,
} from "./whoop.server";

type PersistContext = {
	userId: string;
};

type PersistConfig = {
	table: string;
	onConflict: string;
	mapRow: (document: JsonRecord, context: PersistContext) => JsonRecord;
};

const WHOOP_TABLES_TO_PURGE = [
	"whoop_profile",
	"whoop_body_measurement",
	"whoop_cycles",
	"whoop_sleeps",
	"whoop_recoveries",
	"whoop_workouts",
] as const;

function isRecord(value: unknown): value is JsonRecord {
	return typeof value === "object" && value !== null;
}

function cleanRecord(value: JsonRecord): JsonRecord {
	const next: JsonRecord = {};

	for (const [key, entry] of Object.entries(value)) {
		if (typeof entry === "undefined") {
			continue;
		}

		next[key] = entry;
	}

	return next;
}

function cleanScore(value: JsonRecord | null | undefined): JsonRecord {
	return isRecord(value) ? value : {};
}

const WHOOP_PERSISTENCE_CONFIG: Record<WhoopDataType, PersistConfig> = {
	profile: {
		table: "whoop_profile",
		onConflict: "user_id",
		mapRow: (document, context) => {
			const profile = document as WhoopBasicProfile;
			return cleanRecord({
				user_id: context.userId,
				whoop_user_id: profile.user_id,
				email: profile.email,
				first_name: profile.first_name,
				last_name: profile.last_name,
				raw_payload: document,
			});
		},
	},
	body_measurement: {
		table: "whoop_body_measurement",
		onConflict: "user_id",
		mapRow: (document, context) => {
			const bodyMeasurement = document as WhoopBodyMeasurement;
			return cleanRecord({
				user_id: context.userId,
				height_meter: bodyMeasurement.height_meter,
				weight_kilogram: bodyMeasurement.weight_kilogram,
				max_heart_rate: bodyMeasurement.max_heart_rate,
				raw_payload: document,
			});
		},
	},
	cycle: {
		table: "whoop_cycles",
		onConflict: "user_id,whoop_cycle_id",
		mapRow: (document, context) => {
			const cycle = document as WhoopCycle;
			const score = cleanScore(cycle.score ?? null);

			return cleanRecord({
				user_id: context.userId,
				whoop_cycle_id: cycle.id,
				whoop_user_id: cycle.user_id,
				whoop_created_at: cycle.created_at,
				whoop_updated_at: cycle.updated_at,
				start_at: cycle.start,
				end_at: cycle.end,
				timezone_offset: cycle.timezone_offset,
				score_state: cycle.score_state,
				strain: score.strain ?? null,
				kilojoule: score.kilojoule ?? null,
				average_heart_rate: score.average_heart_rate ?? null,
				max_heart_rate: score.max_heart_rate ?? null,
				raw_payload: document,
			});
		},
	},
	sleep: {
		table: "whoop_sleeps",
		onConflict: "user_id,whoop_sleep_id",
		mapRow: (document, context) => {
			const sleep = document as WhoopSleep;
			const score = cleanScore(sleep.score ?? null);
			const sleepNeeded = cleanScore(
				isRecord(score.sleep_needed) ? (score.sleep_needed as JsonRecord) : null
			);
			const stageSummary = cleanScore(
				isRecord(score.stage_summary)
					? (score.stage_summary as JsonRecord)
					: null
			);

			return cleanRecord({
				user_id: context.userId,
				whoop_sleep_id: sleep.id,
				whoop_v1_sleep_id: sleep.v1_id,
				whoop_cycle_id: sleep.cycle_id,
				whoop_user_id: sleep.user_id,
				whoop_created_at: sleep.created_at,
				whoop_updated_at: sleep.updated_at,
				start_at: sleep.start,
				end_at: sleep.end,
				timezone_offset: sleep.timezone_offset,
				is_nap: sleep.nap,
				score_state: sleep.score_state,
				baseline_milli: sleepNeeded.baseline_milli ?? null,
				need_from_sleep_debt_milli:
					sleepNeeded.need_from_sleep_debt_milli ?? null,
				need_from_recent_strain_milli:
					sleepNeeded.need_from_recent_strain_milli ?? null,
				need_from_recent_nap_milli:
					sleepNeeded.need_from_recent_nap_milli ?? null,
				respiratory_rate: score.respiratory_rate ?? null,
				sleep_performance_percentage:
					score.sleep_performance_percentage ?? null,
				sleep_consistency_percentage:
					score.sleep_consistency_percentage ?? null,
				sleep_efficiency_percentage: score.sleep_efficiency_percentage ?? null,
				total_in_bed_time_milli: stageSummary.total_in_bed_time_milli ?? null,
				total_awake_time_milli: stageSummary.total_awake_time_milli ?? null,
				total_no_data_time_milli: stageSummary.total_no_data_time_milli ?? null,
				total_light_sleep_time_milli:
					stageSummary.total_light_sleep_time_milli ?? null,
				total_slow_wave_sleep_time_milli:
					stageSummary.total_slow_wave_sleep_time_milli ?? null,
				total_rem_sleep_time_milli:
					stageSummary.total_rem_sleep_time_milli ?? null,
				sleep_cycle_count: stageSummary.sleep_cycle_count ?? null,
				disturbance_count: stageSummary.disturbance_count ?? null,
				raw_payload: document,
			});
		},
	},
	recovery: {
		table: "whoop_recoveries",
		onConflict: "user_id,whoop_cycle_id",
		mapRow: (document, context) => {
			const recovery = document as WhoopRecovery;
			const score = cleanScore(recovery.score ?? null);

			return cleanRecord({
				user_id: context.userId,
				whoop_cycle_id: recovery.cycle_id,
				whoop_sleep_id: recovery.sleep_id,
				whoop_user_id: recovery.user_id,
				whoop_created_at: recovery.created_at,
				whoop_updated_at: recovery.updated_at,
				score_state: recovery.score_state,
				user_calibrating: score.user_calibrating ?? null,
				recovery_score: score.recovery_score ?? null,
				resting_heart_rate: score.resting_heart_rate ?? null,
				hrv_rmssd_milli: score.hrv_rmssd_milli ?? null,
				spo2_percentage: score.spo2_percentage ?? null,
				skin_temp_celsius: score.skin_temp_celsius ?? null,
				raw_payload: document,
			});
		},
	},
	workout: {
		table: "whoop_workouts",
		onConflict: "user_id,whoop_workout_id",
		mapRow: (document, context) => {
			const workout = document as WhoopWorkout;
			const score = cleanScore(workout.score ?? null);
			const zoneDurations = cleanScore(
				isRecord(score.zone_durations)
					? (score.zone_durations as JsonRecord)
					: null
			);

			return cleanRecord({
				user_id: context.userId,
				whoop_workout_id: workout.id,
				whoop_v1_workout_id: workout.v1_id,
				whoop_user_id: workout.user_id,
				whoop_created_at: workout.created_at,
				whoop_updated_at: workout.updated_at,
				start_at: workout.start,
				end_at: workout.end,
				timezone_offset: workout.timezone_offset,
				sport_name: workout.sport_name,
				sport_id: workout.sport_id,
				score_state: workout.score_state,
				strain: score.strain ?? null,
				average_heart_rate: score.average_heart_rate ?? null,
				max_heart_rate: score.max_heart_rate ?? null,
				kilojoule: score.kilojoule ?? null,
				percent_recorded: score.percent_recorded ?? null,
				distance_meter: score.distance_meter ?? null,
				altitude_gain_meter: score.altitude_gain_meter ?? null,
				altitude_change_meter: score.altitude_change_meter ?? null,
				zone_zero_milli: zoneDurations.zone_zero_milli ?? null,
				zone_one_milli: zoneDurations.zone_one_milli ?? null,
				zone_two_milli: zoneDurations.zone_two_milli ?? null,
				zone_three_milli: zoneDurations.zone_three_milli ?? null,
				zone_four_milli: zoneDurations.zone_four_milli ?? null,
				zone_five_milli: zoneDurations.zone_five_milli ?? null,
				raw_payload: document,
			});
		},
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

export async function persistWhoopDocuments(params: {
	userId: string;
	dataType: WhoopDataType;
	documents: unknown[];
}): Promise<void> {
	const config = WHOOP_PERSISTENCE_CONFIG[params.dataType];
	const rows = params.documents.map((document) => {
		if (!isRecord(document)) {
			throw new Error(`Invalid Whoop ${params.dataType} document payload.`);
		}

		return config.mapRow(document, { userId: params.userId });
	});

	await upsertRows(config.table, rows, config.onConflict);
}

export async function deleteWhoopCycleById(params: {
	userId: string;
	cycleId: string;
}): Promise<void> {
	const supabase = createAdminClient();
	const { error } = await supabase
		.from("whoop_cycles")
		.delete()
		.eq("user_id", params.userId)
		.eq("whoop_cycle_id", params.cycleId);

	if (error) {
		throw error;
	}
}

export async function deleteWhoopBodyMeasurement(params: {
	userId: string;
}): Promise<void> {
	const supabase = createAdminClient();
	const { error } = await supabase
		.from("whoop_body_measurement")
		.delete()
		.eq("user_id", params.userId);

	if (error) {
		throw error;
	}
}

export async function deleteWhoopSleepById(params: {
	userId: string;
	sleepId: string;
}): Promise<void> {
	const supabase = createAdminClient();
	const { error } = await supabase
		.from("whoop_sleeps")
		.delete()
		.eq("user_id", params.userId)
		.eq("whoop_sleep_id", params.sleepId);

	if (error) {
		throw error;
	}
}

export async function deleteWhoopRecoveryByCycleId(params: {
	userId: string;
	cycleId: string;
}): Promise<void> {
	const supabase = createAdminClient();
	const { error } = await supabase
		.from("whoop_recoveries")
		.delete()
		.eq("user_id", params.userId)
		.eq("whoop_cycle_id", params.cycleId);

	if (error) {
		throw error;
	}
}

export async function deleteWhoopRecoveryBySleepId(params: {
	userId: string;
	sleepId: string;
}): Promise<void> {
	const supabase = createAdminClient();
	const { error } = await supabase
		.from("whoop_recoveries")
		.delete()
		.eq("user_id", params.userId)
		.eq("whoop_sleep_id", params.sleepId);

	if (error) {
		throw error;
	}
}

export async function deleteWhoopWorkoutById(params: {
	userId: string;
	workoutId: string;
}): Promise<void> {
	const supabase = createAdminClient();
	const { error } = await supabase
		.from("whoop_workouts")
		.delete()
		.eq("user_id", params.userId)
		.eq("whoop_workout_id", params.workoutId);

	if (error) {
		throw error;
	}
}

export async function purgeWhoopUserData(params: {
	userId: string;
}): Promise<void> {
	const supabase = createAdminClient();

	for (const table of WHOOP_TABLES_TO_PURGE) {
		const { error } = await supabase
			.from(table)
			.delete()
			.eq("user_id", params.userId);

		if (error) {
			throw error;
		}
	}
}
