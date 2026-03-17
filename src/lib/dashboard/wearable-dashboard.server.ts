import "server-only";

import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import type {
	ActionItem,
	ConnectionDevicePanelState,
	ConnectionPanelState,
	DashboardActionLink,
	DashboardDeviceStatus,
	DashboardJourneyStep,
	DashboardProvider,
	DashboardState,
	DashboardTone,
	DashboardTrendSummary,
	DashboardWearableContext,
	InsightCard,
	TrendPoint,
} from "./wearable-dashboard.types";

type DashboardConnections = {
	isWhoopAvailable: boolean;
	isOuraAvailable: boolean;
	whoopConnected: boolean;
	ouraConnected: boolean;
};

type SupabaseServerClient = ReturnType<typeof createServerClient>;

type JsonObject = Record<string, unknown>;

type OuraReadinessRow = {
	day: string;
	score: number | null;
	contributors: JsonObject | null;
	temperature_deviation: number | null;
	temperature_trend_deviation: number | null;
	updated_at: string | null;
};

type OuraDailySleepRow = {
	day: string;
	score: number | null;
	contributors: JsonObject | null;
	updated_at: string | null;
};

type OuraSleepRow = {
	day: string;
	bedtime_start: string;
	bedtime_end: string;
	total_sleep_duration: number | null;
	time_in_bed: number;
	efficiency: number | null;
	latency: number | null;
	average_hrv: number | null;
	lowest_heart_rate: number | null;
	average_heart_rate: number | null;
	average_breath: number | null;
	deep_sleep_duration: number | null;
	light_sleep_duration: number | null;
	rem_sleep_duration: number | null;
	readiness_score_delta: number | null;
	sleep_score_delta: number | null;
	type: string;
	updated_at: string | null;
};

type OuraSleepTimeRow = {
	day: string;
	optimal_bedtime: JsonObject | null;
	recommendation: string | null;
	status: string | null;
	updated_at: string | null;
};

type OuraActivityRow = {
	day: string;
	score: number | null;
	steps: number;
	active_calories: number;
	total_calories: number;
	target_calories: number;
	equivalent_walking_distance: number;
	target_meters: number;
	meters_to_target: number;
	inactivity_alerts: number;
	contributors: JsonObject | null;
	updated_at: string | null;
};

type OuraWorkoutRow = {
	day: string;
	activity: string;
	intensity: string;
	calories: number | null;
	distance: number | null;
	start_datetime: string;
	end_datetime: string;
	updated_at: string | null;
};

type OuraStressRow = {
	day: string;
	stress_high: number | null;
	recovery_high: number | null;
	day_summary: string | null;
	updated_at: string | null;
};

type OuraResilienceRow = {
	day: string;
	level: string;
	contributors: JsonObject | null;
	updated_at: string | null;
};

type OuraSpO2Row = {
	day: string;
	spo2_percentage: JsonObject | null;
	breathing_disturbance_index: number | null;
	updated_at: string | null;
};

type OuraCardioAgeRow = {
	day: string;
	vascular_age: number | null;
	updated_at: string | null;
};

type OuraVo2MaxRow = {
	day: string;
	vo2_max: number | null;
	updated_at: string | null;
};

type OuraRestModeRow = {
	start_day: string;
	end_day: string | null;
	start_time: string | null;
	end_time: string | null;
	updated_at: string | null;
};

type OuraPersonalInfoRow = {
	age: number | null;
};

type OuraSessionRow = {
	day: string;
	type: string;
	mood: string | null;
	start_datetime: string;
	end_datetime: string;
	updated_at: string | null;
};

type WhoopRecoveryRow = {
	whoop_cycle_id: string;
	whoop_sleep_id: string | null;
	recovery_score: number | null;
	resting_heart_rate: number | null;
	hrv_rmssd_milli: number | null;
	spo2_percentage: number | null;
	skin_temp_celsius: number | null;
	user_calibrating: boolean | null;
	score_state: string | null;
	whoop_updated_at: string;
	updated_at: string | null;
};

type WhoopSleepRow = {
	whoop_sleep_id: string;
	whoop_cycle_id: string;
	start_at: string;
	end_at: string;
	is_nap: boolean | null;
	sleep_performance_percentage: number | null;
	sleep_consistency_percentage: number | null;
	sleep_efficiency_percentage: number | null;
	baseline_milli: number | null;
	need_from_sleep_debt_milli: number | null;
	need_from_recent_strain_milli: number | null;
	need_from_recent_nap_milli: number | null;
	respiratory_rate: number | null;
	total_in_bed_time_milli: number | null;
	total_awake_time_milli: number | null;
	total_light_sleep_time_milli: number | null;
	total_slow_wave_sleep_time_milli: number | null;
	total_rem_sleep_time_milli: number | null;
	sleep_cycle_count: number | null;
	disturbance_count: number | null;
	whoop_updated_at: string;
	updated_at: string | null;
};

type WhoopCycleRow = {
	whoop_cycle_id: string;
	start_at: string;
	end_at: string | null;
	strain: number | null;
	kilojoule: number | null;
	average_heart_rate: number | null;
	max_heart_rate: number | null;
	whoop_updated_at: string;
	updated_at: string | null;
};

type WhoopWorkoutRow = {
	whoop_workout_id: string;
	start_at: string;
	end_at: string;
	sport_name: string | null;
	strain: number | null;
	average_heart_rate: number | null;
	max_heart_rate: number | null;
	kilojoule: number | null;
	distance_meter: number | null;
	zone_zero_milli: number | null;
	zone_one_milli: number | null;
	zone_two_milli: number | null;
	zone_three_milli: number | null;
	zone_four_milli: number | null;
	zone_five_milli: number | null;
	whoop_updated_at: string;
	updated_at: string | null;
};

type ProviderSummary = {
	provider: DashboardProvider | null;
	providerLabel: string;
	connectionState: "none" | "single" | "conflict";
};

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_WINDOW_HOURS = 36;

export async function getDashboardWearableContext(params: {
	stepGoal: number;
	connections: DashboardConnections;
}): Promise<DashboardWearableContext> {
	const { getToken } = await auth();
	const providerSummary = resolveProviderSummary(params.connections);

	if (providerSummary.connectionState === "none") {
		const hasAvailableProvider =
			params.connections.isOuraAvailable || params.connections.isWhoopAvailable;

		return buildStaticDashboardContext({
			state: "none",
			provider: null,
			providerLabel: "Wearable",
			lastSyncedAt: null,
			lastSyncedLabel: hasAvailableProvider
				? "Connect a device to begin"
				: "Wearables are not available yet",
			headline: hasAvailableProvider
				? "Turn one wearable into usable guidance"
				: "Your dashboard is ready for a wearable",
			highlight: hasAvailableProvider
				? "Connect Oura or WHOOP"
				: "Waiting on device access",
			description: hasAvailableProvider
				? "This dashboard turns one connected device into recovery, sleep, load, and cardio coaching that fits the rest of your day."
				: "This dashboard is designed to turn one connected wearable into daily recovery, sleep, load, and cardio guidance as soon as device access is available.",
			status: {
				eyebrow: "Wearable overview",
				title: hasAvailableProvider
					? "No device connected yet"
					: "No wearable options are live",
				description: hasAvailableProvider
					? "Connect either Oura or WHOOP to unlock daily guidance. You only need one wearable active at a time."
					: "The dashboard is ready, but this environment cannot connect Oura or WHOOP yet.",
				tone: "neutral",
			},
			actions: hasAvailableProvider
				? [
						{
							id: "choose-source",
							title: "Choose one source of truth",
							description:
								"Pick the device you actually wear consistently. One active source keeps guidance cleaner than mixing providers.",
							icon: "watch",
							tone: "steady",
						},
						{
							id: "connect-device",
							title: "Connect your device",
							description:
								"Use the connection panel below to compare Oura versus WHOOP, then connect the provider you want driving the dashboard.",
							icon: "arrow",
							tone: "neutral",
						},
						{
							id: "wear-through-sleep",
							title: "Wear it through the next sleep",
							description:
								"The first full sleep unlocks the first live recovery and sleep guidance, then the baseline sharpens over the next few days.",
							icon: "moon",
							tone: "steady",
						},
					]
				: [
						{
							id: "device-access",
							title: "Check device availability",
							description:
								"The dashboard experience is ready, but this environment does not currently expose Oura or WHOOP connections.",
							icon: "watch",
							tone: "neutral",
						},
						{
							id: "step-goal",
							title: "Set the step goal now",
							description:
								"You can still set your daily step target today so the dashboard is ready once a wearable is connected.",
							icon: "activity",
							tone: "steady",
						},
						{
							id: "return-later",
							title: "Come back when device access is live",
							description:
								"Once one provider is available, the dashboard will guide recovery, sleep, load, and cardio trends from a single source.",
							icon: "spark",
							tone: "neutral",
						},
					],
			heroActions: buildHeroActions({
				state: "none",
				connections: params.connections,
				provider: null,
			}),
			journeySteps: buildJourneySteps({
				state: "none",
				providerLabel: "Wearable",
				connections: params.connections,
			}),
			showQuickAssist: false,
			cards: buildPreviewCards(),
			trend: buildEmptyTrendSummary({
				provider: null,
				message:
					"Your 7-day balance appears here after your first wearable starts syncing daily scores.",
			}),
			connectionPanel: buildConnectionPanel({
				connections: params.connections,
				provider: null,
				lastSyncedLabel: null,
			}),
		});
	}

	if (providerSummary.connectionState === "conflict") {
		return buildStaticDashboardContext({
			state: "conflict",
			provider: null,
			providerLabel: "Wearable",
			lastSyncedAt: null,
			lastSyncedLabel: "Resolve the connection conflict",
			headline: "Pick one wearable before using the dashboard",
			highlight: "Two providers are connected",
			description:
				"The insight layer expects a single source of biometric truth. Disconnect one provider to avoid mixed guidance.",
			status: {
				eyebrow: "Connection issue",
				title: "Two devices are active",
				description:
					"Disconnect either Oura or WHOOP, then refresh the dashboard to restore a single wearable view.",
				tone: "warning",
			},
			actions: [
				{
					id: "resolve-conflict",
					title: "Disconnect one provider",
					description:
						"Keep a single active wearable so recovery, sleep, and load trends stay internally consistent.",
					icon: "shield",
					tone: "warning",
				},
				{
					id: "refresh-after-switch",
					title: "Refresh after the switch",
					description:
						"Once only one provider remains connected, the dashboard can rebuild a coherent single-source view automatically.",
					icon: "arrow",
					tone: "steady",
				},
				{
					id: "stay-single-source",
					title: "Keep one active wearable",
					description:
						"The dashboard is designed to give one clean guidance layer rather than combine mismatched baselines.",
					icon: "watch",
					tone: "neutral",
				},
			],
			heroActions: buildHeroActions({
				state: "conflict",
				connections: params.connections,
				provider: null,
			}),
			journeySteps: buildJourneySteps({
				state: "conflict",
				providerLabel: "Wearable",
				connections: params.connections,
			}),
			showQuickAssist: false,
			cards: buildPreviewCards(),
			trend: buildEmptyTrendSummary({
				provider: null,
				message:
					"Trend tracking resumes automatically after only one provider remains connected.",
			}),
			connectionPanel: buildConnectionPanel({
				connections: params.connections,
				provider: null,
				lastSyncedLabel: null,
			}),
		});
	}

	const token = await getToken();
	const supabase = createServerClient(token);

	if (providerSummary.provider === "oura") {
		return getOuraDashboardContext({
			supabase,
			stepGoal: params.stepGoal,
			connections: params.connections,
		});
	}

	return getWhoopDashboardContext({
		supabase,
		connections: params.connections,
	});
}

function resolveProviderSummary(
	connections: DashboardConnections
): ProviderSummary {
	if (connections.ouraConnected && connections.whoopConnected) {
		return {
			provider: null,
			providerLabel: "Wearable",
			connectionState: "conflict",
		};
	}

	if (connections.ouraConnected) {
		return {
			provider: "oura",
			providerLabel: "Oura",
			connectionState: "single",
		};
	}

	if (connections.whoopConnected) {
		return {
			provider: "whoop",
			providerLabel: "WHOOP",
			connectionState: "single",
		};
	}

	return {
		provider: null,
		providerLabel: "Wearable",
		connectionState: "none",
	};
}

async function getOuraDashboardContext(params: {
	supabase: SupabaseServerClient;
	stepGoal: number;
	connections: DashboardConnections;
}): Promise<DashboardWearableContext> {
	const today = new Date();
	const sevenDayStart = toDateOnly(addDays(today, -6));
	const thirtyDayStart = toDateOnly(addDays(today, -29));
	const ninetyDayStart = toDateOnly(addDays(today, -89));

	const [
		readinessResult,
		dailySleepResult,
		sleepResult,
		sleepTimeResult,
		activityResult,
		workoutResult,
		stressResult,
		resilienceResult,
		spO2Result,
		cardioAgeResult,
		vo2MaxResult,
		restModeResult,
		personalInfoResult,
		sessionResult,
	] = await Promise.all([
		params.supabase
			.from("oura_daily_readiness")
			.select(
				"day, score, contributors, temperature_deviation, temperature_trend_deviation, updated_at"
			)
			.gte("day", thirtyDayStart)
			.order("day", { ascending: false })
			.limit(30),
		params.supabase
			.from("oura_daily_sleep")
			.select("day, score, contributors, updated_at")
			.gte("day", thirtyDayStart)
			.order("day", { ascending: false })
			.limit(30),
		params.supabase
			.from("oura_sleep")
			.select(
				"day, bedtime_start, bedtime_end, total_sleep_duration, time_in_bed, efficiency, latency, average_hrv, lowest_heart_rate, average_heart_rate, average_breath, deep_sleep_duration, light_sleep_duration, rem_sleep_duration, readiness_score_delta, sleep_score_delta, type, updated_at"
			)
			.gte("day", thirtyDayStart)
			.order("day", { ascending: false })
			.limit(90),
		params.supabase
			.from("oura_sleep_time")
			.select("day, optimal_bedtime, recommendation, status, updated_at")
			.gte("day", thirtyDayStart)
			.order("day", { ascending: false })
			.limit(30),
		params.supabase
			.from("oura_daily_activity")
			.select(
				"day, score, steps, active_calories, total_calories, target_calories, equivalent_walking_distance, target_meters, meters_to_target, inactivity_alerts, contributors, updated_at"
			)
			.gte("day", thirtyDayStart)
			.order("day", { ascending: false })
			.limit(30),
		params.supabase
			.from("oura_workouts")
			.select(
				"day, activity, intensity, calories, distance, start_datetime, end_datetime, updated_at"
			)
			.gte("day", sevenDayStart)
			.order("start_datetime", { ascending: false })
			.limit(40),
		params.supabase
			.from("oura_daily_stress")
			.select("day, stress_high, recovery_high, day_summary, updated_at")
			.gte("day", thirtyDayStart)
			.order("day", { ascending: false })
			.limit(30),
		params.supabase
			.from("oura_daily_resilience")
			.select("day, level, contributors, updated_at")
			.gte("day", thirtyDayStart)
			.order("day", { ascending: false })
			.limit(30),
		params.supabase
			.from("oura_daily_spo2")
			.select("day, spo2_percentage, breathing_disturbance_index, updated_at")
			.gte("day", thirtyDayStart)
			.order("day", { ascending: false })
			.limit(30),
		params.supabase
			.from("oura_daily_cardiovascular_age")
			.select("day, vascular_age, updated_at")
			.gte("day", ninetyDayStart)
			.order("day", { ascending: false })
			.limit(90),
		params.supabase
			.from("oura_vo2_max")
			.select("day, vo2_max, updated_at")
			.gte("day", ninetyDayStart)
			.order("day", { ascending: false })
			.limit(90),
		params.supabase
			.from("oura_rest_mode_periods")
			.select("start_day, end_day, start_time, end_time, updated_at")
			.order("start_day", { ascending: false })
			.limit(20),
		params.supabase
			.from("oura_personal_info")
			.select("age")
			.limit(1)
			.maybeSingle(),
		params.supabase
			.from("oura_sessions")
			.select("day, type, mood, start_datetime, end_datetime, updated_at")
			.gte("day", sevenDayStart)
			.order("start_datetime", { ascending: false })
			.limit(20),
	]);

	assertNoError(readinessResult.error);
	assertNoError(dailySleepResult.error);
	assertNoError(sleepResult.error);
	assertNoError(sleepTimeResult.error);
	assertNoError(activityResult.error);
	assertNoError(workoutResult.error);
	assertNoError(stressResult.error);
	assertNoError(resilienceResult.error);
	assertNoError(spO2Result.error);
	assertNoError(cardioAgeResult.error);
	assertNoError(vo2MaxResult.error);
	assertNoError(restModeResult.error);
	assertNoError(personalInfoResult.error);
	assertNoError(sessionResult.error);

	const readinessRows = coerceRows<OuraReadinessRow>(readinessResult.data);
	const dailySleepRows = coerceRows<OuraDailySleepRow>(dailySleepResult.data);
	const sleepRows = selectPrimaryOuraSleeps(
		coerceRows<OuraSleepRow>(sleepResult.data)
	);
	const sleepTimeRows = coerceRows<OuraSleepTimeRow>(sleepTimeResult.data);
	const activityRows = coerceRows<OuraActivityRow>(activityResult.data);
	const workoutRows = coerceRows<OuraWorkoutRow>(workoutResult.data);
	const stressRows = coerceRows<OuraStressRow>(stressResult.data);
	const resilienceRows = coerceRows<OuraResilienceRow>(resilienceResult.data);
	const spO2Rows = coerceRows<OuraSpO2Row>(spO2Result.data);
	const cardioAgeRows = coerceRows<OuraCardioAgeRow>(cardioAgeResult.data);
	const vo2MaxRows = coerceRows<OuraVo2MaxRow>(vo2MaxResult.data);
	const restModeRows = coerceRows<OuraRestModeRow>(restModeResult.data);
	const sessionRows = coerceRows<OuraSessionRow>(sessionResult.data);
	const personalAge =
		(personalInfoResult.data as OuraPersonalInfoRow | null | undefined)?.age ??
		null;

	const latestReadiness = readinessRows[0] ?? null;
	const latestDailySleep = dailySleepRows[0] ?? null;
	const latestSleep =
		sleepRows.find((row) => row.day === latestDailySleep?.day) ??
		sleepRows[0] ??
		null;
	const latestSleepTime =
		sleepTimeRows.find((row) => row.day === latestSleep?.day) ??
		sleepTimeRows[0] ??
		null;
	const latestActivity = activityRows[0] ?? null;
	const latestStress = stressRows[0] ?? null;
	const latestResilience = resilienceRows[0] ?? null;
	const latestSpO2 = spO2Rows[0] ?? null;
	const latestCardioAge = cardioAgeRows[0] ?? null;
	const latestVo2Max = vo2MaxRows[0] ?? null;
	const restorativeSession = findRestorativeSession(sessionRows);
	const activeRestMode = isRestModeActive(restModeRows, today);
	const baselineCount = readinessRows.filter(
		(row) => row.score !== null
	).length;
	const lastSyncedAt = maxTimestamp(
		readinessRows,
		dailySleepRows,
		sleepRows,
		sleepTimeRows,
		activityRows,
		stressRows,
		resilienceRows,
		spO2Rows,
		cardioAgeRows,
		vo2MaxRows
	);
	const lastSyncedLabel = lastSyncedAt
		? `Synced ${formatRelativeTime(lastSyncedAt)}`
		: "Awaiting wearable sync";
	const state = resolveDataState({
		baselineCount,
		lastSyncedAt,
	});

	const recoveryCard = buildOuraRecoveryCard({
		readiness: latestReadiness,
		sleep: latestSleep,
		activeRestMode,
	});
	const sleepCard = buildOuraSleepCard({
		dailySleep: latestDailySleep,
		sleep: latestSleep,
		sleepTime: latestSleepTime,
	});
	const loadCard = buildOuraLoadCard({
		activity: latestActivity,
		workouts: workoutRows,
		readinessScore: latestReadiness?.score ?? null,
		stepGoal: params.stepGoal,
		recentActivities: activityRows.slice(0, 7),
	});
	const signalCard = buildOuraSignalCard({
		stress: latestStress,
		resilience: latestResilience,
		spO2: latestSpO2,
		cardioAge: latestCardioAge,
		vo2Max: latestVo2Max,
		personalAge,
		activeRestMode,
		restorativeSession,
	});
	const cards =
		state === "syncing"
			? buildSetupCards("oura")
			: [recoveryCard, sleepCard, loadCard, signalCard];
	const trend = buildOuraTrendSummary({
		readinessRows,
		activityRows,
	});
	const actions = buildOuraActions({
		state,
		recoveryCard,
		sleepCard,
		loadCard,
		signalCard,
		sleep: latestSleep,
		sleepTime: latestSleepTime,
		readiness: latestReadiness,
		stress: latestStress,
		resilience: latestResilience,
		activeRestMode,
		restorativeSession,
		loadMedian:
			median(
				activityRows
					.slice(0, 7)
					.map((row) =>
						withOuraWorkoutLoad(row, workoutsForDay(workoutRows, row.day))
					)
					.filter((value): value is number => value !== null)
			) ?? null,
		currentLoad: withOuraWorkoutLoad(
			latestActivity,
			workoutsForDay(workoutRows, latestActivity?.day ?? null)
		),
	});
	const providerTone =
		activeRestMode || recoveryCard.tone === "recover"
			? "recover"
			: recoveryCard.tone === "boost"
				? "boost"
				: "steady";

	return buildStaticDashboardContext({
		state,
		provider: "oura",
		providerLabel: "Oura",
		lastSyncedAt,
		lastSyncedLabel,
		headline: buildHeadline({
			state,
			providerLabel: "Oura",
			primaryCard: recoveryCard,
		}),
		highlight: buildHighlight({
			state,
			providerLabel: "Oura",
			activeRestMode,
			primaryCard: recoveryCard,
		}),
		description: buildOuraDescription({
			state,
			readiness: latestReadiness,
			sleep: latestSleep,
			activity: latestActivity,
			stress: latestStress,
			activeRestMode,
		}),
		status: buildStatusMessage({
			state,
			providerLabel: "Oura",
			lastSyncedLabel,
			tone: providerTone,
		}),
		heroActions: buildHeroActions({
			state,
			connections: params.connections,
			provider: "oura",
		}),
		journeySteps: buildJourneySteps({
			state,
			providerLabel: "Oura",
			connections: params.connections,
		}),
		showQuickAssist:
			state === "baseline_forming" || state === "ready" || state === "stale",
		actions,
		cards,
		trend,
		connectionPanel: buildConnectionPanel({
			connections: params.connections,
			provider: "oura",
			lastSyncedLabel,
		}),
	});
}

async function getWhoopDashboardContext(params: {
	supabase: SupabaseServerClient;
	connections: DashboardConnections;
}): Promise<DashboardWearableContext> {
	const today = new Date();
	const thirtyDayStartDateTime = addDays(today, -29).toISOString();
	const fourteenDayStartDateTime = addDays(today, -13).toISOString();

	const [recoveryResult, sleepResult, cycleResult, workoutResult] =
		await Promise.all([
			params.supabase
				.from("whoop_recoveries")
				.select(
					"whoop_cycle_id, whoop_sleep_id, recovery_score, resting_heart_rate, hrv_rmssd_milli, spo2_percentage, skin_temp_celsius, user_calibrating, score_state, whoop_updated_at, updated_at"
				)
				.gte("whoop_updated_at", thirtyDayStartDateTime)
				.order("whoop_updated_at", { ascending: false })
				.limit(30),
			params.supabase
				.from("whoop_sleeps")
				.select(
					"whoop_sleep_id, whoop_cycle_id, start_at, end_at, is_nap, sleep_performance_percentage, sleep_consistency_percentage, sleep_efficiency_percentage, baseline_milli, need_from_sleep_debt_milli, need_from_recent_strain_milli, need_from_recent_nap_milli, respiratory_rate, total_in_bed_time_milli, total_awake_time_milli, total_light_sleep_time_milli, total_slow_wave_sleep_time_milli, total_rem_sleep_time_milli, sleep_cycle_count, disturbance_count, whoop_updated_at, updated_at"
				)
				.gte("start_at", thirtyDayStartDateTime)
				.order("start_at", { ascending: false })
				.limit(40),
			params.supabase
				.from("whoop_cycles")
				.select(
					"whoop_cycle_id, start_at, end_at, strain, kilojoule, average_heart_rate, max_heart_rate, whoop_updated_at, updated_at"
				)
				.gte("start_at", thirtyDayStartDateTime)
				.order("start_at", { ascending: false })
				.limit(30),
			params.supabase
				.from("whoop_workouts")
				.select(
					"whoop_workout_id, start_at, end_at, sport_name, strain, average_heart_rate, max_heart_rate, kilojoule, distance_meter, zone_zero_milli, zone_one_milli, zone_two_milli, zone_three_milli, zone_four_milli, zone_five_milli, whoop_updated_at, updated_at"
				)
				.gte("start_at", fourteenDayStartDateTime)
				.order("start_at", { ascending: false })
				.limit(30),
		]);

	assertNoError(recoveryResult.error);
	assertNoError(sleepResult.error);
	assertNoError(cycleResult.error);
	assertNoError(workoutResult.error);

	const recoveryRows = coerceRows<WhoopRecoveryRow>(recoveryResult.data);
	const sleepRows = coerceRows<WhoopSleepRow>(sleepResult.data).filter(
		(row) => row.is_nap !== true
	);
	const cycleRows = coerceRows<WhoopCycleRow>(cycleResult.data);
	const workoutRows = coerceRows<WhoopWorkoutRow>(workoutResult.data);

	const latestRecovery =
		recoveryRows.find((row) => row.recovery_score !== null) ?? null;
	const latestSleep =
		sleepRows.find(
			(row) => row.whoop_sleep_id === latestRecovery?.whoop_sleep_id
		) ??
		sleepRows[0] ??
		null;
	const latestCycle =
		cycleRows.find(
			(row) => row.whoop_cycle_id === latestRecovery?.whoop_cycle_id
		) ??
		cycleRows[0] ??
		null;
	const latestWorkouts = latestCycle
		? workoutsWithinCycle(workoutRows, latestCycle)
		: [];
	const baselineCount = recoveryRows.filter(
		(row) => row.recovery_score !== null
	).length;
	const lastSyncedAt = maxTimestamp(
		recoveryRows,
		sleepRows,
		cycleRows,
		workoutRows
	);
	const lastSyncedLabel = lastSyncedAt
		? `Synced ${formatRelativeTime(lastSyncedAt)}`
		: "Awaiting wearable sync";
	const state = resolveDataState({
		baselineCount,
		lastSyncedAt,
	});

	const recoveryCard = buildWhoopRecoveryCard({
		recovery: latestRecovery,
		baselineRecoveries: recoveryRows.slice(0, 30),
	});
	const sleepCard = buildWhoopSleepCard({ sleep: latestSleep });
	const loadCard = buildWhoopLoadCard({
		cycle: latestCycle,
		workouts: latestWorkouts,
		recoveryScore: latestRecovery?.recovery_score ?? null,
		recentCycles: cycleRows.slice(0, 7),
	});
	const signalCard = buildWhoopSignalCard({
		recovery: latestRecovery,
		sleep: latestSleep,
		recoveryRows,
	});
	const cards =
		state === "syncing"
			? buildSetupCards("whoop")
			: [recoveryCard, sleepCard, loadCard, signalCard];
	const trend = buildWhoopTrendSummary({
		recoveryRows,
		cycleRows,
	});
	const actions = buildWhoopActions({
		state,
		recovery: latestRecovery,
		sleep: latestSleep,
		cycle: latestCycle,
		workouts: latestWorkouts,
		recoveryCard,
		loadCard,
		signalCard,
	});
	const providerTone =
		recoveryCard.tone === "recover"
			? "recover"
			: recoveryCard.tone === "boost"
				? "boost"
				: "steady";

	return buildStaticDashboardContext({
		state,
		provider: "whoop",
		providerLabel: "WHOOP",
		lastSyncedAt,
		lastSyncedLabel,
		headline: buildHeadline({
			state,
			providerLabel: "WHOOP",
			primaryCard: recoveryCard,
		}),
		highlight: buildHighlight({
			state,
			providerLabel: "WHOOP",
			activeRestMode: false,
			primaryCard: recoveryCard,
		}),
		description: buildWhoopDescription({
			state,
			recovery: latestRecovery,
			sleep: latestSleep,
			cycle: latestCycle,
		}),
		status: buildStatusMessage({
			state,
			providerLabel: "WHOOP",
			lastSyncedLabel,
			tone: providerTone,
		}),
		heroActions: buildHeroActions({
			state,
			connections: params.connections,
			provider: "whoop",
		}),
		journeySteps: buildJourneySteps({
			state,
			providerLabel: "WHOOP",
			connections: params.connections,
		}),
		showQuickAssist:
			state === "baseline_forming" || state === "ready" || state === "stale",
		actions,
		cards,
		trend,
		connectionPanel: buildConnectionPanel({
			connections: params.connections,
			provider: "whoop",
			lastSyncedLabel,
		}),
	});
}

function buildStaticDashboardContext(
	context: DashboardWearableContext
): DashboardWearableContext {
	return context;
}

function buildOuraRecoveryCard(params: {
	readiness: OuraReadinessRow | null;
	sleep: OuraSleepRow | null;
	activeRestMode: boolean;
}): InsightCard {
	if (!params.readiness?.score) {
		return buildEmptyCard({
			id: "recovery",
			title: "Recovery Capacity",
			icon: "heart",
			summary:
				"Oura is connected, but readiness data is still calibrating. Keep syncing your ring after sleep for a stable daily score.",
		});
	}

	const score = params.readiness.score;
	const tone = params.activeRestMode ? "recover" : getOuraReadinessTone(score);
	const lowestContributors = getLowestContributors(
		params.readiness.contributors,
		3
	);

	return {
		id: "recovery",
		mode: "live",
		title: "Recovery Capacity",
		icon: "heart",
		tone,
		statusLabel: params.activeRestMode
			? "recover first"
			: tone === "boost"
				? "boost"
				: tone === "recover"
					? "recover"
					: "steady",
		value: String(Math.round(score)),
		unit: "score",
		supportingValue:
			params.sleep?.average_hrv !== null &&
			params.sleep?.average_hrv !== undefined
				? `HRV ${Math.round(params.sleep.average_hrv)} ms`
				: undefined,
		summary: params.activeRestMode
			? "Rest Mode is active, so the dashboard holds a recovery-first stance even if readiness looks better than usual."
			: lowestContributors.length > 0
				? `${capitalize(lowestContributors[0].label)} is the biggest limiter in today's readiness picture.`
				: "Today's readiness score is built from sleep, recovery balance, temperature, and recent activity.",
		caption:
			params.sleep?.lowest_heart_rate !== null &&
			params.sleep?.lowest_heart_rate !== undefined
				? `Lowest sleeping HR ${params.sleep.lowest_heart_rate} bpm`
				: "Daily readiness score",
		detailTitle: "Recovery Capacity",
		detailSections: [
			{
				title: "Today",
				metrics: [
					{
						label: "Readiness",
						value: `${Math.round(score)}/100`,
						tone: toneToMetricTone(tone),
					},
					{
						label: "Average HRV",
						value:
							params.sleep?.average_hrv !== null &&
							params.sleep?.average_hrv !== undefined
								? `${Math.round(params.sleep.average_hrv)} ms`
								: "—",
					},
					{
						label: "Lowest heart rate",
						value:
							params.sleep?.lowest_heart_rate !== null &&
							params.sleep?.lowest_heart_rate !== undefined
								? `${params.sleep.lowest_heart_rate} bpm`
								: "—",
					},
					{
						label: "Temperature drift",
						value: formatTemperatureDelta(
							params.readiness.temperature_deviation
						),
					},
				],
			},
			{
				title: "Lowest contributors",
				description:
					"These readiness drivers are the main reasons the score is leaning higher or lower today.",
				metrics:
					lowestContributors.length > 0
						? lowestContributors.map((entry) => ({
								label: entry.label,
								value: `${entry.value}/100`,
								tone: entry.value < 70 ? "caution" : "neutral",
							}))
						: [
								{
									label: "Contributors",
									value: "No contributor breakdown available",
								},
							],
			},
			{
				title: "Interpretation",
				metrics: [
					{
						label: "Guidance",
						value: params.activeRestMode
							? "Keep today restorative and avoid chasing volume."
							: tone === "boost"
								? "You have room for a stronger day if sleep and stress stay stable."
								: tone === "recover"
									? "Bias toward lighter load, faster recovery, and earlier shutdown tonight."
									: "Hold a steady workload and protect recovery inputs through the evening.",
						tone: toneToMetricTone(tone),
					},
				],
			},
		],
	};
}

function buildOuraSleepCard(params: {
	dailySleep: OuraDailySleepRow | null;
	sleep: OuraSleepRow | null;
	sleepTime: OuraSleepTimeRow | null;
}): InsightCard {
	const score = params.dailySleep?.score ?? null;
	if (!score && !params.sleep?.total_sleep_duration) {
		return buildEmptyCard({
			id: "sleep",
			title: "Sleep Quality",
			icon: "moon",
			summary:
				"Sleep insight appears once Oura has at least one completed night and the ring has synced back into the app.",
		});
	}

	const tone = getSleepTone(score);
	const contributors = getLowestContributors(
		params.dailySleep?.contributors ?? null,
		3
	);
	const bedtimeWindow = formatSleepTimeWindow(
		params.sleepTime?.optimal_bedtime ?? null
	);

	return {
		id: "sleep",
		mode: "live",
		title: "Sleep Quality",
		icon: "moon",
		tone,
		statusLabel:
			tone === "boost"
				? "well restored"
				: tone === "recover"
					? "needs repair"
					: "steady",
		value: score
			? String(Math.round(score))
			: formatDurationSeconds(params.sleep?.total_sleep_duration),
		unit: score ? "score" : undefined,
		supportingValue:
			params.sleep?.total_sleep_duration !== null &&
			params.sleep?.total_sleep_duration !== undefined
				? formatDurationSeconds(params.sleep.total_sleep_duration)
				: undefined,
		summary:
			params.sleepTime?.recommendation && bedtimeWindow
				? `Tonight's best move is ${humanizeSleepRecommendation(
						params.sleepTime.recommendation
					)} around ${bedtimeWindow}.`
				: params.sleep?.efficiency
					? `Efficiency landed at ${params.sleep.efficiency}% with ${formatDurationSeconds(
							params.sleep.total_sleep_duration
						)} of total sleep.`
					: "Oura is tracking both last-night sleep quality and your next bedtime window.",
		caption:
			params.sleep?.efficiency !== null &&
			params.sleep?.efficiency !== undefined
				? `${params.sleep.efficiency}% efficiency`
				: "Nightly sleep summary",
		detailTitle: "Sleep Quality",
		detailSections: [
			{
				title: "Last night",
				metrics: [
					{
						label: "Sleep score",
						value: score ? `${Math.round(score)}/100` : "—",
						tone: toneToMetricTone(tone),
					},
					{
						label: "Total sleep",
						value: formatDurationSeconds(params.sleep?.total_sleep_duration),
					},
					{
						label: "Efficiency",
						value:
							params.sleep?.efficiency !== null &&
							params.sleep?.efficiency !== undefined
								? `${params.sleep.efficiency}%`
								: "—",
					},
					{
						label: "Sleep latency",
						value: formatDurationSeconds(params.sleep?.latency),
					},
				],
			},
			{
				title: "Score drivers",
				description:
					"Oura sleep contributors highlight which part of the night most influenced the score.",
				metrics:
					contributors.length > 0
						? contributors.map((entry) => ({
								label: entry.label,
								value: `${entry.value}/100`,
								tone: entry.value < 70 ? "caution" : "neutral",
							}))
						: [
								{
									label: "Contributors",
									value: "No contributor breakdown available",
								},
							],
			},
			{
				title: "Timing and stages",
				metrics: [
					{
						label: "Optimal bedtime window",
						value: bedtimeWindow ?? "No bedtime window yet",
					},
					{
						label: "Deep sleep",
						value: formatDurationSeconds(params.sleep?.deep_sleep_duration),
					},
					{
						label: "REM sleep",
						value: formatDurationSeconds(params.sleep?.rem_sleep_duration),
					},
					{
						label: "Light sleep",
						value: formatDurationSeconds(params.sleep?.light_sleep_duration),
					},
				],
			},
		],
	};
}

function buildOuraLoadCard(params: {
	activity: OuraActivityRow | null;
	workouts: OuraWorkoutRow[];
	readinessScore: number | null;
	stepGoal: number;
	recentActivities: OuraActivityRow[];
}): InsightCard {
	const workoutsToday = workoutsForDay(
		params.workouts,
		params.activity?.day ?? null
	);
	const currentLoad = withOuraWorkoutLoad(params.activity, workoutsToday);
	const sevenDayLoads = params.recentActivities
		.slice(0, 7)
		.map((row) =>
			withOuraWorkoutLoad(row, workoutsForDay(params.workouts, row.day))
		)
		.filter((value): value is number => value !== null);
	const loadMedian = median(sevenDayLoads);

	if (currentLoad === null && workoutsToday.length === 0) {
		return buildEmptyCard({
			id: "load",
			title: "Load Balance",
			icon: "activity",
			summary:
				"Load balance appears after Oura has at least one synced activity day or workout to compare against your 7-day rhythm.",
		});
	}

	const loadLabel = getLoadLabel({
		currentLoad,
		medianLoad: loadMedian,
		recoveryTone:
			params.readinessScore !== null
				? getOuraReadinessTone(params.readinessScore)
				: "steady",
	});
	const tone =
		loadLabel === "taxed"
			? "recover"
			: loadLabel === "underloaded"
				? "boost"
				: "steady";
	const topWorkout = workoutsToday[0] ?? null;

	return {
		id: "load",
		mode: "live",
		title: "Load Balance",
		icon: "activity",
		tone,
		statusLabel: loadLabel,
		value: capitalize(loadLabel),
		supportingValue:
			params.activity?.score !== null && params.activity?.score !== undefined
				? `Activity ${params.activity.score}`
				: undefined,
		summary:
			currentLoad !== null && loadMedian !== null && loadMedian > 0
				? `Today's load proxy is ${formatPercent(Math.round((currentLoad / loadMedian) * 100))} of your 7-day median.`
				: topWorkout
					? `${topWorkout.activity} is the main load signal logged for today.`
					: "Activity score and workouts are building your current load picture.",
		caption:
			params.activity?.steps !== null && params.activity?.steps !== undefined
				? `${params.activity.steps.toLocaleString()} / ${params.stepGoal.toLocaleString()} steps`
				: `${workoutsToday.length} workout${workoutsToday.length === 1 ? "" : "s"} today`,
		detailTitle: "Load Balance",
		detailSections: [
			{
				title: "Today",
				metrics: [
					{
						label: "Load label",
						value: capitalize(loadLabel),
						tone: toneToMetricTone(tone),
					},
					{
						label: "Activity score",
						value:
							params.activity?.score !== null &&
							params.activity?.score !== undefined
								? `${params.activity.score}/100`
								: "—",
					},
					{
						label: "Active calories",
						value:
							params.activity?.active_calories !== null &&
							params.activity?.active_calories !== undefined
								? `${params.activity.active_calories} kcal`
								: "—",
					},
					{
						label: "Steps",
						value:
							params.activity?.steps !== null &&
							params.activity?.steps !== undefined
								? params.activity.steps.toLocaleString()
								: "—",
					},
				],
			},
			{
				title: "7-day context",
				metrics: [
					{
						label: "Current load proxy",
						value: currentLoad !== null ? `${currentLoad}/100` : "—",
					},
					{
						label: "7-day median",
						value: loadMedian !== null ? `${loadMedian}/100` : "—",
					},
					{
						label: "Workout count today",
						value: String(workoutsToday.length),
					},
				],
			},
			{
				title: "Latest workout",
				metrics: topWorkout
					? [
							{ label: "Activity", value: topWorkout.activity },
							{ label: "Intensity", value: capitalize(topWorkout.intensity) },
							{
								label: "Duration",
								value: formatDateTimeDuration(
									topWorkout.start_datetime,
									topWorkout.end_datetime
								),
							},
							{
								label: "Calories",
								value:
									topWorkout.calories !== null &&
									topWorkout.calories !== undefined
										? `${Math.round(topWorkout.calories)} kcal`
										: "—",
							},
						]
					: [
							{
								label: "Workout",
								value: "No workout logged for the latest activity day",
							},
						],
			},
		],
	};
}

function buildOuraSignalCard(params: {
	stress: OuraStressRow | null;
	resilience: OuraResilienceRow | null;
	spO2: OuraSpO2Row | null;
	cardioAge: OuraCardioAgeRow | null;
	vo2Max: OuraVo2MaxRow | null;
	personalAge: number | null;
	activeRestMode: boolean;
	restorativeSession: OuraSessionRow | null;
}): InsightCard {
	const resilienceLevel = params.resilience?.level ?? null;
	const stressTone = params.activeRestMode
		? "recover"
		: getResilienceTone(resilienceLevel, params.stress?.day_summary ?? null);
	const resilienceContributors = getLowestContributors(
		params.resilience?.contributors ?? null,
		3
	);
	const vascularAgeGap =
		params.cardioAge?.vascular_age !== null &&
		params.cardioAge?.vascular_age !== undefined &&
		params.personalAge !== null
			? params.cardioAge.vascular_age - params.personalAge
			: null;
	const spO2Average = getNestedAverage(params.spO2?.spo2_percentage ?? null);

	if (
		!resilienceLevel &&
		!params.stress &&
		!params.vo2Max &&
		!params.cardioAge
	) {
		return buildEmptyCard({
			id: "signal",
			title: "Stress / Cardio Signal",
			icon: "lungs",
			summary:
				"Stress, resilience, SpO2, and cardio markers will land here once Oura has enough recent recovery history.",
		});
	}

	return {
		id: "signal",
		mode: "live",
		title: "Stress / Cardio Signal",
		icon: "lungs",
		tone: stressTone,
		statusLabel: params.activeRestMode
			? "rest mode"
			: resilienceLevel
				? resilienceLevel.replace("_", " ")
				: "watch",
		value: params.activeRestMode
			? "Rest Mode"
			: resilienceLevel
				? titleCase(resilienceLevel)
				: "Watch",
		supportingValue:
			spO2Average !== null ? `SpO2 ${spO2Average.toFixed(1)}%` : undefined,
		summary: params.activeRestMode
			? "Oura Rest Mode is active, so the dashboard suppresses any push-hard signal until recovery mode ends."
			: params.stress?.day_summary
				? `Today's stress balance reads ${params.stress.day_summary}.`
				: "Longer-term resilience and overnight cardio signals are shaping today's readiness edge.",
		caption:
			params.vo2Max?.vo2_max !== null && params.vo2Max?.vo2_max !== undefined
				? `VO2 max ${params.vo2Max.vo2_max.toFixed(1)}`
				: params.cardioAge?.vascular_age !== null &&
						params.cardioAge?.vascular_age !== undefined
					? `Vascular age ${params.cardioAge.vascular_age}`
					: "Stress and cardio context",
		detailTitle: "Stress / Cardio Signal",
		detailSections: [
			{
				title: "Daily balance",
				metrics: [
					{
						label: "Stress summary",
						value: params.activeRestMode
							? "Rest Mode active"
							: titleCase(params.stress?.day_summary ?? "not available"),
						tone: toneToMetricTone(stressTone),
					},
					{
						label: "High stress time",
						value: formatDurationSeconds(params.stress?.stress_high),
					},
					{
						label: "High recovery time",
						value: formatDurationSeconds(params.stress?.recovery_high),
					},
				],
			},
			{
				title: "Overnight markers",
				metrics: [
					{
						label: "Average SpO2",
						value: spO2Average !== null ? `${spO2Average.toFixed(1)}%` : "—",
					},
					{
						label: "Breathing disturbance index",
						value:
							params.spO2?.breathing_disturbance_index !== null &&
							params.spO2?.breathing_disturbance_index !== undefined
								? String(params.spO2.breathing_disturbance_index)
								: "—",
					},
					{
						label: "Resilience level",
						value: resilienceLevel ? titleCase(resilienceLevel) : "—",
					},
				],
			},
			{
				title: "Longer-term cardio context",
				description:
					params.restorativeSession !== null
						? `${titleCase(params.restorativeSession.type)} was the latest clearly restorative session.`
						: undefined,
				metrics: [
					{
						label: "VO2 max",
						value:
							params.vo2Max?.vo2_max !== null &&
							params.vo2Max?.vo2_max !== undefined
								? params.vo2Max.vo2_max.toFixed(1)
								: "—",
					},
					{
						label: "Vascular age",
						value:
							params.cardioAge?.vascular_age !== null &&
							params.cardioAge?.vascular_age !== undefined
								? String(params.cardioAge.vascular_age)
								: "—",
					},
					{
						label: "Age gap",
						value:
							vascularAgeGap !== null
								? `${vascularAgeGap >= 0 ? "+" : ""}${vascularAgeGap} years`
								: "—",
						tone:
							vascularAgeGap !== null && vascularAgeGap > 2
								? "caution"
								: "neutral",
					},
					...resilienceContributors.slice(0, 2).map((entry) => ({
						label: entry.label,
						value: `${entry.value}/100`,
						tone:
							entry.value < 70 ? ("caution" as const) : ("neutral" as const),
					})),
				],
			},
		],
	};
}

function buildWhoopRecoveryCard(params: {
	recovery: WhoopRecoveryRow | null;
	baselineRecoveries: WhoopRecoveryRow[];
}): InsightCard {
	if (!params.recovery?.recovery_score) {
		return buildEmptyCard({
			id: "recovery",
			title: "Recovery Capacity",
			icon: "heart",
			summary:
				"WHOOP recovery is still calibrating. Keep wearing the band through sleep so HRV and resting heart rate can settle into a stable recovery score.",
		});
	}

	const score = params.recovery.recovery_score;
	const tone = getWhoopRecoveryTone(score);
	const baselineHrv = average(
		params.baselineRecoveries
			.map((row) => row.hrv_rmssd_milli)
			.filter((value): value is number => value !== null)
	);
	const baselineRhr = average(
		params.baselineRecoveries
			.map((row) => row.resting_heart_rate)
			.filter((value): value is number => value !== null)
	);
	const hrvDelta =
		params.recovery.hrv_rmssd_milli !== null && baselineHrv !== null
			? params.recovery.hrv_rmssd_milli - baselineHrv
			: null;
	const rhrDelta =
		params.recovery.resting_heart_rate !== null && baselineRhr !== null
			? params.recovery.resting_heart_rate - baselineRhr
			: null;

	return {
		id: "recovery",
		mode: "live",
		title: "Recovery Capacity",
		icon: "heart",
		tone,
		statusLabel:
			tone === "boost" ? "boost" : tone === "recover" ? "recover" : "steady",
		value: String(Math.round(score)),
		unit: "score",
		supportingValue:
			params.recovery.hrv_rmssd_milli !== null &&
			params.recovery.hrv_rmssd_milli !== undefined
				? `HRV ${Math.round(params.recovery.hrv_rmssd_milli)} ms`
				: undefined,
		summary: params.recovery.user_calibrating
			? "WHOOP is still calibrating recovery, so treat today's score as directional rather than fully anchored."
			: "Recovery blends HRV, resting heart rate, oxygen saturation, and overnight physiology into a single push-versus-protect call.",
		caption:
			params.recovery.resting_heart_rate !== null &&
			params.recovery.resting_heart_rate !== undefined
				? `RHR ${Math.round(params.recovery.resting_heart_rate)} bpm`
				: "Daily recovery summary",
		detailTitle: "Recovery Capacity",
		detailSections: [
			{
				title: "Today",
				metrics: [
					{
						label: "Recovery",
						value: `${Math.round(score)}/100`,
						tone: toneToMetricTone(tone),
					},
					{
						label: "HRV",
						value:
							params.recovery.hrv_rmssd_milli !== null &&
							params.recovery.hrv_rmssd_milli !== undefined
								? `${Math.round(params.recovery.hrv_rmssd_milli)} ms`
								: "—",
					},
					{
						label: "Resting HR",
						value:
							params.recovery.resting_heart_rate !== null &&
							params.recovery.resting_heart_rate !== undefined
								? `${Math.round(params.recovery.resting_heart_rate)} bpm`
								: "—",
					},
					{
						label: "SpO2",
						value:
							params.recovery.spo2_percentage !== null &&
							params.recovery.spo2_percentage !== undefined
								? `${params.recovery.spo2_percentage.toFixed(1)}%`
								: "—",
					},
				],
			},
			{
				title: "30-day context",
				metrics: [
					{
						label: "HRV vs baseline",
						value:
							hrvDelta !== null ? `${formatSignedNumber(hrvDelta)} ms` : "—",
						tone: hrvDelta !== null && hrvDelta < 0 ? "caution" : "neutral",
					},
					{
						label: "RHR vs baseline",
						value:
							rhrDelta !== null ? `${formatSignedNumber(rhrDelta)} bpm` : "—",
						tone: rhrDelta !== null && rhrDelta > 0 ? "caution" : "neutral",
					},
					{
						label: "Skin temperature",
						value:
							params.recovery.skin_temp_celsius !== null &&
							params.recovery.skin_temp_celsius !== undefined
								? `${params.recovery.skin_temp_celsius.toFixed(1)}°C`
								: "—",
					},
				],
			},
			{
				title: "Interpretation",
				metrics: [
					{
						label: "Guidance",
						value:
							tone === "boost"
								? "Your recovery is strong enough to support a bigger training or work output day."
								: tone === "recover"
									? "Keep the day lighter, shorten the edge cases, and protect tonight's sleep."
									: "Stay productive and train, but avoid stacking extra strain late in the day.",
						tone: toneToMetricTone(tone),
					},
					{
						label: "Calibration",
						value: params.recovery.user_calibrating
							? "Still calibrating"
							: "Calibrated",
						tone: params.recovery.user_calibrating ? "caution" : "neutral",
					},
				],
			},
		],
	};
}

function buildWhoopSleepCard(params: {
	sleep: WhoopSleepRow | null;
}): InsightCard {
	const score = params.sleep?.sleep_performance_percentage ?? null;
	if (!score && !params.sleep?.total_in_bed_time_milli) {
		return buildEmptyCard({
			id: "sleep",
			title: "Sleep Quality",
			icon: "moon",
			summary:
				"WHOOP sleep guidance appears after the band scores at least one completed night.",
		});
	}

	const tone = getSleepTone(score);
	const sleepNeed =
		(params.sleep?.baseline_milli ?? 0) +
		(params.sleep?.need_from_sleep_debt_milli ?? 0) +
		(params.sleep?.need_from_recent_strain_milli ?? 0) +
		(params.sleep?.need_from_recent_nap_milli ?? 0);

	return {
		id: "sleep",
		mode: "live",
		title: "Sleep Quality",
		icon: "moon",
		tone,
		statusLabel:
			tone === "boost"
				? "well restored"
				: tone === "recover"
					? "needs repair"
					: "steady",
		value: score
			? String(Math.round(score))
			: formatDurationMillis(params.sleep?.total_in_bed_time_milli),
		unit: score ? "score" : undefined,
		supportingValue:
			params.sleep?.total_in_bed_time_milli !== null &&
			params.sleep?.total_in_bed_time_milli !== undefined
				? formatDurationMillis(params.sleep.total_in_bed_time_milli)
				: undefined,
		summary:
			params.sleep?.need_from_sleep_debt_milli &&
			params.sleep.need_from_sleep_debt_milli > 0
				? `Sleep debt is still adding ${formatDurationMillis(
						params.sleep.need_from_sleep_debt_milli
					)} to your nightly need.`
				: params.sleep?.sleep_efficiency_percentage
					? `Sleep efficiency landed at ${Math.round(
							params.sleep.sleep_efficiency_percentage
						)}% with ${Math.round(params.sleep.sleep_cycle_count ?? 0)} cycles.`
					: "WHOOP is tracking sleep performance, efficiency, consistency, and stage mix.",
		caption:
			params.sleep?.sleep_efficiency_percentage !== null &&
			params.sleep?.sleep_efficiency_percentage !== undefined
				? `${Math.round(params.sleep.sleep_efficiency_percentage)}% efficiency`
				: "Nightly sleep summary",
		detailTitle: "Sleep Quality",
		detailSections: [
			{
				title: "Last night",
				metrics: [
					{
						label: "Sleep performance",
						value: score ? `${Math.round(score)}%` : "—",
						tone: toneToMetricTone(tone),
					},
					{
						label: "Sleep efficiency",
						value:
							params.sleep?.sleep_efficiency_percentage !== null &&
							params.sleep?.sleep_efficiency_percentage !== undefined
								? `${Math.round(params.sleep.sleep_efficiency_percentage)}%`
								: "—",
					},
					{
						label: "Sleep consistency",
						value:
							params.sleep?.sleep_consistency_percentage !== null &&
							params.sleep?.sleep_consistency_percentage !== undefined
								? `${Math.round(params.sleep.sleep_consistency_percentage)}%`
								: "—",
					},
					{
						label: "Respiratory rate",
						value:
							params.sleep?.respiratory_rate !== null &&
							params.sleep?.respiratory_rate !== undefined
								? `${params.sleep.respiratory_rate.toFixed(1)} / min`
								: "—",
					},
				],
			},
			{
				title: "Stages and debt",
				metrics: [
					{
						label: "Slow-wave sleep",
						value: formatDurationMillis(
							params.sleep?.total_slow_wave_sleep_time_milli
						),
					},
					{
						label: "REM sleep",
						value: formatDurationMillis(
							params.sleep?.total_rem_sleep_time_milli
						),
					},
					{
						label: "Awake time",
						value: formatDurationMillis(params.sleep?.total_awake_time_milli),
					},
					{
						label: "Sleep need",
						value: sleepNeed > 0 ? formatDurationMillis(sleepNeed) : "—",
					},
					{
						label: "Sleep debt",
						value: formatDurationMillis(
							params.sleep?.need_from_sleep_debt_milli
						),
						tone:
							params.sleep?.need_from_sleep_debt_milli &&
							params.sleep.need_from_sleep_debt_milli > 0
								? "caution"
								: "neutral",
					},
				],
			},
			{
				title: "Disturbance profile",
				metrics: [
					{
						label: "Sleep cycles",
						value:
							params.sleep?.sleep_cycle_count !== null &&
							params.sleep?.sleep_cycle_count !== undefined
								? String(params.sleep.sleep_cycle_count)
								: "—",
					},
					{
						label: "Disturbances",
						value:
							params.sleep?.disturbance_count !== null &&
							params.sleep?.disturbance_count !== undefined
								? String(params.sleep.disturbance_count)
								: "—",
					},
				],
			},
		],
	};
}

function buildWhoopLoadCard(params: {
	cycle: WhoopCycleRow | null;
	workouts: WhoopWorkoutRow[];
	recoveryScore: number | null;
	recentCycles: WhoopCycleRow[];
}): InsightCard {
	const currentNormalized =
		params.cycle?.strain !== null && params.cycle?.strain !== undefined
			? normalizeWhoopStrain(params.cycle.strain)
			: null;
	const medianLoad = median(
		params.recentCycles
			.slice(0, 7)
			.map((row) =>
				row.strain !== null && row.strain !== undefined
					? normalizeWhoopStrain(row.strain)
					: null
			)
			.filter((value): value is number => value !== null)
	);

	if (currentNormalized === null && params.workouts.length === 0) {
		return buildEmptyCard({
			id: "load",
			title: "Load Balance",
			icon: "activity",
			summary:
				"Load balance appears once WHOOP has enough cycle strain or workout history to compare against your recent baseline.",
		});
	}

	const loadLabel = getLoadLabel({
		currentLoad: currentNormalized,
		medianLoad,
		recoveryTone:
			params.recoveryScore !== null
				? getWhoopRecoveryTone(params.recoveryScore)
				: "steady",
	});
	const tone =
		loadLabel === "taxed"
			? "recover"
			: loadLabel === "underloaded"
				? "boost"
				: "steady";
	const topWorkout = params.workouts[0] ?? null;

	return {
		id: "load",
		mode: "live",
		title: "Load Balance",
		icon: "activity",
		tone,
		statusLabel: loadLabel,
		value: capitalize(loadLabel),
		supportingValue:
			params.cycle?.strain !== null && params.cycle?.strain !== undefined
				? `Strain ${params.cycle.strain.toFixed(1)}`
				: undefined,
		summary:
			currentNormalized !== null && medianLoad !== null && medianLoad > 0
				? `Cycle strain is ${formatPercent(
						Math.round((currentNormalized / medianLoad) * 100)
					)} of your 7-day median load.`
				: topWorkout
					? `${topWorkout.sport_name ?? "Workout"} is the main training signal in the latest cycle.`
					: "WHOOP is using cycle strain and workouts to estimate how taxed the day feels.",
		caption:
			topWorkout?.sport_name !== null && topWorkout?.sport_name !== undefined
				? topWorkout.sport_name
				: `${params.workouts.length} workout${params.workouts.length === 1 ? "" : "s"} in this cycle`,
		detailTitle: "Load Balance",
		detailSections: [
			{
				title: "Current cycle",
				metrics: [
					{
						label: "Load label",
						value: capitalize(loadLabel),
						tone: toneToMetricTone(tone),
					},
					{
						label: "Cycle strain",
						value:
							params.cycle?.strain !== null &&
							params.cycle?.strain !== undefined
								? params.cycle.strain.toFixed(1)
								: "—",
					},
					{
						label: "Energy burn",
						value:
							params.cycle?.kilojoule !== null &&
							params.cycle?.kilojoule !== undefined
								? `${Math.round(params.cycle.kilojoule)} kJ`
								: "—",
					},
					{
						label: "Average heart rate",
						value:
							params.cycle?.average_heart_rate !== null &&
							params.cycle?.average_heart_rate !== undefined
								? `${params.cycle.average_heart_rate} bpm`
								: "—",
					},
				],
			},
			{
				title: "7-day context",
				metrics: [
					{
						label: "Current load proxy",
						value:
							currentNormalized !== null ? `${currentNormalized}/100` : "—",
					},
					{
						label: "7-day median",
						value: medianLoad !== null ? `${medianLoad}/100` : "—",
					},
					{
						label: "Workout count",
						value: String(params.workouts.length),
					},
				],
			},
			{
				title: "Latest workout",
				metrics: topWorkout
					? [
							{
								label: "Sport",
								value: topWorkout.sport_name ?? "Workout",
							},
							{
								label: "Workout strain",
								value:
									topWorkout.strain !== null && topWorkout.strain !== undefined
										? topWorkout.strain.toFixed(1)
										: "—",
							},
							{
								label: "Duration",
								value: formatDateTimeDuration(
									topWorkout.start_at,
									topWorkout.end_at
								),
							},
							{
								label: "Peak zone time",
								value: formatDurationMillis(getPeakWhoopZone(topWorkout)),
							},
						]
					: [
							{
								label: "Workout",
								value: "No workout detected in the latest cycle",
							},
						],
			},
		],
	};
}

function buildWhoopSignalCard(params: {
	recovery: WhoopRecoveryRow | null;
	sleep: WhoopSleepRow | null;
	recoveryRows: WhoopRecoveryRow[];
}): InsightCard {
	const baselineHrv = average(
		params.recoveryRows
			.map((row) => row.hrv_rmssd_milli)
			.filter((value): value is number => value !== null)
	);
	const baselineRhr = average(
		params.recoveryRows
			.map((row) => row.resting_heart_rate)
			.filter((value): value is number => value !== null)
	);
	const hrvDelta =
		params.recovery?.hrv_rmssd_milli !== null &&
		params.recovery?.hrv_rmssd_milli !== undefined &&
		baselineHrv !== null
			? params.recovery.hrv_rmssd_milli - baselineHrv
			: null;
	const rhrDelta =
		params.recovery?.resting_heart_rate !== null &&
		params.recovery?.resting_heart_rate !== undefined &&
		baselineRhr !== null
			? params.recovery.resting_heart_rate - baselineRhr
			: null;
	const tone =
		(rhrDelta !== null && rhrDelta > 2) ||
		(hrvDelta !== null && hrvDelta < -8) ||
		(params.sleep?.respiratory_rate !== null &&
			params.sleep?.respiratory_rate !== undefined &&
			params.sleep.respiratory_rate > 18.5)
			? "recover"
			: "steady";

	if (!params.recovery && !params.sleep) {
		return buildEmptyCard({
			id: "signal",
			title: "Stress / Cardio Signal",
			icon: "lungs",
			summary:
				"WHOOP uses HRV, resting heart rate, oxygen, temperature, and overnight breathing to flag whether the system looks stable or stretched.",
		});
	}

	const value =
		rhrDelta !== null
			? `${formatSignedNumber(rhrDelta)} bpm`
			: hrvDelta !== null
				? `${formatSignedNumber(hrvDelta)} ms`
				: "Stable";

	return {
		id: "signal",
		mode: "live",
		title: "Stress / Cardio Signal",
		icon: "lungs",
		tone,
		statusLabel: tone === "recover" ? "watch" : "stable",
		value,
		supportingValue:
			params.sleep?.respiratory_rate !== null &&
			params.sleep?.respiratory_rate !== undefined
				? `Resp ${params.sleep.respiratory_rate.toFixed(1)}/min`
				: undefined,
		summary:
			tone === "recover"
				? "Resting heart rate and HRV are drifting away from baseline enough to keep the day more conservative."
				: "Cardio stress markers are close to baseline, so the system looks relatively steady.",
		caption:
			params.recovery?.spo2_percentage !== null &&
			params.recovery?.spo2_percentage !== undefined
				? `SpO2 ${params.recovery.spo2_percentage.toFixed(1)}%`
				: "Baseline comparison",
		detailTitle: "Stress / Cardio Signal",
		detailSections: [
			{
				title: "30-day baseline check",
				metrics: [
					{
						label: "RHR vs baseline",
						value:
							rhrDelta !== null ? `${formatSignedNumber(rhrDelta)} bpm` : "—",
						tone: rhrDelta !== null && rhrDelta > 0 ? "caution" : "neutral",
					},
					{
						label: "HRV vs baseline",
						value:
							hrvDelta !== null ? `${formatSignedNumber(hrvDelta)} ms` : "—",
						tone: hrvDelta !== null && hrvDelta < 0 ? "caution" : "neutral",
					},
					{
						label: "Skin temperature",
						value:
							params.recovery?.skin_temp_celsius !== null &&
							params.recovery?.skin_temp_celsius !== undefined
								? `${params.recovery.skin_temp_celsius.toFixed(1)}°C`
								: "—",
					},
				],
			},
			{
				title: "Overnight signals",
				metrics: [
					{
						label: "Respiratory rate",
						value:
							params.sleep?.respiratory_rate !== null &&
							params.sleep?.respiratory_rate !== undefined
								? `${params.sleep.respiratory_rate.toFixed(1)} / min`
								: "—",
					},
					{
						label: "SpO2",
						value:
							params.recovery?.spo2_percentage !== null &&
							params.recovery?.spo2_percentage !== undefined
								? `${params.recovery.spo2_percentage.toFixed(1)}%`
								: "—",
					},
					{
						label: "Disturbances",
						value:
							params.sleep?.disturbance_count !== null &&
							params.sleep?.disturbance_count !== undefined
								? String(params.sleep.disturbance_count)
								: "—",
					},
				],
			},
		],
	};
}

function buildOuraTrendSummary(params: {
	readinessRows: OuraReadinessRow[];
	activityRows: OuraActivityRow[];
}): DashboardTrendSummary {
	const readinessByDay = new Map(
		params.readinessRows.map((row) => [row.day, row])
	);
	const activityByDay = new Map(
		params.activityRows.map((row) => [row.day, row])
	);
	const recentDays = mergeRecentDays([
		...params.readinessRows.map((row) => row.day),
		...params.activityRows.map((row) => row.day),
	]).slice(0, 7);

	if (recentDays.length === 0) {
		return buildEmptyTrendSummary({
			provider: "Oura",
			message:
				"Your 7-day Oura balance appears once daily readiness and activity summaries start arriving.",
		});
	}

	const points = recentDays
		.map((day) => {
			const readiness = readinessByDay.get(day);
			const activity = activityByDay.get(day);
			return {
				label: weekdayLetter(day),
				fullLabel: formatWeekday(day),
				dateLabel: formatDateLabel(day),
				primary: readiness?.score ?? null,
				secondary: activity?.score ?? null,
				primaryDisplay:
					readiness?.score !== null && readiness?.score !== undefined
						? `${Math.round(readiness.score)}`
						: "—",
				secondaryDisplay:
					activity?.score !== null && activity?.score !== undefined
						? `${Math.round(activity.score)}`
						: "—",
			};
		})
		.reverse();

	const bestPoint = selectBestPoint(points);
	const pointsWithBest = points.map((point) => ({
		...point,
		best: bestPoint?.dateLabel === point.dateLabel,
	}));

	return {
		title: "7-Day Balance",
		description: "Readiness versus activity score across the last full week.",
		primaryLabel: "Readiness",
		secondaryLabel: "Activity",
		points: pointsWithBest,
		primaryAverageLabel: formatAverageLabel(
			"Readiness",
			pointsWithBest,
			"primary"
		),
		secondaryAverageLabel: formatAverageLabel(
			"Activity",
			pointsWithBest,
			"secondary"
		),
		bestDayLabel: bestPoint
			? `${bestPoint.fullLabel} ${bestPoint.dateLabel}`
			: "Not enough data",
		streakLabel: describeStreak(pointsWithBest, 80, "readiness"),
	};
}

function buildWhoopTrendSummary(params: {
	recoveryRows: WhoopRecoveryRow[];
	cycleRows: WhoopCycleRow[];
}): DashboardTrendSummary {
	const cycleById = new Map(
		params.cycleRows.map((row) => [row.whoop_cycle_id, row] as const)
	);
	const recoveryByDay = new Map<string, WhoopRecoveryRow>();
	for (const row of params.recoveryRows) {
		const cycle = cycleById.get(row.whoop_cycle_id);
		const cycleDay = cycle
			? toDateOnly(cycle.start_at ?? row.whoop_updated_at)
			: toDateOnly(row.whoop_updated_at);
		if (!recoveryByDay.has(cycleDay)) {
			recoveryByDay.set(cycleDay, row);
		}
	}
	const cycleByDay = new Map<string, WhoopCycleRow>();
	for (const row of params.cycleRows) {
		const day = toDateOnly(row.start_at);
		if (!cycleByDay.has(day)) {
			cycleByDay.set(day, row);
		}
	}
	const recentDays = mergeRecentDays([
		...Array.from(recoveryByDay.keys()),
		...Array.from(cycleByDay.keys()),
	]).slice(0, 7);

	if (recentDays.length === 0) {
		return buildEmptyTrendSummary({
			provider: "WHOOP",
			message:
				"Your 7-day WHOOP balance appears once recovery and cycle strain have enough recent history.",
		});
	}

	const points = recentDays
		.map((day) => {
			const recovery = recoveryByDay.get(day);
			const cycle = cycleByDay.get(day);
			const secondary =
				cycle?.strain !== null && cycle?.strain !== undefined
					? normalizeWhoopStrain(cycle.strain)
					: null;

			return {
				label: weekdayLetter(day),
				fullLabel: formatWeekday(day),
				dateLabel: formatDateLabel(day),
				primary: recovery?.recovery_score ?? null,
				secondary,
				primaryDisplay:
					recovery?.recovery_score !== null &&
					recovery?.recovery_score !== undefined
						? `${Math.round(recovery.recovery_score)}`
						: "—",
				secondaryDisplay: secondary !== null ? `${secondary}` : "—",
			};
		})
		.reverse();

	const bestPoint = selectBestPoint(points);
	const pointsWithBest = points.map((point) => ({
		...point,
		best: bestPoint?.dateLabel === point.dateLabel,
	}));

	return {
		title: "7-Day Balance",
		description: "Recovery versus normalized strain across the last full week.",
		primaryLabel: "Recovery",
		secondaryLabel: "Strain",
		points: pointsWithBest,
		primaryAverageLabel: formatAverageLabel(
			"Recovery",
			pointsWithBest,
			"primary"
		),
		secondaryAverageLabel: formatAverageLabel(
			"Strain",
			pointsWithBest,
			"secondary"
		),
		bestDayLabel: bestPoint
			? `${bestPoint.fullLabel} ${bestPoint.dateLabel}`
			: "Not enough data",
		streakLabel: describeStreak(pointsWithBest, 67, "recovery"),
	};
}

function buildOuraActions(params: {
	state: DashboardState;
	recoveryCard: InsightCard;
	sleepCard: InsightCard;
	loadCard: InsightCard;
	signalCard: InsightCard;
	sleep: OuraSleepRow | null;
	sleepTime: OuraSleepTimeRow | null;
	readiness: OuraReadinessRow | null;
	stress: OuraStressRow | null;
	resilience: OuraResilienceRow | null;
	activeRestMode: boolean;
	restorativeSession: OuraSessionRow | null;
	loadMedian: number | null;
	currentLoad: number | null;
}): ActionItem[] {
	if (params.state === "syncing") {
		return [
			{
				id: "oura-first-sleep",
				title: "Wear Oura through the next full sleep",
				description:
					"The first complete night unlocks readiness, sleep, and the first real recovery guidance.",
				icon: "moon",
				tone: "steady",
			},
			{
				id: "oura-open-app",
				title: "Open the Oura app in the morning",
				description:
					"The dashboard only becomes useful once Oura syncs the overnight data back into the account.",
				icon: "watch",
				tone: "steady",
			},
			{
				id: "oura-baseline-timeline",
				title: "Expect the first week to sharpen fast",
				description:
					"The first score arrives after the next full sleep, then the baseline gets noticeably better over the next few complete days.",
				icon: "spark",
				tone: "neutral",
			},
		];
	}

	const actions: ActionItem[] = [];

	if (params.state === "stale") {
		actions.push({
			id: "oura-refresh",
			title: "Refresh Oura before trusting today's view",
			description:
				"The latest data is outside the freshness window. Open Oura and let the next sync land before you treat this as today's full picture.",
			icon: "watch",
			tone: "warning",
		});
	}

	if (params.sleep) {
		const shouldPromptSleep =
			(params.sleep.total_sleep_duration ?? 0) < 7 * 60 * 60 ||
			(params.sleep.efficiency ?? 100) < 85 ||
			(params.sleepTime?.recommendation !== null &&
				params.sleepTime?.recommendation !== undefined &&
				params.sleepTime.recommendation !== "follow_optimal_bedtime");

		if (shouldPromptSleep) {
			actions.push({
				id: "oura-sleep",
				title: "Tighten tonight's sleep window",
				description:
					params.sleepTime?.recommendation && params.sleepTime?.optimal_bedtime
						? `${humanizeSleepRecommendation(
								params.sleepTime.recommendation
							)} and aim for ${formatSleepTimeWindow(
								params.sleepTime.optimal_bedtime
							)}.`
						: `Last night delivered ${formatDurationSeconds(
								params.sleep.total_sleep_duration
							)} with ${params.sleep.efficiency ?? "—"}% efficiency. Protect an earlier shutdown tonight.`,
				icon: "moon",
				tone: "recover",
			});
		}
	}

	if (params.activeRestMode) {
		actions.push({
			id: "oura-rest-mode",
			title: "Stay in recovery mode",
			description:
				"Rest Mode is active, so keep training volume and cognitive load conservative until the ring exits recovery mode.",
			icon: "shield",
			tone: "recover",
		});
	} else if (
		params.readiness?.score !== null &&
		params.readiness?.score !== undefined &&
		params.currentLoad !== null &&
		params.loadMedian !== null
	) {
		const recoveryTone = getOuraReadinessTone(params.readiness.score);
		if (recoveryTone === "recover" && params.currentLoad > params.loadMedian) {
			actions.push({
				id: "oura-load-mismatch",
				title: "Trade intensity for steadiness",
				description:
					"Your readiness is asking for recovery, but today's load is already running above your recent median. Bias toward lighter, cleaner work.",
				icon: "activity",
				tone: "recover",
			});
		} else if (
			recoveryTone === "boost" &&
			params.currentLoad < params.loadMedian * 0.85
		) {
			actions.push({
				id: "oura-room-to-push",
				title: "Use the available headroom",
				description:
					"Recovery looks strong and today's load is lighter than your recent norm. If the day allows it, this is the window for a deliberate push.",
				icon: "spark",
				tone: "boost",
			});
		}
	}

	if (params.stress) {
		const stressGap =
			(params.stress.stress_high ?? 0) - (params.stress.recovery_high ?? 0);
		if (
			stressGap > 60 * 60 ||
			params.stress.day_summary === "stressful" ||
			params.resilience?.level === "limited" ||
			params.resilience?.level === "adequate"
		) {
			actions.push({
				id: "oura-stress",
				title: "Create a deliberate recovery block",
				description: params.restorativeSession
					? `Stress is outpacing recovery today. Repeat a short ${params.restorativeSession.type} or another low-stimulus block before the evening.`
					: "Stress is outrunning daytime recovery. Insert one low-stimulation block before the evening to rebalance the day.",
				icon: "lungs",
				tone: "steady",
			});
		}
	}

	if (params.state === "baseline_forming") {
		actions.push({
			id: "oura-baseline",
			title: "Give the baseline a few more days",
			description:
				"Early Oura guidance is directional. Another few nights of data will make readiness and stress patterns noticeably more stable.",
			icon: "watch",
			tone: "neutral",
		});
	}

	const deduped = dedupeActions(actions);
	if (deduped.length === 0) {
		deduped.push({
			id: "oura-steady",
			title: "Protect the steady day",
			description:
				"Nothing is flashing red right now. Keep the day deliberate, avoid adding unnecessary friction late, and protect tonight's sleep.",
			icon: "spark",
			tone: "steady",
		});
	}

	return deduped.slice(0, 3);
}

function buildWhoopActions(params: {
	state: DashboardState;
	recovery: WhoopRecoveryRow | null;
	sleep: WhoopSleepRow | null;
	cycle: WhoopCycleRow | null;
	workouts: WhoopWorkoutRow[];
	recoveryCard: InsightCard;
	loadCard: InsightCard;
	signalCard: InsightCard;
}): ActionItem[] {
	if (params.state === "syncing") {
		return [
			{
				id: "whoop-first-sleep",
				title: "Keep WHOOP on through the next sleep",
				description:
					"WHOOP needs one complete sleep and recovery cycle before the first live guidance can appear.",
				icon: "moon",
				tone: "steady",
			},
			{
				id: "whoop-sync",
				title: "Let the first scored cycle finish",
				description:
					"Once WHOOP finishes the overnight scoring pass, recovery, sleep, and load signals start populating the dashboard.",
				icon: "watch",
				tone: "steady",
			},
			{
				id: "whoop-baseline-timeline",
				title: "Expect the first week to sharpen fast",
				description:
					"The first score is directional. The next few full cycles make the baseline much more believable.",
				icon: "spark",
				tone: "neutral",
			},
		];
	}

	const actions: ActionItem[] = [];

	if (params.state === "stale") {
		actions.push({
			id: "whoop-refresh",
			title: "Refresh WHOOP before trusting today's view",
			description:
				"The latest WHOOP data is stale. Let the next sync land before you treat this as today's full operating picture.",
			icon: "watch",
			tone: "warning",
		});
	}

	if (
		params.sleep &&
		((params.sleep.need_from_sleep_debt_milli ?? 0) > 30 * 60 * 1000 ||
			(params.sleep.sleep_performance_percentage ?? 100) < 85 ||
			(params.sleep.sleep_consistency_percentage ?? 100) < 75)
	) {
		actions.push({
			id: "whoop-sleep",
			title: "Pay down sleep debt first",
			description:
				(params.sleep.need_from_sleep_debt_milli ?? 0) > 0
					? `WHOOP still sees ${formatDurationMillis(
							params.sleep.need_from_sleep_debt_milli
						)} of sleep debt. Give back time tonight before stacking more strain.`
					: "Sleep performance is slipping enough that the next best gain comes from bedtime consistency, not more load.",
			icon: "moon",
			tone: "recover",
		});
	}

	if (
		params.recovery?.recovery_score !== null &&
		params.recovery?.recovery_score !== undefined &&
		params.cycle?.strain !== null &&
		params.cycle?.strain !== undefined
	) {
		if (
			getWhoopRecoveryTone(params.recovery.recovery_score) === "recover" &&
			params.cycle.strain > 14
		) {
			actions.push({
				id: "whoop-load-mismatch",
				title: "Lower the edge on the next effort",
				description:
					"Recovery is low while strain is already elevated. Shorten the hard session or swap it for easier volume so tomorrow doesn't compound.",
				icon: "activity",
				tone: "recover",
			});
		} else if (
			getWhoopRecoveryTone(params.recovery.recovery_score) === "boost" &&
			params.cycle.strain < 9
		) {
			actions.push({
				id: "whoop-headroom",
				title: "Use today's extra headroom well",
				description:
					"Recovery is strong and the cycle strain is still modest. This is the cleaner window for higher output if you want to spend it.",
				icon: "spark",
				tone: "boost",
			});
		}
	}

	if (
		params.signalCard.tone === "recover" ||
		params.recovery?.user_calibrating ||
		(params.sleep?.respiratory_rate ?? 0) > 18.5
	) {
		actions.push({
			id: "whoop-signal",
			title: "Respect the cardio stress signal",
			description: params.recovery?.user_calibrating
				? "WHOOP is still calibrating recovery, so lean more on sleep quality and perceived strain than a single score."
				: "Resting heart rate, HRV, or breathing drift says the system is carrying more load than usual. Keep the day cleaner and recover harder tonight.",
			icon: "lungs",
			tone: "steady",
		});
	}

	if (params.state === "baseline_forming") {
		actions.push({
			id: "whoop-baseline",
			title: "Let WHOOP finish building the baseline",
			description:
				"The first week is mostly calibration. A few more full sleep and recovery cycles will make the guidance more dependable.",
			icon: "watch",
			tone: "neutral",
		});
	}

	const deduped = dedupeActions(actions);
	if (deduped.length === 0) {
		deduped.push({
			id: "whoop-steady",
			title: "Spend the steady day well",
			description:
				"Recovery and load are reasonably aligned. Use the headroom intentionally, but do not waste it on late-day noise that taxes tonight's sleep.",
			icon: "spark",
			tone: "steady",
		});
	}

	return deduped.slice(0, 3);
}

function buildConnectionPanel(params: {
	connections: DashboardConnections;
	provider: DashboardProvider | null;
	lastSyncedLabel: string | null;
}): ConnectionPanelState {
	const noProvidersAvailable =
		!params.connections.isOuraAvailable && !params.connections.isWhoopAvailable;
	const featuredProvider = resolveFeaturedProvider({
		connections: params.connections,
		provider: params.provider,
	});
	const preferredProvider = params.provider ?? featuredProvider ?? "oura";
	const ouraStatus = resolveDeviceStatus({
		provider: "oura",
		connections: params.connections,
		activeProvider: params.provider,
	});
	const whoopStatus = resolveDeviceStatus({
		provider: "whoop",
		connections: params.connections,
		activeProvider: params.provider,
	});

	const ouraPanel = buildDevicePanel({
		provider: "oura",
		status: ouraStatus,
		featured: featuredProvider === "oura",
		lastSyncedLabel: params.provider === "oura" ? params.lastSyncedLabel : null,
	});
	const whoopPanel = buildDevicePanel({
		provider: "whoop",
		status: whoopStatus,
		featured: featuredProvider === "whoop",
		lastSyncedLabel:
			params.provider === "whoop" ? params.lastSyncedLabel : null,
	});

	return {
		activeProvider: params.provider,
		headline: noProvidersAvailable
			? "Wearables are not available right now"
			: params.provider === "oura"
				? "Oura is your active wearable"
				: params.provider === "whoop"
					? "WHOOP is your active wearable"
					: "Choose your source",
		description: noProvidersAvailable
			? "This environment cannot connect Oura or WHOOP yet, so the dashboard stays in onboarding mode."
			: params.provider === "oura"
				? "Readiness, sleep timing, stress balance, and cardio markers are currently shaping the dashboard."
				: params.provider === "whoop"
					? "Recovery, strain, sleep performance, and workout load are currently shaping the dashboard."
					: "Pick the device you actually wear most consistently. The dashboard uses one active wearable at a time so guidance stays clean and comparable.",
		primary: preferredProvider === "whoop" ? whoopPanel : ouraPanel,
		secondary: preferredProvider === "whoop" ? ouraPanel : whoopPanel,
	};
}

function buildDevicePanel(params: {
	provider: DashboardProvider;
	status: DashboardDeviceStatus;
	featured: boolean;
	lastSyncedLabel: string | null;
}): ConnectionDevicePanelState {
	const isOura = params.provider === "oura";
	const deviceName = isOura ? "Oura" : "WHOOP";

	if (params.status === "connected") {
		return {
			id: params.provider,
			deviceName,
			image: isOura ? "/oura.png" : "/whoop.png",
			status: "connected",
			featured: params.featured,
			description: isOura
				? "Currently driving guidance with readiness, sleep timing, stress balance, and cardio context."
				: "Currently driving guidance with recovery, strain, workouts, and load management.",
			actionLabel: `Disconnect ${deviceName}`,
			actionHref: `/api/integrations/${params.provider}/disconnect?returnTo=/dashboard`,
			actionMethod: "post",
			lastSyncedLabel: params.lastSyncedLabel,
		};
	}

	if (params.status === "blocked") {
		return {
			id: params.provider,
			deviceName,
			image: isOura ? "/oura.png" : "/whoop.png",
			status: "blocked",
			featured: false,
			description: isOura
				? "Unavailable until WHOOP is disconnected. The dashboard only supports one active wearable source."
				: "Unavailable until Oura is disconnected. The dashboard only supports one active wearable source.",
			actionLabel: "Switch on the Devices page",
			lastSyncedLabel: null,
		};
	}

	if (params.status === "unavailable") {
		return {
			id: params.provider,
			deviceName,
			image: isOura ? "/oura.png" : "/whoop.png",
			status: "unavailable",
			featured: false,
			description:
				"This option is not available right now, so it will not appear in your live dashboard setup path.",
			actionLabel: "Not available yet",
			lastSyncedLabel: null,
		};
	}

	return {
		id: params.provider,
		deviceName,
		image: isOura ? "/oura.png" : "/whoop.png",
		status: "not_connected",
		featured: params.featured,
		description: isOura
			? "Best if you care about daily readiness, sleep timing, stress balance, and how your physiology is trending."
			: "Best if you care about recovery, strain, workout load, and whether hard training is actually landing well.",
		actionLabel: `Connect ${deviceName}`,
		actionHref: `/api/integrations/${params.provider}/authorize?returnTo=/dashboard`,
		actionMethod: "get",
		navigationKind: "document",
		lastSyncedLabel: null,
	};
}

function resolveDeviceStatus(params: {
	provider: DashboardProvider;
	connections: DashboardConnections;
	activeProvider: DashboardProvider | null;
}): DashboardDeviceStatus {
	if (params.provider === "oura") {
		if (!params.connections.isOuraAvailable) return "unavailable";
		if (params.connections.ouraConnected) return "connected";
		if (params.activeProvider === "whoop") return "blocked";
		return "not_connected";
	}

	if (!params.connections.isWhoopAvailable) return "unavailable";
	if (params.connections.whoopConnected) return "connected";
	if (params.activeProvider === "oura") return "blocked";
	return "not_connected";
}

function resolveFeaturedProvider(params: {
	connections: DashboardConnections;
	provider: DashboardProvider | null;
}) {
	if (params.provider) {
		return params.provider;
	}

	const availableProviders: DashboardProvider[] = [];
	if (params.connections.isOuraAvailable) {
		availableProviders.push("oura");
	}
	if (params.connections.isWhoopAvailable) {
		availableProviders.push("whoop");
	}

	return availableProviders.length === 1 ? availableProviders[0] : null;
}

function buildHeroActions(params: {
	state: DashboardState;
	connections: DashboardConnections;
	provider: DashboardProvider | null;
}): DashboardActionLink[] {
	const secondaryAction: DashboardActionLink = {
		id: "step-goal",
		label: "Set daily step goal",
		href: "/dashboard/settings",
		tone: "secondary",
		icon: "arrow",
		navigationKind: "app",
	};

	if (params.state === "conflict") {
		return [
			{
				id: "resolve-connections",
				label: "Resolve connections",
				href: "/dashboard/devices",
				tone: "primary",
				icon: "shield",
				navigationKind: "app",
			},
			secondaryAction,
		];
	}

	if (params.provider) {
		return [
			{
				id: "manage-wearable",
				label:
					params.state === "syncing" ? "Review connection" : "Manage wearable",
				href: "/dashboard/devices",
				tone: "primary",
				icon: "watch",
				navigationKind: "app",
			},
			secondaryAction,
		];
	}

	const singleAvailableProvider = resolveFeaturedProvider({
		connections: params.connections,
		provider: null,
	});

	if (singleAvailableProvider) {
		return [
			{
				id: `connect-${singleAvailableProvider}`,
				label: `Connect ${singleAvailableProvider === "oura" ? "Oura" : "WHOOP"}`,
				href: `/api/integrations/${singleAvailableProvider}/authorize?returnTo=/dashboard`,
				tone: "primary",
				icon: "watch",
				navigationKind: "document",
			},
			secondaryAction,
		];
	}

	return [
		{
			id: "connect-wearable",
			label:
				params.connections.isOuraAvailable ||
				params.connections.isWhoopAvailable
					? "Connect a wearable"
					: "View device options",
			href: "/dashboard/devices",
			tone: "primary",
			icon: "watch",
			navigationKind: "app",
		},
		secondaryAction,
	];
}

function buildJourneySteps(params: {
	state: DashboardState;
	providerLabel: string;
	connections: DashboardConnections;
}): DashboardJourneyStep[] {
	const sourceLabel =
		params.providerLabel === "Wearable"
			? "your wearable"
			: params.providerLabel;
	const hasAvailableProvider =
		params.connections.isOuraAvailable || params.connections.isWhoopAvailable;

	if (params.state === "conflict") {
		return [
			{
				id: "connect",
				title: "Choose one wearable",
				description:
					"Disconnect one provider so the dashboard can build one clean source of biometric truth.",
				state: "current",
				icon: "watch",
			},
			{
				id: "first-sync",
				title: "First full sync",
				description: `Once one provider remains, ${sourceLabel} can populate the first complete daily signals.`,
				state: "upcoming",
				icon: "spark",
			},
			{
				id: "baseline",
				title: "Baseline forms",
				description:
					"A few complete days make the recovery, sleep, and load guidance noticeably more stable.",
				state: "upcoming",
				icon: "shield",
			},
			{
				id: "pattern",
				title: "Weekly pattern appears",
				description:
					"The 7-day balance view turns into a live weekly operating picture once enough scored days exist.",
				state: "upcoming",
				icon: "activity",
			},
		];
	}

	if (params.state === "none") {
		return [
			{
				id: "connect",
				title: hasAvailableProvider
					? "Connect one wearable"
					: "Waiting for device access",
				description: hasAvailableProvider
					? "Pick Oura or WHOOP based on what you actually wear consistently. One source keeps guidance cleaner."
					: "The dashboard is ready, but this environment cannot expose Oura or WHOOP connections yet.",
				state: "current",
				icon: "watch",
			},
			{
				id: "first-sync",
				title: "First full sync",
				description:
					"Complete one full sleep and let the companion app sync the next morning.",
				state: "upcoming",
				icon: "spark",
			},
			{
				id: "baseline",
				title: "Baseline forms",
				description:
					"The next few complete days build enough history for stable comparisons instead of one-off readings.",
				state: "upcoming",
				icon: "shield",
			},
			{
				id: "pattern",
				title: "Weekly pattern appears",
				description:
					"After enough scored days, the dashboard shifts from setup guidance to a true weekly balance view.",
				state: "upcoming",
				icon: "activity",
			},
		];
	}

	if (params.state === "syncing") {
		return [
			{
				id: "connect",
				title: "Connect one wearable",
				description: `${sourceLabel} is connected and ready to start feeding the dashboard.`,
				state: "complete",
				icon: "watch",
			},
			{
				id: "first-sync",
				title: "First full sync",
				description:
					"The next complete sleep unlocks the first scored recovery and sleep guidance.",
				state: "current",
				icon: "spark",
			},
			{
				id: "baseline",
				title: "Baseline forms",
				description:
					"After a few complete days, the dashboard starts comparing today against your own recent rhythm.",
				state: "upcoming",
				icon: "shield",
			},
			{
				id: "pattern",
				title: "Weekly pattern appears",
				description:
					"Once enough scored days exist, the weekly balance view becomes the main trend surface.",
				state: "upcoming",
				icon: "activity",
			},
		];
	}

	if (params.state === "baseline_forming") {
		return [
			{
				id: "connect",
				title: "Connect one wearable",
				description: `${sourceLabel} is connected and feeding the dashboard.`,
				state: "complete",
				icon: "watch",
			},
			{
				id: "first-sync",
				title: "First full sync",
				description:
					"The first scored guidance is already live, so the dashboard has moved past setup-only mode.",
				state: "complete",
				icon: "spark",
			},
			{
				id: "baseline",
				title: "Baseline forms",
				description:
					"A few more complete days will make comparisons, actions, and weekly patterns more dependable.",
				state: "current",
				icon: "shield",
			},
			{
				id: "pattern",
				title: "Weekly pattern appears",
				description:
					"After enough fully scored days, the 7-day balance view becomes the main trend surface.",
				state: "upcoming",
				icon: "activity",
			},
		];
	}

	return [
		{
			id: "connect",
			title: "Connect one wearable",
			description: `${sourceLabel} is connected and established as the dashboard source.`,
			state: "complete",
			icon: "watch",
		},
		{
			id: "first-sync",
			title: "First full sync",
			description:
				"The first scored guidance has already landed and is informing your daily view.",
			state: "complete",
			icon: "spark",
		},
		{
			id: "baseline",
			title: "Baseline forms",
			description:
				"Your recent history is now good enough for stable comparisons across recovery, sleep, and load.",
			state: "complete",
			icon: "shield",
		},
		{
			id: "pattern",
			title: "Weekly pattern appears",
			description:
				params.state === "stale"
					? "The weekly pattern is live, but the dashboard needs a fresher sync before you treat it as today’s full picture."
					: "The weekly pattern is live and ready to guide how hard to push, how much to recover, and where the pattern is drifting.",
			state: "current",
			icon: "activity",
		},
	];
}

function buildPreviewCards(): InsightCard[] {
	return [
		buildEmptyCard({
			id: "recovery",
			title: "Recovery Capacity",
			icon: "heart",
			mode: "preview",
			statusLabel: "connect to unlock",
			value: "Push or hold?",
			summary:
				"This card becomes your daily push-versus-protect call once one wearable starts sending overnight recovery data.",
			caption: "Daily readiness for the day ahead",
			detailSections: [
				{
					title: "What this answers",
					metrics: [
						{
							label: "Daily question",
							value: "Should today be a push day or a margin day?",
						},
						{
							label: "Human outcome",
							value:
								"A clearer call on training load, work intensity, and recovery bias.",
						},
					],
				},
				{
					title: "Signals used",
					description:
						"The dashboard translates raw biometrics into one usable readiness call.",
					metrics: [
						{
							label: "Oura",
							value:
								"Readiness score, HRV, sleeping heart rate, temperature, sleep contributors",
						},
						{
							label: "WHOOP",
							value:
								"Recovery score, HRV, resting heart rate, oxygen saturation, overnight physiology",
						},
					],
				},
			],
		}),
		buildEmptyCard({
			id: "sleep",
			title: "Sleep Quality",
			icon: "moon",
			mode: "preview",
			statusLabel: "connect to unlock",
			value: "Debt or drift?",
			summary:
				"This card shows whether sleep quantity, timing, or efficiency is quietly eroding tomorrow's performance.",
			caption: "Sleep timing, quality, and debt in plain English",
			detailSections: [
				{
					title: "What this answers",
					metrics: [
						{
							label: "Daily question",
							value:
								"How much is sleep debt or timing drift actually costing you?",
						},
						{
							label: "Human outcome",
							value:
								"A sharper bedtime decision and a better sense of whether recovery starts tonight.",
						},
					],
				},
				{
					title: "Signals used",
					metrics: [
						{
							label: "Oura",
							value:
								"Sleep score, total sleep, efficiency, latency, and bedtime guidance",
						},
						{
							label: "WHOOP",
							value:
								"Sleep performance, efficiency, consistency, sleep need, and stage mix",
						},
					],
				},
			],
		}),
		buildEmptyCard({
			id: "load",
			title: "Load Balance",
			icon: "activity",
			mode: "preview",
			statusLabel: "connect to unlock",
			value: "Load aligned?",
			summary:
				"This card compares today's load against your recent rhythm so you can see whether the day is undercooked, balanced, or overcooked.",
			caption: "Daily load judged against your own baseline",
			detailSections: [
				{
					title: "What this answers",
					metrics: [
						{
							label: "Daily question",
							value: "Is your current training load aligned with recovery?",
						},
						{
							label: "Human outcome",
							value:
								"A more deliberate decision on intensity, volume, or taking the edge off.",
						},
					],
				},
				{
					title: "Signals used",
					metrics: [
						{
							label: "Oura",
							value:
								"Activity score, steps, active calories, and recent workouts",
						},
						{
							label: "WHOOP",
							value:
								"Cycle strain, workout strain, training load, and 7-day median context",
						},
					],
				},
			],
		}),
		buildEmptyCard({
			id: "signal",
			title: "Stress / Cardio Signal",
			icon: "lungs",
			mode: "preview",
			statusLabel: "connect to unlock",
			value: "Signal stable?",
			summary:
				"This card watches the quieter physiological drift that often shows up before the day feels fully off.",
			caption: "Stress and cardio context without raw-data overload",
			detailSections: [
				{
					title: "What this answers",
					metrics: [
						{
							label: "Daily question",
							value: "Are stress and physiology drifting away from baseline?",
						},
						{
							label: "Human outcome",
							value:
								"Earlier detection when the system looks stretched, not just tired.",
						},
					],
				},
				{
					title: "Signals used",
					metrics: [
						{
							label: "Oura",
							value:
								"Stress, resilience, SpO2, VO2 max, cardiovascular age, and Rest Mode",
						},
						{
							label: "WHOOP",
							value:
								"HRV and resting-HR drift, respiratory rate, oxygen saturation, and recovery baseline shifts",
						},
					],
				},
			],
		}),
	];
}

function buildSetupCards(provider: DashboardProvider): InsightCard[] {
	const providerLabel = provider === "oura" ? "Oura" : "WHOOP";
	const setupGuidance =
		provider === "oura"
			? "Wear the ring through your next full sleep and open the Oura app in the morning so readiness and sleep scores can land."
			: "Keep WHOOP on through your next full sleep so recovery, sleep performance, and the first scored cycle can land.";

	return [
		buildEmptyCard({
			id: "recovery",
			title: "Recovery Capacity",
			icon: "heart",
			mode: "setup",
			statusLabel: "building",
			value: "First score pending",
			summary: `${providerLabel} is connected. Recovery capacity appears once the first complete overnight recovery score is available.`,
			caption: setupGuidance,
			detailSections: [
				{
					title: "What is still missing",
					metrics: [
						{
							label: "Next unlock",
							value:
								provider === "oura"
									? "A first readiness score with sleeping HRV and resting heart rate context"
									: "A first recovery score with HRV and resting heart rate context",
						},
						{
							label: "Best next step",
							value: setupGuidance,
						},
					],
				},
			],
		}),
		buildEmptyCard({
			id: "sleep",
			title: "Sleep Quality",
			icon: "moon",
			mode: "setup",
			statusLabel: "building",
			value: "Night one pending",
			summary:
				provider === "oura"
					? "Sleep quality appears after the first complete night with a synced Oura sleep summary."
					: "Sleep quality appears after the first completed WHOOP sleep is scored and synced.",
			caption:
				"The first complete night unlocks timing, duration, and sleep debt context.",
			detailSections: [
				{
					title: "What is still missing",
					metrics: [
						{
							label: "Next unlock",
							value:
								provider === "oura"
									? "Sleep score, duration, efficiency, latency, and bedtime guidance"
									: "Sleep performance, efficiency, consistency, and sleep need",
						},
						{
							label: "Best next step",
							value:
								"Complete one full sleep period and let the companion app sync the next morning.",
						},
					],
				},
			],
		}),
		buildEmptyCard({
			id: "load",
			title: "Load Balance",
			icon: "activity",
			mode: "setup",
			statusLabel: "building",
			value: "Load view pending",
			summary:
				provider === "oura"
					? "Load balance starts once Oura has a complete activity day or a synced workout to compare against."
					: "Load balance starts once WHOOP has enough cycle strain or workout history to compare against your recent rhythm.",
			caption:
				"This is where the app judges whether the current load fits recovery.",
			detailSections: [
				{
					title: "What is still missing",
					metrics: [
						{
							label: "Next unlock",
							value:
								provider === "oura"
									? "Activity score, step progress, active calories, and recent workouts"
									: "Cycle strain, workout strain, and a usable 7-day median load",
						},
						{
							label: "Best next step",
							value:
								"Give the device at least one full day of real wear and movement so the load picture is not empty.",
						},
					],
				},
			],
		}),
		buildEmptyCard({
			id: "signal",
			title: "Stress / Cardio Signal",
			icon: "lungs",
			mode: "setup",
			statusLabel: "building",
			value: "Signal pending",
			summary:
				provider === "oura"
					? "Stress, resilience, and cardio context need a bit more recent Oura history before they become useful."
					: "Cardio and stress drift depend on enough WHOOP recovery history to compare today's numbers against a baseline.",
			caption:
				"The quiet physiology view shows up after the first few stable nights.",
			detailSections: [
				{
					title: "What is still missing",
					metrics: [
						{
							label: "Next unlock",
							value:
								provider === "oura"
									? "Stress balance, resilience, oxygen saturation, and longer-horizon cardio markers"
									: "HRV drift, resting-HR drift, respiratory rate, and baseline comparison",
						},
						{
							label: "Best next step",
							value:
								"Keep wearing the device consistently for the next few days so the baseline becomes believable.",
						},
					],
				},
			],
		}),
	];
}

function buildEmptyCard(params: {
	id: InsightCard["id"];
	title: string;
	icon: InsightCard["icon"];
	summary: string;
	mode?: InsightCard["mode"];
	statusLabel?: string;
	value?: string;
	caption?: string;
	supportingValue?: string;
	detailSections?: InsightCard["detailSections"];
}): InsightCard {
	const mode = params.mode ?? "setup";

	return {
		id: params.id,
		mode,
		title: params.title,
		icon: params.icon,
		tone: "neutral",
		statusLabel:
			params.statusLabel ?? (mode === "preview" ? "preview" : "building"),
		value: params.value ?? (mode === "preview" ? "Unlocks here" : "Setting up"),
		supportingValue: params.supportingValue,
		summary: params.summary,
		caption:
			params.caption ??
			(mode === "preview"
				? "Shown before the first device is connected"
				: "Waiting for enough wearable history"),
		empty: mode !== "live",
		detailTitle: params.title,
		detailSections: params.detailSections ?? [
			{
				title: "What happens next",
				metrics: [
					{
						label: "Status",
						value: params.summary,
					},
				],
			},
		],
	};
}

function buildEmptyTrendSummary(params: {
	provider: string | null;
	message: string;
}): DashboardTrendSummary {
	return {
		title: "7-Day Balance",
		description:
			params.provider !== null
				? `${params.provider} trend guidance is still building.`
				: "This is where the last week of balance guidance will appear.",
		primaryLabel: params.provider === "WHOOP" ? "Recovery" : "Readiness",
		secondaryLabel: params.provider === "WHOOP" ? "Strain" : "Activity",
		points: [],
		primaryAverageLabel: "Awaiting data",
		secondaryAverageLabel: "Awaiting data",
		bestDayLabel: "Not enough data yet",
		streakLabel: "No streak yet",
		emptyMessage: params.message,
	};
}

function buildHeadline(params: {
	state: DashboardState;
	providerLabel: string;
	primaryCard: InsightCard;
}) {
	if (params.state === "syncing") {
		return `${params.providerLabel} is connected`;
	}

	if (params.state === "baseline_forming") {
		return "Your baseline is forming";
	}

	if (params.state === "stale") {
		return "Your guidance needs a fresh sync";
	}

	if (params.primaryCard.tone === "boost") {
		return "You have room to push";
	}

	if (params.primaryCard.tone === "recover") {
		return "The body is asking for margin";
	}

	return "Your day looks steady";
}

function buildHighlight(params: {
	state: DashboardState;
	providerLabel: string;
	activeRestMode: boolean;
	primaryCard: InsightCard;
}) {
	if (params.state === "syncing") {
		return `Waiting on ${params.providerLabel} data`;
	}

	if (params.state === "baseline_forming") {
		return "Baseline in progress";
	}

	if (params.state === "stale") {
		return "Sync to refresh today's view";
	}

	if (params.activeRestMode) {
		return "Recovery-first guidance";
	}

	return params.primaryCard.title;
}

function buildOuraDescription(params: {
	state: DashboardState;
	readiness: OuraReadinessRow | null;
	sleep: OuraSleepRow | null;
	activity: OuraActivityRow | null;
	stress: OuraStressRow | null;
	activeRestMode: boolean;
}) {
	if (params.state === "syncing") {
		return "Once Oura finishes the first full sync, the dashboard will start turning sleep, readiness, stress, and cardio context into daily guidance.";
	}

	if (params.state === "baseline_forming") {
		return "You already have enough data for directional guidance, but another few days will make the comparisons and actions far more stable.";
	}

	if (params.state === "stale") {
		return "The latest Oura data is older than the freshness window, so treat the guidance as yesterday's operating picture until the next sync lands.";
	}

	if (params.activeRestMode) {
		return "Rest Mode is active, so the dashboard is biasing toward recovery despite whatever the wider schedule is asking for.";
	}

	const readiness = params.readiness?.score
		? `${Math.round(params.readiness.score)} readiness`
		: "readiness pending";
	const sleep =
		params.sleep?.total_sleep_duration !== null &&
		params.sleep?.total_sleep_duration !== undefined
			? formatDurationSeconds(params.sleep.total_sleep_duration)
			: "sleep pending";
	const activity =
		params.activity?.score !== null && params.activity?.score !== undefined
			? `${params.activity.score} activity score`
			: "activity pending";
	const stress = params.stress?.day_summary
		? `${params.stress.day_summary} stress balance`
		: "stress still settling";
	return `${readiness}, ${sleep}, ${activity}, and ${stress} are shaping today's operating picture.`;
}

function buildWhoopDescription(params: {
	state: DashboardState;
	recovery: WhoopRecoveryRow | null;
	sleep: WhoopSleepRow | null;
	cycle: WhoopCycleRow | null;
}) {
	if (params.state === "syncing") {
		return "Once WHOOP finishes the first scored sleep and recovery cycle, the dashboard will start turning recovery, sleep, and strain into daily guidance.";
	}

	if (params.state === "baseline_forming") {
		return "WHOOP already has enough history for directional calls, but a few more cycles will make the baseline much cleaner.";
	}

	if (params.state === "stale") {
		return "The latest WHOOP data is older than the freshness window, so use the dashboard as a lagging view until the next sync arrives.";
	}

	const recovery =
		params.recovery?.recovery_score !== null &&
		params.recovery?.recovery_score !== undefined
			? `${Math.round(params.recovery.recovery_score)} recovery`
			: "recovery pending";
	const sleep =
		params.sleep?.sleep_performance_percentage !== null &&
		params.sleep?.sleep_performance_percentage !== undefined
			? `${Math.round(params.sleep.sleep_performance_percentage)}% sleep performance`
			: "sleep pending";
	const strain =
		params.cycle?.strain !== null && params.cycle?.strain !== undefined
			? `${params.cycle.strain.toFixed(1)} strain`
			: "strain pending";
	return `${recovery}, ${sleep}, and ${strain} are driving today's load-versus-recovery call.`;
}

function buildStatusMessage(params: {
	state: DashboardState;
	providerLabel: string;
	lastSyncedLabel: string;
	tone: DashboardTone;
}) {
	switch (params.state) {
		case "syncing":
			return {
				eyebrow: `${params.providerLabel} connected`,
				title: "Waiting for the first full sync",
				description:
					"Keep the device on and open the companion app after the next full sleep so the dashboard can switch from setup to guidance.",
				tone: "steady" as const,
			};
		case "baseline_forming":
			return {
				eyebrow: "Baseline",
				title: "Directional guidance is live",
				description:
					"The dashboard is already useful, but trend comparisons will sharpen after a few more full days of data.",
				tone: "steady" as const,
			};
		case "stale":
			return {
				eyebrow: "Freshness",
				title: "Data is older than the live window",
				description: `${params.lastSyncedLabel}. Sync the wearable again before treating this as today's full picture.`,
				tone: "warning" as const,
			};
		default:
			return {
				eyebrow: "Today",
				title:
					params.tone === "boost"
						? "Recovery is supportive"
						: params.tone === "recover"
							? "Recovery needs protection"
							: "Recovery is steady",
				description: `${params.lastSyncedLabel}. Use the cards below to decide how hard to push, how early to shut down, and where the biggest recovery leak is sitting.`,
				tone: params.tone,
			};
	}
}

function resolveDataState(params: {
	baselineCount: number;
	lastSyncedAt: string | null;
}): DashboardState {
	if (params.baselineCount === 0) {
		return "syncing";
	}

	if (isStale(params.lastSyncedAt)) {
		return "stale";
	}

	if (params.baselineCount < 7) {
		return "baseline_forming";
	}

	return "ready";
}

function workoutsForDay(
	workouts: OuraWorkoutRow[],
	day: string | null
): OuraWorkoutRow[] {
	if (!day) return [];
	return workouts.filter((workout) => workout.day === day);
}

function workoutsWithinCycle(
	workouts: WhoopWorkoutRow[],
	cycle: WhoopCycleRow
): WhoopWorkoutRow[] {
	const cycleStart = toDate(cycle.start_at)?.getTime();
	const cycleEnd = toDate(cycle.end_at ?? cycle.start_at)?.getTime();
	if (
		cycleStart === null ||
		cycleStart === undefined ||
		cycleEnd === null ||
		cycleEnd === undefined
	) {
		return [];
	}

	return workouts.filter((workout) => {
		const workoutStart = toDate(workout.start_at)?.getTime();
		if (workoutStart === null || workoutStart === undefined) return false;
		return workoutStart >= cycleStart && workoutStart <= cycleEnd;
	});
}

function withOuraWorkoutLoad(
	activity: OuraActivityRow | null,
	workouts: OuraWorkoutRow[]
): number | null {
	const activityScore =
		activity?.score !== null && activity?.score !== undefined
			? activity.score
			: null;
	const workoutBonus = workouts.reduce((sum, workout) => {
		const intensityWeight =
			workout.intensity === "hard"
				? 14
				: workout.intensity === "moderate"
					? 8
					: 4;
		return sum + intensityWeight;
	}, 0);

	if (activityScore === null && workouts.length === 0) {
		return null;
	}

	return clamp(Math.round((activityScore ?? 45) + workoutBonus), 0, 100);
}

function getLoadLabel(params: {
	currentLoad: number | null;
	medianLoad: number | null;
	recoveryTone: DashboardTone;
}): "underloaded" | "balanced" | "taxed" {
	if (
		params.currentLoad === null ||
		params.medianLoad === null ||
		params.medianLoad === 0
	) {
		return params.recoveryTone === "recover" ? "balanced" : "underloaded";
	}

	const ratio = params.currentLoad / params.medianLoad;
	if (ratio < 0.85 && params.recoveryTone === "boost") {
		return "underloaded";
	}

	if (ratio > 1.15 && params.recoveryTone === "recover") {
		return "taxed";
	}

	return "balanced";
}

function getOuraReadinessTone(score: number): DashboardTone {
	if (score >= 85) return "boost";
	if (score >= 70) return "steady";
	return "recover";
}

function getWhoopRecoveryTone(score: number): DashboardTone {
	if (score >= 67) return "boost";
	if (score >= 34) return "steady";
	return "recover";
}

function getSleepTone(score: number | null): DashboardTone {
	if (score === null || score === undefined) return "steady";
	if (score >= 85) return "boost";
	if (score >= 70) return "steady";
	return "recover";
}

function getResilienceTone(
	level: string | null,
	daySummary: string | null
): DashboardTone {
	if (level === "exceptional" || level === "strong") return "boost";
	if (level === "limited" || daySummary === "stressful") return "recover";
	return "steady";
}

function getPeakWhoopZone(workout: WhoopWorkoutRow): number | null {
	const zones = [
		workout.zone_zero_milli,
		workout.zone_one_milli,
		workout.zone_two_milli,
		workout.zone_three_milli,
		workout.zone_four_milli,
		workout.zone_five_milli,
	].filter((value): value is number => value !== null && value !== undefined);

	if (zones.length === 0) return null;
	return Math.max(...zones);
}

function getLowestContributors(
	record: JsonObject | null,
	limit: number
): Array<{ label: string; value: number }> {
	if (!record) return [];

	return Object.entries(record)
		.map(([key, value]) => ({
			label: humanizeContributor(key),
			value: toNumber(value),
		}))
		.filter(
			(entry): entry is { label: string; value: number } => entry.value !== null
		)
		.sort((left, right) => left.value - right.value)
		.slice(0, limit);
}

function getNestedAverage(record: JsonObject | null): number | null {
	if (!record) return null;
	const average = toNumber(record.average);
	return average;
}

function selectPrimaryOuraSleeps(rows: OuraSleepRow[]): OuraSleepRow[] {
	const byDay = new Map<string, OuraSleepRow>();

	for (const row of rows) {
		const current = byDay.get(row.day);
		if (!current) {
			byDay.set(row.day, row);
			continue;
		}

		const currentDuration = current.total_sleep_duration ?? 0;
		const nextDuration = row.total_sleep_duration ?? 0;
		if (nextDuration > currentDuration) {
			byDay.set(row.day, row);
		}
	}

	return Array.from(byDay.values()).sort((left, right) =>
		right.day.localeCompare(left.day)
	);
}

function selectBestPoint(points: TrendPoint[]): TrendPoint | null {
	return (
		[...points]
			.filter((point) => point.primary !== null)
			.sort((left, right) => (right.primary ?? 0) - (left.primary ?? 0))[0] ??
		null
	);
}

function describeStreak(
	points: TrendPoint[],
	threshold: number,
	label: string
): string {
	let streak = 0;
	for (let index = points.length - 1; index >= 0; index -= 1) {
		const point = points[index];
		if ((point.primary ?? 0) >= threshold) {
			streak += 1;
			continue;
		}
		break;
	}

	if (streak <= 0) {
		return `No active ${label} streak`;
	}

	return `${streak}-day ${label} streak`;
}

function toneToMetricTone(tone: DashboardTone) {
	if (tone === "boost") return "good" as const;
	if (tone === "recover" || tone === "warning") return "caution" as const;
	return "neutral" as const;
}

function dedupeActions(actions: ActionItem[]) {
	const seen = new Set<string>();
	return actions.filter((action) => {
		if (seen.has(action.id)) return false;
		seen.add(action.id);
		return true;
	});
}

function humanizeContributor(key: string) {
	const labels: Record<string, string> = {
		activity_balance: "Activity balance",
		body_temperature: "Body temperature",
		hrv_balance: "HRV balance",
		previous_day_activity: "Previous day activity",
		previous_night: "Previous night",
		recovery_index: "Recovery index",
		resting_heart_rate: "Resting heart rate",
		sleep_balance: "Sleep balance",
		sleep_regularity: "Sleep regularity",
		deep_sleep: "Deep sleep",
		efficiency: "Efficiency",
		latency: "Latency",
		rem_sleep: "REM sleep",
		restfulness: "Restfulness",
		timing: "Timing",
		total_sleep: "Total sleep",
		sleep_recovery: "Sleep recovery",
		daytime_recovery: "Daytime recovery",
		stress: "Stress",
		meet_daily_targets: "Daily targets",
		move_every_hour: "Move every hour",
		recovery_time: "Recovery time",
		stay_active: "Stay active",
		training_frequency: "Training frequency",
		training_volume: "Training volume",
	};

	return labels[key] ?? titleCase(key.replaceAll("_", " "));
}

function humanizeSleepRecommendation(recommendation: string) {
	const labels: Record<string, string> = {
		improve_efficiency: "improving sleep efficiency",
		earlier_bedtime: "moving bedtime earlier",
		later_bedtime: "moving bedtime later",
		earlier_wake_up_time: "waking up earlier",
		later_wake_up_time: "waking up later",
		follow_optimal_bedtime: "following the current bedtime window",
	};
	return labels[recommendation] ?? recommendation.replaceAll("_", " ");
}

function formatSleepTimeWindow(window: JsonObject | null) {
	if (!window) return null;
	const startOffset = toNumber(window.start_offset);
	const endOffset = toNumber(window.end_offset);
	if (startOffset === null || endOffset === null) {
		return null;
	}

	return `${formatOffsetTime(startOffset)}-${formatOffsetTime(endOffset)}`;
}

function formatOffsetTime(offsetSeconds: number) {
	const totalMinutes = Math.floor(offsetSeconds / 60);
	const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
	const hours = Math.floor(normalized / 60);
	const minutes = normalized % 60;
	const period = hours >= 12 ? "PM" : "AM";
	const displayHour = hours % 12 === 0 ? 12 : hours % 12;
	return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

function formatTemperatureDelta(value: number | null) {
	if (value === null || value === undefined) return "—";
	return `${value > 0 ? "+" : ""}${value.toFixed(1)}°`;
}

function findRestorativeSession(
	sessions: OuraSessionRow[]
): OuraSessionRow | null {
	const restorativeKeywords = [
		"meditation",
		"breathing",
		"rest",
		"relax",
		"nap",
	];
	return (
		sessions.find((session) =>
			restorativeKeywords.some((keyword) =>
				session.type.toLowerCase().includes(keyword)
			)
		) ?? null
	);
}

function isRestModeActive(rows: OuraRestModeRow[], today: Date) {
	const todayDate = toDateOnly(today);
	return rows.some((row) => {
		const starts = row.start_day <= todayDate;
		const ends = row.end_day === null || row.end_day >= todayDate;
		return starts && ends;
	});
}

function mergeRecentDays(days: string[]) {
	return Array.from(new Set(days.filter(Boolean))).sort((left, right) =>
		right.localeCompare(left)
	);
}

function formatAverageLabel(
	label: string,
	points: TrendPoint[],
	key: "primary" | "secondary"
) {
	const values = points
		.map((point) => point[key])
		.filter((value): value is number => value !== null);
	const avg = average(values);
	return avg === null ? `${label}: —` : `${label}: ${Math.round(avg)}`;
}

function average(values: number[]) {
	if (values.length === 0) return null;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]) {
	if (values.length === 0) return null;
	const sorted = [...values].sort((left, right) => left - right);
	const middle = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 0) {
		return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
	}
	return Math.round(sorted[middle]);
}

function normalizeWhoopStrain(strain: number) {
	return clamp(Math.round((strain / 21) * 100), 0, 100);
}

function maxTimestamp(...groups: Array<Array<{ updated_at?: string | null }>>) {
	const values = groups
		.flat()
		.map((row) => row.updated_at ?? null)
		.filter((value): value is string => Boolean(value))
		.map((value) => toDate(value)?.getTime() ?? 0)
		.filter((value) => value > 0);

	if (values.length === 0) return null;
	return new Date(Math.max(...values)).toISOString();
}

function formatRelativeTime(value: string) {
	const timestamp = toDate(value)?.getTime();
	if (!timestamp) return "recently";
	const diffMs = Date.now() - timestamp;
	const diffMinutes = Math.floor(diffMs / (60 * 1000));
	if (diffMinutes < 60) return `${Math.max(diffMinutes, 1)}m ago`;
	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) return `${diffHours}h ago`;
	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 7) return `${diffDays}d ago`;
	return formatDateLabel(value);
}

function isStale(value: string | null) {
	if (!value) return false;
	const timestamp = toDate(value)?.getTime();
	if (!timestamp) return false;
	return Date.now() - timestamp > STALE_WINDOW_HOURS * 60 * 60 * 1000;
}

function formatDurationSeconds(value: number | null | undefined) {
	if (value === null || value === undefined || value <= 0) return "—";
	const totalMinutes = Math.round(value / 60);
	return formatDurationMinutes(totalMinutes);
}

function formatDurationMillis(value: number | null | undefined) {
	if (value === null || value === undefined || value <= 0) return "—";
	const totalMinutes = Math.round(value / (60 * 1000));
	return formatDurationMinutes(totalMinutes);
}

function formatDurationMinutes(totalMinutes: number) {
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	if (hours <= 0) return `${minutes}m`;
	if (minutes === 0) return `${hours}h`;
	return `${hours}h ${minutes}m`;
}

function formatDateTimeDuration(startAt: string, endAt: string) {
	const start = toDate(startAt)?.getTime();
	const end = toDate(endAt)?.getTime();
	if (!start || !end || end <= start) return "—";
	return formatDurationMinutes(Math.round((end - start) / (60 * 1000)));
}

function formatPercent(value: number) {
	return `${value}%`;
}

function formatSignedNumber(value: number) {
	const rounded = Math.round(value * 10) / 10;
	return `${rounded >= 0 ? "+" : ""}${rounded}`;
}

function weekdayLetter(value: string) {
	return new Intl.DateTimeFormat(undefined, { weekday: "narrow" }).format(
		new Date(value)
	);
}

function formatWeekday(value: string) {
	return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
		new Date(value)
	);
}

function formatDateLabel(value: string) {
	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
	}).format(new Date(value));
}

function toDateOnly(value: Date | string) {
	const date = typeof value === "string" ? new Date(value) : value;
	return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
	return new Date(date.getTime() + days * DAY_MS);
}

function toDate(value: string | null | undefined) {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

function toNumber(value: unknown) {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function coerceRows<T>(rows: unknown): T[] {
	return Array.isArray(rows) ? (rows as T[]) : [];
}

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

function titleCase(value: string) {
	return value
		.split(" ")
		.filter(Boolean)
		.map((part) => capitalize(part))
		.join(" ");
}

function capitalize(value: string) {
	if (!value) return value;
	return value.charAt(0).toUpperCase() + value.slice(1);
}

function assertNoError(error: { message?: string } | null) {
	if (error) {
		throw new Error(error.message ?? "Supabase query failed.");
	}
}
