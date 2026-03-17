import "server-only";

import { isOuraConfigured } from "@/lib/integrations/oura.server";
import { isWhoopConfigured } from "@/lib/integrations/whoop.server";
import { ensureUserNotification } from "@/lib/notifications.server";
import { getGoalStatus } from "@/lib/nutrition/utils";
import { createAdminClient } from "@/lib/supabase";
import { getUserSupabaseClient } from "@/lib/supabase-user.server";
import type { WeeklySummaryDay } from "@/lib/user-settings.server";
import {
	DEFAULT_USER_SETTINGS,
	getUserSettingsByUserId,
	type UserSettings,
} from "@/lib/user-settings.server";
import type { Tables } from "@/types/database";
import type {
	ActiveWearableProvider,
	NextBestAction,
	ProgressChart,
	ProgressRange,
	ProgressSnapshot,
	ProgressSummaryCard,
	ProgressTone,
	SetupChecklistItem,
	SyncFreshness,
	TodayAtAGlance,
	TodayAtAGlanceItem,
} from "./progress.types";

type DailyMetricRow = Tables<"daily_user_metrics">;
type MealRow = Tables<"meals">;
type WorkoutRow = Tables<"workouts">;
type ChallengeRow = Tables<"challenges">;
type ChallengeTaskRow = Tables<"challenge_tasks">;
type DailyCompletionRow = Tables<"daily_completions">;
type NutritionGoalRow = Tables<"nutrition_goals">;

type OuraReadinessRow = {
	day: string;
	score: number | null;
	updated_at: string | null;
};

type OuraDailySleepRow = {
	day: string;
	score: number | null;
	updated_at: string | null;
};

type OuraSleepRow = {
	day: string;
	total_sleep_duration: number | null;
	updated_at: string | null;
};

type OuraDailyActivityRow = {
	day: string;
	steps: number | null;
	active_calories: number | null;
	updated_at: string | null;
};

type WhoopSleepRow = {
	whoop_sleep_id: string;
	whoop_cycle_id: string;
	start_at: string;
	end_at: string;
	is_nap: boolean | null;
	sleep_performance_percentage: number | null;
	total_in_bed_time_milli: number | null;
	total_awake_time_milli: number | null;
	whoop_updated_at: string;
};

type WhoopRecoveryRow = {
	whoop_sleep_id: string | null;
	whoop_cycle_id: string;
	recovery_score: number | null;
	whoop_updated_at: string;
};

type WhoopCycleRow = {
	whoop_cycle_id: string;
	start_at: string;
	end_at: string | null;
	kilojoule: number | null;
	whoop_updated_at: string;
};

type LifecycleCounts = {
	totalMeals: number;
	totalWorkouts: number;
	totalChallenges: number;
	hasNutritionGoalConfig: boolean;
};

type DailyAccumulator = {
	metricDate: string;
	timezone: string;
	activeWearableProvider: ActiveWearableProvider;
	syncFreshness: SyncFreshness;
	sleepHours: number | null;
	sleepScore: number | null;
	readinessScore: number | null;
	steps: number | null;
	activeCalories: number | null;
	workoutCount: number;
	workoutDurationMinutes: number;
	caloriesLogged: number;
	proteinLogged: number;
	calorieGoalMet: boolean;
	proteinGoalMet: boolean;
	challengeTasksCompleted: number;
	challengeTasksTarget: number;
	challengeGoalMet: boolean;
};

type ConnectionSummary = {
	activeProvider: ActiveWearableProvider;
	syncFreshness: SyncFreshness;
	latestSyncAt: string | null;
	baselineCount: number;
	metricsByDate: Map<string, Partial<DailyAccumulator>>;
};

type DailyGoalContext = {
	dailyCalories: number;
	dailyProtein: number;
};

type SnapshotContext = {
	settings: UserSettings;
	currentState: ConnectionSummary;
	goals: DailyGoalContext;
	lifecycleCounts: LifecycleCounts;
	rows: DailyMetricRow[];
	previousRows: DailyMetricRow[];
	rangeDays: ProgressRange;
	stepGoal: number;
};

const DEFAULT_CALORIES_GOAL = 2000;
const DEFAULT_PROTEIN_GOAL = 150;
const STALE_WINDOW_HOURS = 36;
const HOURS_TO_MS = 60 * 60 * 1000;
const KCAL_PER_KILOJOULE = 0.239006;

function formatDateOnly(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function parseDateOnly(value: string): Date {
	return new Date(`${value}T12:00:00.000Z`);
}

function addDaysToDateString(value: string, days: number): string {
	const next = parseDateOnly(value);
	next.setUTCDate(next.getUTCDate() + days);
	return formatDateOnly(next);
}

function buildDateRange(endDate: string, days: number): string[] {
	return Array.from({ length: days }, (_, index) =>
		addDaysToDateString(endDate, -(days - index - 1))
	);
}

function getDateInTimezone(date: Date, timezone: string): string {
	try {
		const formatter = new Intl.DateTimeFormat("en-CA", {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
		return formatter.format(date);
	} catch {
		return date.toISOString().slice(0, 10);
	}
}

function formatDayLabel(value: string): string {
	return new Intl.DateTimeFormat("en-US", {
		weekday: "short",
	}).format(parseDateOnly(value));
}

function formatHours(value: number | null | undefined): string {
	if (value === null || value === undefined || Number.isNaN(value)) {
		return "No data";
	}

	return `${value.toFixed(1)}h`;
}

function formatCompactPercent(value: number | null | undefined): string {
	if (value === null || value === undefined || Number.isNaN(value)) {
		return "No data";
	}

	return `${Math.round(value)}%`;
}

function formatCompactNumber(value: number | null | undefined): string {
	if (value === null || value === undefined || Number.isNaN(value)) {
		return "No data";
	}

	return Math.round(value).toLocaleString();
}

function average(values: Array<number | null | undefined>): number | null {
	const valid = values.filter(
		(value): value is number =>
			typeof value === "number" && Number.isFinite(value)
	);
	if (valid.length === 0) {
		return null;
	}

	return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function sum(values: Array<number | null | undefined>): number {
	return values.reduce<number>(
		(total, value) =>
			total + (typeof value === "number" && Number.isFinite(value) ? value : 0),
		0
	);
}

function calculateHitRate(params: {
	rows: DailyMetricRow[];
	isAvailable: (row: DailyMetricRow) => boolean;
	isMet: (row: DailyMetricRow) => boolean;
}): { rate: number | null; metCount: number; availableCount: number } {
	const availableRows = params.rows.filter(params.isAvailable);
	if (availableRows.length === 0) {
		return { rate: null, metCount: 0, availableCount: 0 };
	}

	const metCount = availableRows.filter(params.isMet).length;
	return {
		rate: (metCount / availableRows.length) * 100,
		metCount,
		availableCount: availableRows.length,
	};
}

function toTone(delta: number | null, higherIsBetter = true): ProgressTone {
	if (delta === null || Math.abs(delta) < 0.01) {
		return "neutral";
	}

	if (higherIsBetter) {
		return delta > 0 ? "positive" : "caution";
	}

	return delta < 0 ? "positive" : "caution";
}

function buildDeltaLabel(params: {
	current: number | null;
	previous: number | null;
	suffix?: string;
}) {
	if (params.current === null || params.previous === null) {
		return "No prior comparison yet";
	}

	const delta = params.current - params.previous;
	if (Math.abs(delta) < 0.01) {
		return "Flat versus the previous period";
	}

	const direction = delta > 0 ? "up" : "down";
	const absoluteDelta = Math.abs(delta);
	const rounded =
		absoluteDelta >= 10 ? Math.round(absoluteDelta) : absoluteDelta.toFixed(1);

	return `${direction} ${rounded}${params.suffix ?? ""} vs previous period`;
}

function isWithinReminderWindow(
	reminderTime: string,
	timezone: string
): boolean {
	try {
		const parts = reminderTime.split(":").map(Number);
		if (parts.length < 2) {
			return false;
		}

		const now = new Date();
		const formatter = new Intl.DateTimeFormat("en-US", {
			timeZone: timezone,
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
		const formatted = formatter.format(now);
		const [hour, minute] = formatted.split(":").map(Number);
		return hour > parts[0] || (hour === parts[0] && minute >= parts[1]);
	} catch {
		return false;
	}
}

function isWeeklySummaryDay(
	date: string,
	timezone: string,
	day: WeeklySummaryDay
) {
	try {
		const weekday = new Intl.DateTimeFormat("en-US", {
			timeZone: timezone,
			weekday: "long",
		})
			.format(parseDateOnly(date))
			.toLowerCase();
		return weekday === day;
	} catch {
		return false;
	}
}

function resolveSyncFreshness(params: {
	activeProvider: ActiveWearableProvider;
	hasAnyData: boolean;
	baselineCount: number;
	latestSyncAt: string | null;
	hasConflict: boolean;
}): SyncFreshness {
	if (params.hasConflict) {
		return "blocked";
	}

	if (!params.activeProvider) {
		return "not_connected";
	}

	if (!params.hasAnyData || params.baselineCount === 0) {
		return "syncing";
	}

	if (params.baselineCount < 3) {
		return "baseline_forming";
	}

	if (
		params.latestSyncAt &&
		Date.now() - Date.parse(params.latestSyncAt) >
			STALE_WINDOW_HOURS * HOURS_TO_MS
	) {
		return "stale";
	}

	return "ready";
}

function initializeAccumulatorMap(
	dateRange: string[],
	timezone: string,
	activeProvider: ActiveWearableProvider,
	syncFreshness: SyncFreshness
) {
	const map = new Map<string, DailyAccumulator>();
	for (const metricDate of dateRange) {
		map.set(metricDate, {
			metricDate,
			timezone,
			activeWearableProvider: activeProvider,
			syncFreshness,
			sleepHours: null,
			sleepScore: null,
			readinessScore: null,
			steps: null,
			activeCalories: null,
			workoutCount: 0,
			workoutDurationMinutes: 0,
			caloriesLogged: 0,
			proteinLogged: 0,
			calorieGoalMet: false,
			proteinGoalMet: false,
			challengeTasksCompleted: 0,
			challengeTasksTarget: 0,
			challengeGoalMet: false,
		});
	}
	return map;
}

function toDailyMetricUpsert(row: DailyAccumulator) {
	return {
		metric_date: row.metricDate,
		timezone: row.timezone,
		active_wearable_provider: row.activeWearableProvider,
		sync_freshness: row.syncFreshness,
		sleep_hours: row.sleepHours,
		sleep_score:
			row.sleepScore !== null ? Math.round(row.sleepScore) : row.sleepScore,
		readiness_score:
			row.readinessScore !== null
				? Math.round(row.readinessScore)
				: row.readinessScore,
		steps: row.steps !== null ? Math.round(row.steps) : null,
		active_calories:
			row.activeCalories !== null ? Math.round(row.activeCalories) : null,
		workout_count: row.workoutCount,
		workout_duration_minutes: row.workoutDurationMinutes,
		calories_logged: row.caloriesLogged,
		protein_logged: row.proteinLogged,
		calorie_goal_met: row.calorieGoalMet,
		protein_goal_met: row.proteinGoalMet,
		challenge_tasks_completed: row.challengeTasksCompleted,
		challenge_tasks_target: row.challengeTasksTarget,
		challenge_goal_met: row.challengeGoalMet,
	};
}

function createVirtualDailyMetricRow(params: {
	supabaseUserId: string;
	metricDate: string;
	timezone: string;
}): DailyMetricRow {
	return {
		id: `virtual-${params.metricDate}`,
		user_id: params.supabaseUserId,
		metric_date: params.metricDate,
		timezone: params.timezone,
		active_wearable_provider: null,
		sync_freshness: "not_connected",
		sleep_hours: null,
		sleep_score: null,
		readiness_score: null,
		steps: null,
		active_calories: null,
		workout_count: 0,
		workout_duration_minutes: 0,
		calories_logged: 0,
		protein_logged: 0,
		calorie_goal_met: false,
		protein_goal_met: false,
		challenge_tasks_completed: 0,
		challenge_tasks_target: 0,
		challenge_goal_met: false,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	};
}

function buildRowsForRange(params: {
	range: string[];
	rowByDate: Map<string, DailyMetricRow>;
	supabaseUserId: string;
	timezone: string;
}) {
	return params.range.map(
		(metricDate) =>
			params.rowByDate.get(metricDate) ??
			createVirtualDailyMetricRow({
				supabaseUserId: params.supabaseUserId,
				metricDate,
				timezone: params.timezone,
			})
	);
}

async function buildConnectionSummary(params: {
	supabaseUserId: string;
	startDate: string;
	timezone: string;
}): Promise<ConnectionSummary> {
	const supabase = createAdminClient();
	const { data: connectionRows, error: connectionError } = await supabase
		.from("oauth_connections")
		.select("provider")
		.eq("user_id", params.supabaseUserId);

	if (connectionError) {
		throw connectionError;
	}

	const providers = new Set(
		((connectionRows ?? []) as Array<{ provider: string }>).map(
			(row) => row.provider
		)
	);
	const hasConflict = providers.has("oura") && providers.has("whoop");
	if (hasConflict) {
		return {
			activeProvider: null,
			syncFreshness: "blocked",
			latestSyncAt: null,
			baselineCount: 0,
			metricsByDate: new Map(),
		};
	}

	const activeProvider = providers.has("oura")
		? "oura"
		: providers.has("whoop")
			? "whoop"
			: null;

	if (!activeProvider) {
		return {
			activeProvider: null,
			syncFreshness: "not_connected",
			latestSyncAt: null,
			baselineCount: 0,
			metricsByDate: new Map(),
		};
	}

	if (activeProvider === "oura") {
		const [readinessResult, dailySleepResult, sleepResult, activityResult] =
			await Promise.all([
				supabase
					.from("oura_daily_readiness")
					.select("day, score, updated_at")
					.eq("user_id", params.supabaseUserId)
					.gte("day", params.startDate)
					.order("day", { ascending: false }),
				supabase
					.from("oura_daily_sleep")
					.select("day, score, updated_at")
					.eq("user_id", params.supabaseUserId)
					.gte("day", params.startDate)
					.order("day", { ascending: false }),
				supabase
					.from("oura_sleep")
					.select("day, total_sleep_duration, updated_at")
					.eq("user_id", params.supabaseUserId)
					.gte("day", params.startDate)
					.order("day", { ascending: false }),
				supabase
					.from("oura_daily_activity")
					.select("day, steps, active_calories, updated_at")
					.eq("user_id", params.supabaseUserId)
					.gte("day", params.startDate)
					.order("day", { ascending: false }),
			]);

		if (readinessResult.error) throw readinessResult.error;
		if (dailySleepResult.error) throw dailySleepResult.error;
		if (sleepResult.error) throw sleepResult.error;
		if (activityResult.error) throw activityResult.error;

		const readinessRows = (readinessResult.data ?? []) as OuraReadinessRow[];
		const dailySleepRows = (dailySleepResult.data ?? []) as OuraDailySleepRow[];
		const sleepRows = (sleepResult.data ?? []) as OuraSleepRow[];
		const activityRows = (activityResult.data ?? []) as OuraDailyActivityRow[];
		const metricsByDate = new Map<string, Partial<DailyAccumulator>>();
		let latestSyncAt: string | null = null;

		const updateLatest = (value: string | null | undefined) => {
			if (!value) return;
			if (!latestSyncAt || value > latestSyncAt) {
				latestSyncAt = value;
			}
		};

		for (const row of readinessRows) {
			const existing = metricsByDate.get(row.day) ?? {};
			existing.readinessScore = row.score;
			metricsByDate.set(row.day, existing);
			updateLatest(row.updated_at);
		}

		for (const row of dailySleepRows) {
			const existing = metricsByDate.get(row.day) ?? {};
			existing.sleepScore = row.score;
			metricsByDate.set(row.day, existing);
			updateLatest(row.updated_at);
		}

		for (const row of sleepRows) {
			const existing = metricsByDate.get(row.day) ?? {};
			const nextHours =
				typeof row.total_sleep_duration === "number"
					? row.total_sleep_duration / 3600
					: null;
			if (
				nextHours !== null &&
				(existing.sleepHours === undefined ||
					existing.sleepHours === null ||
					nextHours > existing.sleepHours)
			) {
				existing.sleepHours = nextHours;
			}
			metricsByDate.set(row.day, existing);
			updateLatest(row.updated_at);
		}

		for (const row of activityRows) {
			const existing = metricsByDate.get(row.day) ?? {};
			existing.steps = row.steps ?? null;
			existing.activeCalories = row.active_calories ?? null;
			metricsByDate.set(row.day, existing);
			updateLatest(row.updated_at);
		}

		const baselineCount = readinessRows.filter(
			(row) => row.score !== null
		).length;
		return {
			activeProvider,
			syncFreshness: resolveSyncFreshness({
				activeProvider,
				hasAnyData: metricsByDate.size > 0,
				baselineCount,
				latestSyncAt,
				hasConflict: false,
			}),
			latestSyncAt,
			baselineCount,
			metricsByDate,
		};
	}

	const sleepStart = `${params.startDate}T00:00:00.000Z`;
	const supabaseWhoop = createAdminClient();
	const [sleepResult, cycleResult] = await Promise.all([
		supabaseWhoop
			.from("whoop_sleeps")
			.select(
				"whoop_sleep_id, whoop_cycle_id, start_at, end_at, is_nap, sleep_performance_percentage, total_in_bed_time_milli, total_awake_time_milli, whoop_updated_at"
			)
			.eq("user_id", params.supabaseUserId)
			.gte("start_at", sleepStart)
			.order("start_at", { ascending: false }),
		supabaseWhoop
			.from("whoop_cycles")
			.select("whoop_cycle_id, start_at, end_at, kilojoule, whoop_updated_at")
			.eq("user_id", params.supabaseUserId)
			.gte("start_at", sleepStart)
			.order("start_at", { ascending: false }),
	]);

	if (sleepResult.error) throw sleepResult.error;
	if (cycleResult.error) throw cycleResult.error;

	const sleepRows = ((sleepResult.data ?? []) as WhoopSleepRow[]).filter(
		(row) => row.is_nap !== true
	);
	const cycleRows = (cycleResult.data ?? []) as WhoopCycleRow[];
	const cycleIds = cycleRows.map((row) => row.whoop_cycle_id);
	let recoveryRows: WhoopRecoveryRow[] = [];

	if (cycleIds.length > 0) {
		const { data, error } = await supabaseWhoop
			.from("whoop_recoveries")
			.select(
				"whoop_sleep_id, whoop_cycle_id, recovery_score, whoop_updated_at"
			)
			.eq("user_id", params.supabaseUserId)
			.in("whoop_cycle_id", cycleIds);

		if (error) throw error;
		recoveryRows = (data ?? []) as WhoopRecoveryRow[];
	}

	const metricsByDate = new Map<string, Partial<DailyAccumulator>>();
	let latestSyncAt: string | null = null;

	const updateLatest = (value: string | null | undefined) => {
		if (!value) return;
		if (!latestSyncAt || value > latestSyncAt) {
			latestSyncAt = value;
		}
	};

	const dateByCycleId = new Map<string, string>();
	for (const row of cycleRows) {
		const cycleDate = getDateInTimezone(
			new Date(row.end_at ?? row.start_at),
			params.timezone
		);
		dateByCycleId.set(row.whoop_cycle_id, cycleDate);
		const existing = metricsByDate.get(cycleDate) ?? {};
		existing.activeCalories =
			typeof row.kilojoule === "number"
				? row.kilojoule * KCAL_PER_KILOJOULE
				: (existing.activeCalories ?? null);
		metricsByDate.set(cycleDate, existing);
		updateLatest(row.whoop_updated_at);
	}

	for (const row of sleepRows) {
		const sleepDate = getDateInTimezone(new Date(row.end_at), params.timezone);
		const existing = metricsByDate.get(sleepDate) ?? {};
		const totalSleepMillis =
			typeof row.total_in_bed_time_milli === "number"
				? Math.max(
						0,
						row.total_in_bed_time_milli - (row.total_awake_time_milli ?? 0)
					)
				: null;
		existing.sleepHours =
			typeof totalSleepMillis === "number"
				? totalSleepMillis / 3_600_000
				: null;
		existing.sleepScore = row.sleep_performance_percentage ?? null;
		metricsByDate.set(sleepDate, existing);
		dateByCycleId.set(row.whoop_cycle_id, sleepDate);
		updateLatest(row.whoop_updated_at);
	}

	for (const row of recoveryRows) {
		const metricDate =
			(row.whoop_sleep_id
				? sleepRows.find((sleep) => sleep.whoop_sleep_id === row.whoop_sleep_id)
				: null
			)?.end_at ?? dateByCycleId.get(row.whoop_cycle_id);
		const resolvedDate =
			typeof metricDate === "string" && metricDate.includes("T")
				? getDateInTimezone(new Date(metricDate), params.timezone)
				: typeof metricDate === "string"
					? metricDate
					: dateByCycleId.get(row.whoop_cycle_id);
		if (!resolvedDate) continue;

		const existing = metricsByDate.get(resolvedDate) ?? {};
		existing.readinessScore = row.recovery_score ?? null;
		metricsByDate.set(resolvedDate, existing);
		updateLatest(row.whoop_updated_at);
	}

	const baselineCount = recoveryRows.filter(
		(row) => row.recovery_score !== null
	).length;

	return {
		activeProvider,
		syncFreshness: resolveSyncFreshness({
			activeProvider,
			hasAnyData: metricsByDate.size > 0,
			baselineCount,
			latestSyncAt,
			hasConflict: false,
		}),
		latestSyncAt,
		baselineCount,
		metricsByDate,
	};
}

async function getLifecycleCounts(
	supabaseUserId: string
): Promise<LifecycleCounts> {
	const supabase = await getUserSupabaseClient();
	if (!supabase) {
		throw new Error("Supabase user client unavailable.");
	}

	const [mealsResult, workoutsResult, challengesResult, nutritionGoalsResult] =
		await Promise.all([
			supabase
				.from("meals")
				.select("id", { count: "exact", head: true })
				.eq("user_id", supabaseUserId),
			supabase
				.from("workouts")
				.select("id", { count: "exact", head: true })
				.eq("user_id", supabaseUserId)
				.neq("status", "skipped"),
			supabase
				.from("challenges")
				.select("id", { count: "exact", head: true })
				.eq("user_id", supabaseUserId)
				.neq("status", "abandoned"),
			supabase
				.from("nutrition_goals")
				.select("id", { count: "exact", head: true })
				.eq("user_id", supabaseUserId),
		]);

	if (mealsResult.error) throw mealsResult.error;
	if (workoutsResult.error) throw workoutsResult.error;
	if (challengesResult.error) throw challengesResult.error;
	if (nutritionGoalsResult.error) throw nutritionGoalsResult.error;

	return {
		totalMeals: mealsResult.count ?? 0,
		totalWorkouts: workoutsResult.count ?? 0,
		totalChallenges: challengesResult.count ?? 0,
		hasNutritionGoalConfig: (nutritionGoalsResult.count ?? 0) > 0,
	};
}

async function generateNotifications(params: {
	supabaseUserId: string;
	settings: UserSettings;
	dateRange: string[];
	metricsMap: Map<string, DailyAccumulator>;
	connectionSummary: ConnectionSummary;
	lifecycleCounts: LifecycleCounts;
	dailyGoals: DailyGoalContext;
}) {
	const today = params.dateRange[params.dateRange.length - 1];
	const todayRow = params.metricsMap.get(today);
	if (!todayRow) {
		return;
	}

	if (
		params.settings.notifications.devices &&
		params.connectionSummary.activeProvider &&
		params.connectionSummary.syncFreshness === "stale"
	) {
		await ensureUserNotification({
			userId: params.supabaseUserId,
			type: "sync_stale",
			title: "Wearable sync needs attention",
			body: "Your wearable data looks stale. Open Devices to reconnect or check the latest sync status.",
			ctaLabel: "Open Devices",
			ctaHref: "/dashboard/devices",
			dedupeKey: `sync_stale:${params.connectionSummary.activeProvider}:${today}`,
			expiresAt: `${addDaysToDateString(today, 1)}T12:00:00.000Z`,
		});
	}

	if (
		params.settings.notifications.devices &&
		params.connectionSummary.activeProvider &&
		params.connectionSummary.syncFreshness === "ready"
	) {
		await ensureUserNotification({
			userId: params.supabaseUserId,
			type: "sync_complete",
			title: `${params.connectionSummary.activeProvider === "oura" ? "Oura" : "WHOOP"} sync landed`,
			body: "Fresh wearable data is available for today. Review the dashboard for the latest recovery and activity picture.",
			ctaLabel: "View Dashboard",
			ctaHref: "/dashboard",
			dedupeKey: `sync_complete:${params.connectionSummary.activeProvider}:${today}`,
			expiresAt: `${addDaysToDateString(today, 1)}T12:00:00.000Z`,
		});
		await ensureUserNotification({
			userId: params.supabaseUserId,
			type: "baseline_ready",
			title: "Your wearable baseline is usable",
			body: "You now have enough scored wearable data for the app to shift from setup into daily guidance.",
			ctaLabel: "View Progress",
			ctaHref: "/dashboard/progress",
			dedupeKey: `baseline_ready:${params.connectionSummary.activeProvider}`,
		});
	}

	if (
		params.settings.notifications.recovery &&
		typeof todayRow.readinessScore === "number" &&
		todayRow.readinessScore < 70
	) {
		await ensureUserNotification({
			userId: params.supabaseUserId,
			type: "recovery_low",
			title: "Recovery looks low today",
			body: "Keep training lighter today and protect tonight's sleep to recover faster.",
			ctaLabel: "Review Today",
			ctaHref: "/dashboard",
			dedupeKey: `recovery_low:${today}`,
			expiresAt: `${addDaysToDateString(today, 1)}T12:00:00.000Z`,
		});
	}

	if (
		params.settings.notifications.nutrition &&
		params.dailyGoals.dailyProtein > 0 &&
		todayRow.proteinLogged >= params.dailyGoals.dailyProtein * 0.9
	) {
		await ensureUserNotification({
			userId: params.supabaseUserId,
			type: "goal_hit",
			title: "Protein target hit",
			body: `You are at ${Math.round(todayRow.proteinLogged)}g, which clears today's protein target.`,
			ctaLabel: "Open Nutrition",
			ctaHref: "/dashboard/nutrition",
			dedupeKey: `goal_hit:protein:${today}`,
			expiresAt: `${addDaysToDateString(today, 1)}T12:00:00.000Z`,
		});
	}

	if (
		params.settings.notifications.nutrition &&
		params.dailyGoals.dailyProtein > 0 &&
		todayRow.proteinLogged < params.dailyGoals.dailyProtein * 0.7 &&
		isWithinReminderWindow(
			params.settings.reminderTime,
			params.settings.timezone ?? "UTC"
		)
	) {
		await ensureUserNotification({
			userId: params.supabaseUserId,
			type: "protein_gap",
			title: "Protein is still trailing today",
			body: `You are at ${Math.round(todayRow.proteinLogged)}g. A protein-focused meal would close the gap faster.`,
			ctaLabel: "Log a meal",
			ctaHref: "/dashboard/nutrition",
			dedupeKey: `protein_gap:${today}`,
			expiresAt: `${addDaysToDateString(today, 1)}T12:00:00.000Z`,
		});
	}

	if (
		params.settings.notifications.goals &&
		todayRow.challengeTasksTarget > 0 &&
		todayRow.challengeGoalMet
	) {
		await ensureUserNotification({
			userId: params.supabaseUserId,
			type: "goal_hit",
			title: "Challenge day completed",
			body: "You cleared every scheduled challenge task for today. Keep the streak going tomorrow.",
			ctaLabel: "Open Goals",
			ctaHref: "/dashboard/goals",
			dedupeKey: `goal_hit:challenge:${today}`,
			expiresAt: `${addDaysToDateString(today, 1)}T12:00:00.000Z`,
		});
	}

	if (
		params.settings.notifications.goals &&
		isWithinReminderWindow(
			params.settings.reminderTime,
			params.settings.timezone ?? "UTC"
		) &&
		params.lifecycleCounts.totalChallenges > 0 &&
		todayRow.challengeTasksTarget > 0 &&
		!todayRow.challengeGoalMet
	) {
		await ensureUserNotification({
			userId: params.supabaseUserId,
			type: "goal_missed_risk",
			title: "You still have time to finish today strong",
			body: "There are still unchecked challenge tasks for today. A small push now keeps the streak healthy.",
			ctaLabel: "Open Goals",
			ctaHref: "/dashboard/goals",
			dedupeKey: `goal_missed_risk:${today}`,
			expiresAt: `${addDaysToDateString(today, 1)}T12:00:00.000Z`,
		});
	}

	if (params.settings.notifications.goals) {
		let streak = 0;
		for (let index = params.dateRange.length - 1; index >= 0; index -= 1) {
			const row = params.metricsMap.get(params.dateRange[index]);
			if (!row || row.workoutCount <= 0) {
				break;
			}
			streak += 1;
		}

		if ([3, 5, 7, 14].includes(streak)) {
			await ensureUserNotification({
				userId: params.supabaseUserId,
				type: "workout_streak",
				title: `${streak}-day workout streak`,
				body: "You have logged training on consecutive days. Protect recovery so the streak stays useful, not just long.",
				ctaLabel: "Open Workouts",
				ctaHref: "/dashboard/workouts",
				dedupeKey: `workout_streak:${streak}:${today}`,
			});
		}
	}

	if (
		params.settings.notifications.summaries &&
		isWeeklySummaryDay(
			today,
			params.settings.timezone ?? "UTC",
			params.settings.weeklySummaryDay
		)
	) {
		await ensureUserNotification({
			userId: params.supabaseUserId,
			type: "weekly_summary",
			title: "Weekly summary is ready",
			body: "Review recovery, training, nutrition, and challenge consistency from the last seven days in one place.",
			ctaLabel: "View Progress",
			ctaHref: "/dashboard/progress?range=7",
			dedupeKey: `weekly_summary:${today}`,
			expiresAt: `${addDaysToDateString(today, 3)}T12:00:00.000Z`,
		});
	}
}

export async function refreshUserAppState(params: {
	supabaseUserId: string;
	days?: number;
	timezoneOverride?: string | null;
}) {
	const settings = await getUserSettingsByUserId(params.supabaseUserId);
	const timezone = params.timezoneOverride ?? settings.timezone ?? "UTC";
	const days = Math.max(7, params.days ?? 90);
	const today = getDateInTimezone(new Date(), timezone);
	const dateRange = buildDateRange(today, days);
	const startDate = dateRange[0];
	const admin = createAdminClient();

	const [
		connectionSummary,
		nutritionGoalResult,
		mealsResult,
		workoutsResult,
		challengesResult,
	] = await Promise.all([
		buildConnectionSummary({
			supabaseUserId: params.supabaseUserId,
			startDate,
			timezone,
		}),
		admin
			.from("nutrition_goals")
			.select("*")
			.eq("user_id", params.supabaseUserId)
			.maybeSingle(),
		admin
			.from("meals")
			.select("*")
			.eq("user_id", params.supabaseUserId)
			.gte("meal_date", startDate)
			.lte("meal_date", today),
		admin
			.from("workouts")
			.select("*")
			.eq("user_id", params.supabaseUserId)
			.gte("date", startDate)
			.lte("date", today),
		admin
			.from("challenges")
			.select("*")
			.eq("user_id", params.supabaseUserId)
			.neq("status", "abandoned"),
	]);

	if (nutritionGoalResult.error) throw nutritionGoalResult.error;
	if (mealsResult.error) throw mealsResult.error;
	if (workoutsResult.error) throw workoutsResult.error;
	if (challengesResult.error) throw challengesResult.error;

	const metricsMap = initializeAccumulatorMap(
		dateRange,
		timezone,
		connectionSummary.activeProvider,
		connectionSummary.syncFreshness
	);

	for (const [
		metricDate,
		wearableMetrics,
	] of connectionSummary.metricsByDate.entries()) {
		const existing = metricsMap.get(metricDate);
		if (!existing) continue;
		Object.assign(existing, wearableMetrics);
		existing.activeWearableProvider = connectionSummary.activeProvider;
		existing.syncFreshness = connectionSummary.syncFreshness;
	}

	const meals = (mealsResult.data ?? []) as MealRow[];
	const nutritionGoals =
		(nutritionGoalResult.data as NutritionGoalRow | null) ?? null;
	const dailyGoals: DailyGoalContext = {
		dailyCalories: nutritionGoals?.daily_calories ?? DEFAULT_CALORIES_GOAL,
		dailyProtein: nutritionGoals?.daily_protein ?? DEFAULT_PROTEIN_GOAL,
	};

	for (const meal of meals) {
		const existing = metricsMap.get(meal.meal_date);
		if (!existing) continue;
		existing.caloriesLogged += meal.calories;
		existing.proteinLogged += meal.protein;
	}

	for (const row of metricsMap.values()) {
		row.calorieGoalMet =
			row.caloriesLogged > 0 &&
			getGoalStatus(row.caloriesLogged, dailyGoals.dailyCalories) === "met";
		row.proteinGoalMet =
			row.proteinLogged > 0 &&
			row.proteinLogged >= dailyGoals.dailyProtein * 0.9;
	}

	const workouts = (workoutsResult.data ?? []) as WorkoutRow[];
	for (const workout of workouts) {
		const existing = metricsMap.get(workout.date);
		if (!existing || workout.status === "skipped") continue;
		existing.workoutCount += 1;
		existing.workoutDurationMinutes += workout.duration_minutes ?? 0;
	}

	const challenges = (challengesResult.data ?? []) as ChallengeRow[];
	const challengeIds = challenges.map((challenge) => challenge.id);
	let taskRows: ChallengeTaskRow[] = [];
	let completionRows: DailyCompletionRow[] = [];

	if (challengeIds.length > 0) {
		const [taskResult, completionResult] = await Promise.all([
			admin
				.from("challenge_tasks")
				.select("*")
				.in("challenge_id", challengeIds),
			admin
				.from("daily_completions")
				.select("*")
				.in("challenge_id", challengeIds)
				.gte("completed_date", startDate)
				.lte("completed_date", today),
		]);

		if (taskResult.error) throw taskResult.error;
		if (completionResult.error) throw completionResult.error;

		taskRows = (taskResult.data ?? []) as ChallengeTaskRow[];
		completionRows = (completionResult.data ?? []) as DailyCompletionRow[];
	}

	const taskCountByChallenge = new Map<string, number>();
	for (const task of taskRows) {
		taskCountByChallenge.set(
			task.challenge_id,
			(taskCountByChallenge.get(task.challenge_id) ?? 0) + 1
		);
	}

	const completionCountByChallengeDate = new Map<string, number>();
	for (const completion of completionRows) {
		const key = `${completion.challenge_id}:${completion.completed_date}`;
		completionCountByChallengeDate.set(
			key,
			(completionCountByChallengeDate.get(key) ?? 0) + 1
		);
	}

	for (const challenge of challenges) {
		const taskCount = taskCountByChallenge.get(challenge.id) ?? 0;
		if (taskCount === 0) continue;
		const challengeEndDate = addDaysToDateString(
			challenge.start_date,
			challenge.duration - 1
		);
		for (const metricDate of dateRange) {
			if (metricDate < challenge.start_date || metricDate > challengeEndDate) {
				continue;
			}

			const existing = metricsMap.get(metricDate);
			if (!existing) continue;

			existing.challengeTasksTarget += taskCount;
			existing.challengeTasksCompleted +=
				completionCountByChallengeDate.get(`${challenge.id}:${metricDate}`) ??
				0;
		}
	}

	for (const row of metricsMap.values()) {
		row.challengeGoalMet =
			row.challengeTasksTarget > 0 &&
			row.challengeTasksCompleted >= row.challengeTasksTarget;
	}

	const payload = Array.from(metricsMap.values()).map((row) => ({
		user_id: params.supabaseUserId,
		...toDailyMetricUpsert(row),
	}));

	const { error: upsertError } = await admin
		.from("daily_user_metrics")
		.upsert(payload, { onConflict: "user_id,metric_date" });

	if (upsertError) {
		throw upsertError;
	}

	const lifecycleCounts = {
		totalMeals: meals.length,
		totalWorkouts: workouts.filter((workout) => workout.status !== "skipped")
			.length,
		totalChallenges: challenges.length,
		hasNutritionGoalConfig: Boolean(nutritionGoals),
	};

	await generateNotifications({
		supabaseUserId: params.supabaseUserId,
		settings,
		dateRange,
		metricsMap,
		connectionSummary,
		lifecycleCounts,
		dailyGoals,
	});

	return {
		settings,
		connectionSummary,
		dateRange,
		dailyGoals,
		lifecycleCounts,
	};
}

export async function ensureUserProgressArtifacts(params: {
	supabaseUserId: string;
	timezoneOverride?: string | null;
}) {
	const settings = await getUserSettingsByUserId(params.supabaseUserId);
	const effectiveTimezone =
		params.timezoneOverride ?? settings.timezone ?? "UTC";
	const today = getDateInTimezone(new Date(), effectiveTimezone);
	const admin = createAdminClient();
	const { data, error } = await admin
		.from("daily_user_metrics")
		.select("metric_date, timezone")
		.eq("user_id", params.supabaseUserId)
		.eq("metric_date", today)
		.maybeSingle();

	if (error) {
		throw error;
	}

	const needsRefresh =
		!data ||
		(data as { timezone?: string | null }).timezone !== effectiveTimezone;

	if (needsRefresh) {
		await refreshUserAppState({
			supabaseUserId: params.supabaseUserId,
			days: 90,
			timezoneOverride: params.timezoneOverride,
		});
	}
}

function buildSummaryCards(context: SnapshotContext): ProgressSummaryCard[] {
	const currentRows = context.rows;
	const previousRows = context.previousRows;

	const recoveryCurrent = average(
		currentRows.map((row) => row.readiness_score)
	);
	const recoveryPrevious = average(
		previousRows.map((row) => row.readiness_score)
	);
	const sleepCurrent = average(currentRows.map((row) => row.sleep_hours));
	const sleepPrevious = average(previousRows.map((row) => row.sleep_hours));
	const stepCurrent = calculateHitRate({
		rows: currentRows,
		isAvailable: (row) => row.steps !== null,
		isMet: (row) =>
			typeof row.steps === "number" && row.steps >= context.stepGoal,
	});
	const stepPrevious = calculateHitRate({
		rows: previousRows,
		isAvailable: (row) => row.steps !== null,
		isMet: (row) =>
			typeof row.steps === "number" && row.steps >= context.stepGoal,
	});
	const workoutsCurrent = sum(currentRows.map((row) => row.workout_count));
	const workoutsPrevious = sum(previousRows.map((row) => row.workout_count));
	const caloriesCurrent = calculateHitRate({
		rows: currentRows,
		isAvailable: (row) => row.calories_logged > 0,
		isMet: (row) => row.calorie_goal_met,
	});
	const caloriesPrevious = calculateHitRate({
		rows: previousRows,
		isAvailable: (row) => row.calories_logged > 0,
		isMet: (row) => row.calorie_goal_met,
	});
	const proteinCurrent = calculateHitRate({
		rows: currentRows,
		isAvailable: (row) => row.protein_logged > 0,
		isMet: (row) => row.protein_goal_met,
	});
	const proteinPrevious = calculateHitRate({
		rows: previousRows,
		isAvailable: (row) => row.protein_logged > 0,
		isMet: (row) => row.protein_goal_met,
	});
	const challengesCurrent = calculateHitRate({
		rows: currentRows,
		isAvailable: (row) => row.challenge_tasks_target > 0,
		isMet: (row) => row.challenge_goal_met,
	});
	const challengesPrevious = calculateHitRate({
		rows: previousRows,
		isAvailable: (row) => row.challenge_tasks_target > 0,
		isMet: (row) => row.challenge_goal_met,
	});

	return [
		{
			id: "recovery",
			label: "Recovery trend",
			value:
				recoveryCurrent !== null
					? formatCompactNumber(recoveryCurrent)
					: "Waiting on wearable",
			detail:
				recoveryCurrent !== null
					? "Average readiness over the selected range"
					: "Wear the connected device through sleep to unlock recovery scoring.",
			deltaLabel: buildDeltaLabel({
				current: recoveryCurrent,
				previous: recoveryPrevious,
			}),
			tone: toTone(
				recoveryCurrent !== null && recoveryPrevious !== null
					? recoveryCurrent - recoveryPrevious
					: null
			),
			empty: recoveryCurrent === null,
		},
		{
			id: "sleep",
			label: "Average sleep",
			value: formatHours(sleepCurrent),
			detail:
				sleepCurrent !== null
					? "Average nightly sleep duration"
					: "Sleep duration will appear once the wearable has at least one full night.",
			deltaLabel: buildDeltaLabel({
				current: sleepCurrent,
				previous: sleepPrevious,
				suffix: "h",
			}),
			tone: toTone(
				sleepCurrent !== null && sleepPrevious !== null
					? sleepCurrent - sleepPrevious
					: null
			),
			empty: sleepCurrent === null,
		},
		{
			id: "steps",
			label: "Step-goal hit rate",
			value: formatCompactPercent(stepCurrent.rate),
			detail:
				stepCurrent.availableCount > 0
					? `${stepCurrent.metCount} of ${stepCurrent.availableCount} tracked days hit ${context.stepGoal.toLocaleString()} steps`
					: "Step hit rate appears after wearable activity starts syncing.",
			deltaLabel: buildDeltaLabel({
				current: stepCurrent.rate,
				previous: stepPrevious.rate,
				suffix: "%",
			}),
			tone: toTone(
				stepCurrent.rate !== null && stepPrevious.rate !== null
					? stepCurrent.rate - stepPrevious.rate
					: null
			),
			empty: stepCurrent.rate === null,
		},
		{
			id: "workouts",
			label: "Workouts logged",
			value: String(workoutsCurrent),
			detail: `${sum(currentRows.map((row) => row.workout_duration_minutes)).toLocaleString()} total training minutes`,
			deltaLabel: buildDeltaLabel({
				current: workoutsCurrent,
				previous: workoutsPrevious,
			}),
			tone: toTone(workoutsCurrent - workoutsPrevious),
		},
		{
			id: "calories",
			label: "Calorie adherence",
			value: formatCompactPercent(caloriesCurrent.rate),
			detail:
				caloriesCurrent.availableCount > 0
					? `${caloriesCurrent.metCount} of ${caloriesCurrent.availableCount} logged days landed near target`
					: "Log meals to start tracking calorie adherence.",
			deltaLabel: buildDeltaLabel({
				current: caloriesCurrent.rate,
				previous: caloriesPrevious.rate,
				suffix: "%",
			}),
			tone: toTone(
				caloriesCurrent.rate !== null && caloriesPrevious.rate !== null
					? caloriesCurrent.rate - caloriesPrevious.rate
					: null
			),
			empty: caloriesCurrent.rate === null,
		},
		{
			id: "protein",
			label: "Protein adherence",
			value: formatCompactPercent(proteinCurrent.rate),
			detail:
				proteinCurrent.availableCount > 0
					? `${proteinCurrent.metCount} of ${proteinCurrent.availableCount} logged days reached target`
					: "Log meals to start tracking protein adherence.",
			deltaLabel: buildDeltaLabel({
				current: proteinCurrent.rate,
				previous: proteinPrevious.rate,
				suffix: "%",
			}),
			tone: toTone(
				proteinCurrent.rate !== null && proteinPrevious.rate !== null
					? proteinCurrent.rate - proteinPrevious.rate
					: null
			),
			empty: proteinCurrent.rate === null,
		},
		{
			id: "challenges",
			label: "Challenge completion",
			value: formatCompactPercent(challengesCurrent.rate),
			detail:
				challengesCurrent.availableCount > 0
					? `${challengesCurrent.metCount} of ${challengesCurrent.availableCount} scheduled days were fully completed`
					: "Start a challenge to track streak-based progress here.",
			deltaLabel: buildDeltaLabel({
				current: challengesCurrent.rate,
				previous: challengesPrevious.rate,
				suffix: "%",
			}),
			tone: toTone(
				challengesCurrent.rate !== null && challengesPrevious.rate !== null
					? challengesCurrent.rate - challengesPrevious.rate
					: null
			),
			empty: challengesCurrent.rate === null,
		},
	];
}

function buildCharts(context: SnapshotContext): ProgressChart[] {
	const proteinGoal = context.goals.dailyProtein;
	return [
		{
			id: "recovery_sleep",
			title: "Recovery & Sleep",
			description:
				"How recovered and well-rested you have looked across the selected window.",
			primaryLabel: "Readiness",
			secondaryLabel: "Sleep hours",
			emptyMessage:
				"Wear the connected device through sleep to unlock recovery and sleep trends.",
			points: context.rows.map((row) => ({
				date: row.metric_date,
				label: formatDayLabel(row.metric_date),
				primary: row.readiness_score,
				secondary: row.sleep_hours,
				primaryDisplay:
					row.readiness_score !== null
						? `${Math.round(row.readiness_score)}`
						: "No score",
				secondaryDisplay:
					row.sleep_hours !== null ? formatHours(row.sleep_hours) : "No sleep",
			})),
		},
		{
			id: "training_activity",
			title: "Training & Activity",
			description:
				"Daily movement progress and whether you trained on that day.",
			primaryLabel: "Step goal progress",
			secondaryLabel: "Workout day",
			emptyMessage:
				"Wearable activity and workout logging both feed this chart once they are available.",
			points: context.rows.map((row) => ({
				date: row.metric_date,
				label: formatDayLabel(row.metric_date),
				primary:
					typeof row.steps === "number" && context.stepGoal > 0
						? Math.min(140, (row.steps / context.stepGoal) * 100)
						: null,
				secondary: row.workout_count > 0 ? 100 : 0,
				primaryDisplay:
					typeof row.steps === "number"
						? `${Math.round((row.steps / context.stepGoal) * 100)}%`
						: "No steps",
				secondaryDisplay:
					row.workout_count > 0 ? `${row.workout_count} workout` : "No workout",
			})),
		},
		{
			id: "nutrition_goals",
			title: "Nutrition & Goals",
			description:
				"Protein progress and challenge completion consistency across the range.",
			primaryLabel: "Protein progress",
			secondaryLabel: "Challenge completion",
			emptyMessage: "Meal logging and active challenges unlock this view.",
			points: context.rows.map((row) => ({
				date: row.metric_date,
				label: formatDayLabel(row.metric_date),
				primary:
					proteinGoal > 0
						? Math.min(140, (row.protein_logged / proteinGoal) * 100)
						: null,
				secondary:
					row.challenge_tasks_target > 0
						? (row.challenge_tasks_completed / row.challenge_tasks_target) * 100
						: null,
				primaryDisplay:
					row.protein_logged > 0
						? `${Math.round(row.protein_logged)}g`
						: "No meals",
				secondaryDisplay:
					row.challenge_tasks_target > 0
						? `${row.challenge_tasks_completed}/${row.challenge_tasks_target} tasks`
						: "No challenge",
			})),
		},
	];
}

function buildWinsAndDrift(cards: ProgressSummaryCard[]) {
	const improvements: string[] = [];
	const regressions: string[] = [];

	for (const card of cards) {
		if (
			card.empty ||
			card.deltaLabel.startsWith("No prior") ||
			card.deltaLabel.startsWith("Flat")
		) {
			continue;
		}

		if (card.tone === "positive") {
			improvements.push(`${card.label} is ${card.deltaLabel.toLowerCase()}.`);
		} else if (card.tone === "caution") {
			regressions.push(`${card.label} is ${card.deltaLabel.toLowerCase()}.`);
		}
	}

	return {
		wins: improvements.slice(0, 3),
		drift: regressions.slice(0, 3),
	};
}

function buildEmptyStateReasons(context: SnapshotContext) {
	const reasons: string[] = [];

	if (context.currentState.activeProvider === null) {
		if (isOuraConfigured() || isWhoopConfigured()) {
			reasons.push(
				"Connect one wearable and wear it through sleep to unlock recovery, sleep, and activity trends."
			);
		}
	} else if (
		context.currentState.syncFreshness === "syncing" ||
		context.currentState.syncFreshness === "baseline_forming"
	) {
		reasons.push(
			"The wearable is connected, but it still needs a little more scored data before the insights feel complete."
		);
	}

	if (context.lifecycleCounts.totalMeals === 0) {
		reasons.push("Log meals to unlock calorie and protein adherence.");
	}

	if (context.lifecycleCounts.totalWorkouts === 0) {
		reasons.push("Log workouts to make the training view useful.");
	}

	if (context.lifecycleCounts.totalChallenges === 0) {
		reasons.push(
			"Start a challenge to add streaks and daily completion tracking."
		);
	}

	return reasons;
}

function buildNextBestAction(context: SnapshotContext): NextBestAction {
	const todayRow = context.rows[context.rows.length - 1];
	const hasAvailableProvider = isOuraConfigured() || isWhoopConfigured();

	if (!context.currentState.activeProvider && hasAvailableProvider) {
		return {
			id: "connect-device",
			title: "Connect one wearable",
			description:
				"Use a single device as the app's source of truth so recovery, sleep, and activity trends stay coherent.",
			label: "Open Devices",
			href: "/dashboard/devices",
			tone: "primary",
		};
	}

	if (
		context.currentState.activeProvider &&
		(context.currentState.syncFreshness === "syncing" ||
			context.currentState.syncFreshness === "baseline_forming")
	) {
		return {
			id: "finish-setup",
			title: "Finish the setup week",
			description:
				"Keep wearing the device through sleep and log the basics so the app can move from setup into daily guidance.",
			label: "Review Setup",
			href: "/dashboard",
			tone: "primary",
		};
	}

	if (!context.lifecycleCounts.hasNutritionGoalConfig) {
		return {
			id: "set-goals",
			title: "Set nutrition targets",
			description:
				"Targets make adherence, reminders, and progress summaries much more useful.",
			label: "Open Settings",
			href: "/dashboard/settings",
			tone: "primary",
		};
	}

	if (context.lifecycleCounts.totalMeals === 0) {
		return {
			id: "log-first-meal",
			title: "Log your first meal",
			description:
				"One logged meal is enough to unlock nutrition progress and protein guidance for the day.",
			label: "Open Nutrition",
			href: "/dashboard/nutrition",
			tone: "primary",
		};
	}

	if (context.lifecycleCounts.totalWorkouts === 0) {
		return {
			id: "log-first-workout",
			title: "Log your first workout",
			description:
				"A workout entry turns training from a blank section into something the app can compare over time.",
			label: "Open Workouts",
			href: "/dashboard/workouts",
			tone: "primary",
		};
	}

	if (context.lifecycleCounts.totalChallenges === 0) {
		return {
			id: "start-first-challenge",
			title: "Start a simple challenge",
			description:
				"Challenges add daily accountability and let the progress view measure consistency instead of activity alone.",
			label: "Open Goals",
			href: "/dashboard/goals",
			tone: "primary",
		};
	}

	if (
		typeof todayRow.readiness_score === "number" &&
		todayRow.readiness_score < 70
	) {
		return {
			id: "recover",
			title: "Protect recovery today",
			description:
				"Your readiness is soft enough that a lighter day will probably help more than forcing intensity.",
			label: "Review Today",
			href: "/dashboard",
			tone: "secondary",
		};
	}

	if (
		typeof todayRow.readiness_score === "number" &&
		todayRow.readiness_score >= 82 &&
		todayRow.workout_count === 0
	) {
		return {
			id: "train-today",
			title: "Use the higher-readiness window",
			description:
				"Recovery looks strong enough to support training today. Logging it will also strengthen the progress view.",
			label: "Open Workouts",
			href: "/dashboard/workouts",
			tone: "primary",
		};
	}

	if (
		context.goals.dailyProtein > 0 &&
		todayRow.protein_logged < context.goals.dailyProtein * 0.7
	) {
		return {
			id: "close-protein-gap",
			title: "Close the protein gap",
			description:
				"Protein is still trailing enough that one focused meal would noticeably improve the day.",
			label: "Open Nutrition",
			href: "/dashboard/nutrition",
			tone: "primary",
		};
	}

	return {
		id: "review-progress",
		title: "Review the bigger picture",
		description:
			"Your daily basics are in place. Use the progress view to see what is improving and where drift is starting.",
		label: "View Progress",
		href: "/dashboard/progress",
		tone: "secondary",
	};
}

function buildTodayAtAGlance(context: SnapshotContext): TodayAtAGlance {
	const todayRow = context.rows[context.rows.length - 1];
	const primaryAction = buildNextBestAction(context);

	const items: TodayAtAGlanceItem[] = [
		{
			id: "recovery",
			label: "Recovery",
			value:
				typeof todayRow.readiness_score === "number"
					? `${Math.round(todayRow.readiness_score)}`
					: context.currentState.activeProvider
						? context.currentState.syncFreshness.replaceAll("_", " ")
						: "Not connected",
			detail:
				typeof todayRow.readiness_score === "number"
					? "Readiness score for today"
					: "Current wearable state",
			tone:
				typeof todayRow.readiness_score === "number" &&
				todayRow.readiness_score < 70
					? "caution"
					: typeof todayRow.readiness_score === "number"
						? "positive"
						: "neutral",
		},
		{
			id: "sleep",
			label: "Sleep",
			value: formatHours(todayRow.sleep_hours),
			detail:
				todayRow.sleep_hours !== null
					? "Last recorded night"
					: "Waiting on a full-night sleep record",
			tone:
				typeof todayRow.sleep_hours === "number" && todayRow.sleep_hours < 6.5
					? "caution"
					: todayRow.sleep_hours !== null
						? "positive"
						: "neutral",
		},
		{
			id: "steps",
			label: "Steps",
			value:
				typeof todayRow.steps === "number"
					? `${todayRow.steps.toLocaleString()} / ${context.stepGoal.toLocaleString()}`
					: "No step data",
			detail: "Progress toward today's step goal",
			tone:
				typeof todayRow.steps === "number" && todayRow.steps >= context.stepGoal
					? "positive"
					: typeof todayRow.steps === "number"
						? "neutral"
						: "neutral",
		},
		{
			id: "training",
			label: "Training",
			value:
				todayRow.workout_count > 0
					? `${todayRow.workout_count} logged`
					: "No workout yet",
			detail:
				todayRow.workout_duration_minutes > 0
					? `${todayRow.workout_duration_minutes} total minutes`
					: "Today's logged training",
			tone: todayRow.workout_count > 0 ? "positive" : "neutral",
		},
		{
			id: "nutrition",
			label: "Nutrition",
			value:
				todayRow.protein_logged > 0
					? `${Math.round(todayRow.protein_logged)}g / ${context.goals.dailyProtein}g`
					: "No meals logged",
			detail: "Protein progress toward today's target",
			tone: todayRow.protein_goal_met ? "positive" : "neutral",
		},
	];

	let headline = "Use the day well";
	let subtitle = primaryAction.description;

	if (
		!context.currentState.activeProvider &&
		(isOuraConfigured() || isWhoopConfigured())
	) {
		headline = "Start with one connected source";
		subtitle =
			"A single wearable plus one logged action is enough to make the app useful.";
	} else if (
		context.currentState.syncFreshness === "syncing" ||
		context.currentState.syncFreshness === "baseline_forming"
	) {
		headline = "Setup is moving";
		subtitle =
			"Wear the device through sleep and log the basics while the baseline sharpens.";
	} else if (
		typeof todayRow.readiness_score === "number" &&
		todayRow.readiness_score < 70
	) {
		headline = "Protect recovery today";
		subtitle =
			"A lighter day and better sleep tonight will probably pay off more than extra strain.";
	} else if (
		typeof todayRow.readiness_score === "number" &&
		todayRow.readiness_score >= 82
	) {
		headline = "You have room to push a bit";
		subtitle =
			"Recovery looks strong enough that training or focused output should land well today.";
	}

	return {
		headline,
		subtitle,
		items,
		primaryAction,
	};
}

function buildSetupChecklist(
	context: SnapshotContext
): SetupChecklistItem[] | null {
	if (
		!context.currentState.activeProvider ||
		(context.currentState.syncFreshness !== "syncing" &&
			context.currentState.syncFreshness !== "baseline_forming")
	) {
		return null;
	}

	return [
		{
			id: "wearable",
			label: "Wearable connected",
			description:
				"One active device is already connected and feeding the app.",
			complete: true,
			href: "/dashboard/devices",
		},
		{
			id: "first-sync",
			label: "First scored sync",
			description:
				"The first complete sleep or scored sync is needed before the app can shift from setup into guidance.",
			complete: context.currentState.syncFreshness === "baseline_forming",
			href: "/dashboard/devices",
		},
		{
			id: "nutrition-goals",
			label: "Nutrition targets set",
			description:
				"Targets make meal logging and reminders materially more useful.",
			complete: context.lifecycleCounts.hasNutritionGoalConfig,
			href: "/dashboard/settings",
		},
		{
			id: "meal",
			label: "First meal logged",
			description:
				"One meal is enough to unlock nutrition progress and protein guidance.",
			complete: context.lifecycleCounts.totalMeals > 0,
			href: "/dashboard/nutrition",
		},
		{
			id: "workout",
			label: "First workout logged",
			description:
				"A logged workout turns training into a trackable pattern instead of an empty tab.",
			complete: context.lifecycleCounts.totalWorkouts > 0,
			href: "/dashboard/workouts",
		},
		{
			id: "challenge",
			label: "First challenge started",
			description:
				"Challenges add streaks and daily completion tracking to the progress layer.",
			complete: context.lifecycleCounts.totalChallenges > 0,
			href: "/dashboard/goals",
		},
	];
}

export async function getProgressSnapshot(params: {
	supabaseUserId: string;
	rangeDays: ProgressRange;
	stepGoal: number;
}): Promise<ProgressSnapshot> {
	await ensureUserProgressArtifacts({
		supabaseUserId: params.supabaseUserId,
	});

	const supabase = await getUserSupabaseClient();
	if (!supabase) {
		throw new Error("Supabase user client unavailable.");
	}

	const settings = await getUserSettingsByUserId(params.supabaseUserId);
	const effectiveTimezone = settings.timezone ?? "UTC";
	const timezone = settings.timezone ?? DEFAULT_USER_SETTINGS.timezone;
	const today = getDateInTimezone(new Date(), effectiveTimezone);
	const currentRange = buildDateRange(today, params.rangeDays);
	const previousRange = buildDateRange(
		addDaysToDateString(currentRange[0], -1),
		params.rangeDays
	);
	const fetchStart = previousRange[0];

	const { data, error } = await supabase
		.from("daily_user_metrics")
		.select("*")
		.eq("user_id", params.supabaseUserId)
		.gte("metric_date", fetchStart)
		.lte("metric_date", today)
		.order("metric_date", { ascending: true });

	if (error) {
		throw error;
	}

	const allRows = (data ?? []) as DailyMetricRow[];
	const rowByDate = new Map(
		allRows.map(
			(row) => [row.metric_date, row] satisfies [string, DailyMetricRow]
		)
	);
	const currentRows = buildRowsForRange({
		range: currentRange,
		rowByDate,
		supabaseUserId: params.supabaseUserId,
		timezone: effectiveTimezone,
	});
	const previousRows = buildRowsForRange({
		range: previousRange,
		rowByDate,
		supabaseUserId: params.supabaseUserId,
		timezone: effectiveTimezone,
	});

	const lifecycleCounts = await getLifecycleCounts(params.supabaseUserId);
	const latestRow = currentRows[currentRows.length - 1];
	const context: SnapshotContext = {
		settings,
		currentState: {
			activeProvider: latestRow.active_wearable_provider,
			syncFreshness: latestRow.sync_freshness,
			latestSyncAt: null,
			baselineCount: 0,
			metricsByDate: new Map(),
		},
		goals: {
			dailyCalories: DEFAULT_CALORIES_GOAL,
			dailyProtein: DEFAULT_PROTEIN_GOAL,
		},
		lifecycleCounts,
		rows: currentRows,
		previousRows,
		rangeDays: params.rangeDays,
		stepGoal: params.stepGoal,
	};

	const { data: nutritionGoalsData, error: nutritionGoalsError } =
		await supabase
			.from("nutrition_goals")
			.select("*")
			.eq("user_id", params.supabaseUserId)
			.maybeSingle();

	if (nutritionGoalsError) {
		throw nutritionGoalsError;
	}

	if (nutritionGoalsData) {
		const row = nutritionGoalsData as NutritionGoalRow;
		context.goals = {
			dailyCalories: row.daily_calories,
			dailyProtein: row.daily_protein,
		};
	}

	const summaryCards = buildSummaryCards(context);
	const charts = buildCharts(context);
	const { wins, drift } = buildWinsAndDrift(summaryCards);
	const nextBestAction = buildNextBestAction(context);
	const todayAtAGlance = buildTodayAtAGlance(context);
	const setupChecklist = buildSetupChecklist(context);
	const emptyStateReasons = buildEmptyStateReasons(context);

	return {
		rangeDays: params.rangeDays,
		timezone,
		currentState: {
			activeProvider: context.currentState.activeProvider,
			syncFreshness: context.currentState.syncFreshness,
		},
		summaryCards,
		charts,
		wins,
		drift,
		emptyStateReasons,
		nextBestAction,
		todayAtAGlance,
		setupChecklist,
	};
}
