import "server-only";

import { createAdminClient } from "@/lib/supabase";
import type {
	Exercise,
	ExerciseSet,
	TemplateExercise,
	TemplateWithExercises,
	Workout,
	WorkoutExercise,
	WorkoutWithExercises,
} from "./workouts.types";

// ─── Helpers ──────────────────────────────────────────────────

function mapExerciseRow(row: Record<string, unknown>): Exercise {
	return {
		id: row.id as string,
		userId: (row.user_id as string) ?? null,
		name: row.name as string,
		muscleGroup: (row.muscle_group as string) ?? null,
		equipment: (row.equipment as string) ?? null,
	};
}

function mapSetRow(row: Record<string, unknown>): ExerciseSet {
	return {
		id: row.id as string,
		workoutExerciseId: row.workout_exercise_id as string,
		setNumber: row.set_number as number,
		setType: row.set_type as ExerciseSet["setType"],
		weight: row.weight !== null ? Number(row.weight) : null,
		reps: (row.reps as number) ?? null,
		rpe: row.rpe !== null ? Number(row.rpe) : null,
		isCompleted: (row.is_completed as boolean) ?? false,
		notes: (row.notes as string) ?? null,
	};
}

function mapWorkoutExerciseRow(row: Record<string, unknown>): WorkoutExercise {
	const exerciseData = row.exercises as Record<string, unknown>;
	const setsData = (row.exercise_sets as Record<string, unknown>[]) ?? [];

	return {
		id: row.id as string,
		workoutId: row.workout_id as string,
		exerciseId: row.exercise_id as string,
		exercise: mapExerciseRow(exerciseData),
		sortOrder: row.sort_order as number,
		isCompleted: (row.is_completed as boolean) ?? false,
		notes: (row.notes as string) ?? null,
		sets: setsData.map(mapSetRow).sort((a, b) => a.setNumber - b.setNumber),
	};
}

function mapWorkoutRow(row: Record<string, unknown>): Workout {
	return {
		id: row.id as string,
		userId: row.user_id as string,
		templateId: (row.template_id as string) ?? null,
		name: row.name as string,
		date: row.date as string,
		status: row.status as Workout["status"],
		startedAt: (row.started_at as string) ?? null,
		completedAt: (row.completed_at as string) ?? null,
		notes: (row.notes as string) ?? null,
		durationMinutes: (row.duration_minutes as number) ?? null,
		color: (row.color as string) ?? null,
	};
}

// ─── Exercises ──────────────────────────────────────────────────

export async function getExercises(
	supabaseUserId: string
): Promise<Exercise[]> {
	const supabase = createAdminClient();
	const { data, error } = await supabase
		.from("exercises")
		.select("id, user_id, name, muscle_group, equipment")
		.or(`user_id.is.null,user_id.eq.${supabaseUserId}`)
		.order("name");

	if (error) {
		console.error("Error fetching exercises:", error);
		return [];
	}

	return (data ?? [])
		.map((row) => row as unknown as Record<string, unknown>)
		.map(mapExerciseRow);
}

// ─── Templates ──────────────────────────────────────────────────

export async function getUserTemplates(
	supabaseUserId: string
): Promise<TemplateWithExercises[]> {
	const supabase = createAdminClient();

	const { data, error } = await supabase
		.from("workout_templates")
		.select(
			`
			id, user_id, name, description, color, sort_order, created_at, updated_at,
			template_exercises (
				id, template_id, exercise_id, sort_order, target_sets, target_reps, target_weight, notes, rest_seconds, created_at,
				exercises (id, user_id, name, muscle_group, equipment)
			)
		`
		)
		.eq("user_id", supabaseUserId)
		.order("sort_order");

	if (error) {
		console.error("Error fetching templates:", error);
		return [];
	}

	return (data ?? []).map((row) => {
		const templateExercises = (
			(row.template_exercises as unknown as Record<string, unknown>[]) ?? []
		).map((te) => {
			const exerciseData = te.exercises as Record<string, unknown>;
			return {
				id: te.id as string,
				templateId: te.template_id as string,
				exerciseId: te.exercise_id as string,
				exercise: mapExerciseRow(exerciseData),
				sortOrder: te.sort_order as number,
				targetSets: (te.target_sets as number) ?? null,
				targetReps: (te.target_reps as string) ?? null,
				targetWeight:
					te.target_weight !== null ? Number(te.target_weight) : null,
				notes: (te.notes as string) ?? null,
				restSeconds: (te.rest_seconds as number) ?? null,
			} as TemplateExercise;
		});

		templateExercises.sort((a, b) => a.sortOrder - b.sortOrder);

		return {
			id: row.id,
			userId: row.user_id,
			name: row.name,
			description: row.description,
			color: row.color,
			sortOrder: row.sort_order,
			exercises: templateExercises,
		} as TemplateWithExercises;
	});
}

// ─── Workouts ──────────────────────────────────────────────────

export async function getWorkoutsForMonth(
	supabaseUserId: string,
	year: number,
	month: number
): Promise<Workout[]> {
	const supabase = createAdminClient();

	const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
	const lastDay = new Date(year, month, 0).getDate();
	const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

	// Also join workout_templates to get color
	const { data, error } = await supabase
		.from("workouts")
		.select(
			`
			id, user_id, template_id, name, date, status, started_at, completed_at, notes, duration_minutes, created_at, updated_at,
			workout_templates (color)
		`
		)
		.eq("user_id", supabaseUserId)
		.gte("date", startDate)
		.lte("date", endDate)
		.order("created_at");

	if (error) {
		console.error("Error fetching workouts for month:", error);
		return [];
	}

	return (data ?? []).map((row) => {
		const templateData = row.workout_templates as unknown as Record<
			string,
			unknown
		> | null;
		return {
			...mapWorkoutRow(row as unknown as Record<string, unknown>),
			color: templateData ? (templateData.color as string) : null,
		};
	});
}

export async function getWorkoutsForDate(
	supabaseUserId: string,
	date: string
): Promise<WorkoutWithExercises[]> {
	const supabase = createAdminClient();

	const { data, error } = await supabase
		.from("workouts")
		.select(
			`
			id, user_id, template_id, name, date, status, started_at, completed_at, notes, duration_minutes, created_at, updated_at,
			workout_templates (color),
			workout_exercises (
				id, workout_id, exercise_id, sort_order, is_completed, notes, created_at,
				exercises (id, user_id, name, muscle_group, equipment),
				exercise_sets (id, workout_exercise_id, set_number, set_type, weight, reps, rpe, is_completed, notes, created_at)
			)
		`
		)
		.eq("user_id", supabaseUserId)
		.eq("date", date)
		.order("created_at");

	if (error) {
		console.error("Error fetching workouts for date:", error);
		return [];
	}

	return (data ?? []).map((row) => {
		const exercisesData =
			(row.workout_exercises as unknown as Record<string, unknown>[]) ?? [];
		const templateData = row.workout_templates as unknown as Record<
			string,
			unknown
		> | null;

		const exercises = exercisesData
			.map(mapWorkoutExerciseRow)
			.sort((a, b) => a.sortOrder - b.sortOrder);

		return {
			...mapWorkoutRow(row as unknown as Record<string, unknown>),
			color: templateData ? (templateData.color as string) : null,
			exercises,
		};
	});
}

export async function getWorkoutDetail(
	workoutId: string,
	supabaseUserId: string
): Promise<WorkoutWithExercises | null> {
	const supabase = createAdminClient();

	const { data, error } = await supabase
		.from("workouts")
		.select(
			`
			id, user_id, template_id, name, date, status, started_at, completed_at, notes, duration_minutes, created_at, updated_at,
			workout_templates (color),
			workout_exercises (
				id, workout_id, exercise_id, sort_order, is_completed, notes, created_at,
				exercises (id, user_id, name, muscle_group, equipment),
				exercise_sets (id, workout_exercise_id, set_number, set_type, weight, reps, rpe, is_completed, notes, created_at)
			)
		`
		)
		.eq("id", workoutId)
		.eq("user_id", supabaseUserId)
		.maybeSingle();

	if (error) {
		console.error("Error fetching workout detail:", error);
		return null;
	}

	if (!data) return null;

	const exercisesData =
		(data.workout_exercises as unknown as Record<string, unknown>[]) ?? [];
	const templateData = data.workout_templates as unknown as Record<
		string,
		unknown
	> | null;

	const exercises = exercisesData
		.map(mapWorkoutExerciseRow)
		.sort((a, b) => a.sortOrder - b.sortOrder);

	return {
		...mapWorkoutRow(data as unknown as Record<string, unknown>),
		color: templateData ? (templateData.color as string) : null,
		exercises,
	};
}

// ─── Exercise History ────────────────────────────────────────────

export type ExerciseHistoryEntry = {
	date: string;
	workoutName: string;
	sets: ExerciseSet[];
};

export async function getExerciseHistory(
	exerciseId: string,
	supabaseUserId: string,
	limit = 10
): Promise<ExerciseHistoryEntry[]> {
	const supabase = createAdminClient();

	const { data, error } = await supabase
		.from("workout_exercises")
		.select(
			`
			id, workout_id, exercise_id, sort_order, is_completed, notes,
			exercise_sets (id, workout_exercise_id, set_number, set_type, weight, reps, rpe, is_completed, notes, created_at),
			workouts!inner (id, user_id, name, date, status)
		`
		)
		.eq("exercise_id", exerciseId)
		.eq("workouts.user_id", supabaseUserId)
		.order("created_at", { ascending: false })
		.limit(limit);

	if (error) {
		console.error("Error fetching exercise history:", error);
		return [];
	}

	const entries: ExerciseHistoryEntry[] = [];

	for (const row of data ?? []) {
		const workoutData = row.workouts as unknown as Record<string, unknown>;
		if (!workoutData) continue;

		const setsData =
			(row.exercise_sets as unknown as Record<string, unknown>[]) ?? [];

		entries.push({
			date: workoutData.date as string,
			workoutName: workoutData.name as string,
			sets: setsData.map(mapSetRow).sort((a, b) => a.setNumber - b.setNumber),
		});
	}

	// Sort by date descending
	entries.sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
	);

	return entries;
}
