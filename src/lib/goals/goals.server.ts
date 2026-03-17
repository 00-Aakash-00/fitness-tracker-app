import "server-only";

import { createAdminClient } from "@/lib/supabase";
import type {
	ChallengeDetail,
	ChallengeTask,
	ChallengeWithTasks,
	DailyCompletion,
} from "./goals.types";
import { calculateStreaks } from "./goals.utils";

/**
 * Map a Supabase row to the Challenge type (snake_case → camelCase).
 */
function mapChallengeRow(row: Record<string, unknown>) {
	return {
		id: row.id as string,
		userId: row.user_id as string,
		name: row.name as string,
		description: (row.description as string) ?? "",
		duration: row.duration as number,
		startDate: row.start_date as string,
		timezone: (row.timezone as string) ?? "UTC",
		status: row.status as string,
		templateId: (row.template_id as string) ?? null,
		createdAt: row.created_at as string,
		updatedAt: row.updated_at as string,
	};
}

function mapTaskRow(row: Record<string, unknown>): ChallengeTask {
	return {
		id: row.id as string,
		challengeId: row.challenge_id as string,
		label: row.label as string,
		sortOrder: row.sort_order as number,
	};
}

function mapCompletionRow(row: Record<string, unknown>): DailyCompletion {
	return {
		id: row.id as string,
		challengeId: row.challenge_id as string,
		taskId: row.task_id as string,
		completedDate: row.completed_date as string,
	};
}

/**
 * Get all challenges for a user with their tasks.
 * Active challenges appear first, sorted by created_at desc.
 */
export async function getUserChallenges(
	supabaseUserId: string
): Promise<ChallengeWithTasks[]> {
	const supabase = createAdminClient();

	const { data: challengeRows, error: challengeError } = await supabase
		.from("challenges")
		.select("*")
		.eq("user_id", supabaseUserId)
		.order("status", { ascending: true })
		.order("created_at", { ascending: false });

	if (challengeError) {
		throw challengeError;
	}

	if (!challengeRows || challengeRows.length === 0) {
		return [];
	}

	const challengeIds = challengeRows.map(
		(r: Record<string, unknown>) => r.id as string
	);

	const { data: taskRows, error: taskError } = await supabase
		.from("challenge_tasks")
		.select("*")
		.in("challenge_id", challengeIds)
		.order("sort_order", { ascending: true });

	if (taskError) {
		throw taskError;
	}

	// Group tasks by challenge_id
	const tasksByChallenge = new Map<string, ChallengeTask[]>();
	for (const row of taskRows ?? []) {
		const task = mapTaskRow(row);
		const existing = tasksByChallenge.get(task.challengeId) ?? [];
		existing.push(task);
		tasksByChallenge.set(task.challengeId, existing);
	}

	// Sort: active first, then paused, then completed, then abandoned
	const statusOrder: Record<string, number> = {
		active: 0,
		paused: 1,
		completed: 2,
		abandoned: 3,
	};

	const challenges: ChallengeWithTasks[] = challengeRows.map(
		(row: Record<string, unknown>) => {
			const challenge = mapChallengeRow(row);
			return {
				...challenge,
				tasks: tasksByChallenge.get(challenge.id) ?? [],
			} as ChallengeWithTasks;
		}
	);

	challenges.sort((a, b) => {
		const aOrder = statusOrder[a.status] ?? 99;
		const bOrder = statusOrder[b.status] ?? 99;
		if (aOrder !== bOrder) return aOrder - bOrder;
		// Same status: newer first
		return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
	});

	return challenges;
}

/**
 * Get full detail for a single challenge including completions and stats.
 */
export async function getChallengeDetail(
	challengeId: string,
	supabaseUserId: string
): Promise<ChallengeDetail | null> {
	const supabase = createAdminClient();

	// Fetch challenge
	const { data: challengeRow, error: challengeError } = await supabase
		.from("challenges")
		.select("*")
		.eq("id", challengeId)
		.eq("user_id", supabaseUserId)
		.maybeSingle();

	if (challengeError) {
		throw challengeError;
	}

	if (!challengeRow) {
		return null;
	}

	const challenge = mapChallengeRow(challengeRow);

	// Fetch tasks
	const { data: taskRows, error: taskError } = await supabase
		.from("challenge_tasks")
		.select("*")
		.eq("challenge_id", challengeId)
		.order("sort_order", { ascending: true });

	if (taskError) {
		throw taskError;
	}

	const tasks = (taskRows ?? []).map(mapTaskRow);

	// Fetch all completions
	const { data: completionRows, error: completionError } = await supabase
		.from("daily_completions")
		.select("*")
		.eq("challenge_id", challengeId);

	if (completionError) {
		throw completionError;
	}

	const completions = (completionRows ?? []).map(mapCompletionRow);

	// Calculate stats
	const stats = calculateStreaks(
		completions,
		tasks.length,
		challenge.startDate,
		challenge.duration,
		challenge.timezone
	);

	return {
		...challenge,
		tasks,
		completions,
		stats,
	} as ChallengeDetail;
}

/**
 * Get completions for a specific challenge and date.
 */
export async function getCompletionsForDate(
	challengeId: string,
	date: string
): Promise<DailyCompletion[]> {
	const supabase = createAdminClient();

	const { data, error } = await supabase
		.from("daily_completions")
		.select("*")
		.eq("challenge_id", challengeId)
		.eq("completed_date", date);

	if (error) {
		throw error;
	}

	return (data ?? []).map(mapCompletionRow);
}

/**
 * Get completions for all challenges belonging to a user for stats calculation.
 */
export async function getCompletionsForChallenges(
	challengeIds: string[]
): Promise<DailyCompletion[]> {
	if (challengeIds.length === 0) return [];

	const supabase = createAdminClient();

	const { data, error } = await supabase
		.from("daily_completions")
		.select("*")
		.in("challenge_id", challengeIds);

	if (error) {
		throw error;
	}

	return (data ?? []).map(mapCompletionRow);
}
