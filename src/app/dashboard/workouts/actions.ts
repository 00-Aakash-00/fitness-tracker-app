"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getSupabaseUserIdByClerkId } from "@/lib/integrations/oauth-connections.server";
import { createAdminClient } from "@/lib/supabase";

type ActionResult = {
	status: "success" | "error";
	message: string;
};

type TemplateExerciseInput = {
	exerciseId: string;
	targetSets: number | null;
	targetReps: string | null;
	targetWeight: number | null;
	notes: string | null;
	restSeconds: number | null;
};

type TemplateSnapshot = {
	name: string;
	description: string | null;
	color: string;
	exercises: TemplateExerciseInput[];
};

// ─── Helpers ──────────────────────────────────────────────────

function getString(formData: FormData, key: string): string | null {
	const val = formData.get(key);
	if (typeof val !== "string" || val.trim().length === 0) return null;
	return val.trim();
}

function getNumber(formData: FormData, key: string): number | null {
	const raw = formData.get(key);
	if (typeof raw !== "string") return null;
	const num = Number(raw);
	return Number.isFinite(num) ? num : null;
}

async function getAuthenticatedUserId(): Promise<string | null> {
	const { userId } = await auth();
	if (!userId) return null;
	return getSupabaseUserIdByClerkId(userId);
}

function parseTemplateExercises(rawValue: string | null): {
	exercises: TemplateExerciseInput[];
	error?: string;
} {
	if (!rawValue) {
		return { exercises: [] };
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(rawValue);
	} catch {
		return { exercises: [], error: "Failed to parse template exercises." };
	}

	if (!Array.isArray(parsed)) {
		return { exercises: [], error: "Template exercises must be an array." };
	}

	const exercises: TemplateExerciseInput[] = [];

	for (const item of parsed) {
		if (!item || typeof item !== "object") {
			return { exercises: [], error: "Template exercise payload is invalid." };
		}

		const candidate = item as Record<string, unknown>;
		const exerciseId =
			typeof candidate.exerciseId === "string"
				? candidate.exerciseId.trim()
				: "";

		if (!exerciseId) {
			return {
				exercises: [],
				error: "Each template exercise must include an exercise ID.",
			};
		}

		const targetSets =
			typeof candidate.targetSets === "number" &&
			Number.isFinite(candidate.targetSets) &&
			candidate.targetSets > 0
				? Math.round(candidate.targetSets)
				: null;
		const targetReps =
			typeof candidate.targetReps === "string" &&
			candidate.targetReps.trim().length > 0
				? candidate.targetReps.trim()
				: null;
		const targetWeight =
			typeof candidate.targetWeight === "number" &&
			Number.isFinite(candidate.targetWeight)
				? candidate.targetWeight
				: null;
		const notes =
			typeof candidate.notes === "string" && candidate.notes.trim().length > 0
				? candidate.notes.trim()
				: null;
		const restSeconds =
			typeof candidate.restSeconds === "number" &&
			Number.isFinite(candidate.restSeconds) &&
			candidate.restSeconds > 0
				? Math.round(candidate.restSeconds)
				: null;

		exercises.push({
			exerciseId,
			targetSets,
			targetReps,
			targetWeight,
			notes,
			restSeconds,
		});
	}

	return { exercises };
}

async function deleteTemplateById(templateId: string): Promise<void> {
	const supabase = createAdminClient();
	const { error } = await supabase
		.from("workout_templates")
		.delete()
		.eq("id", templateId);

	if (error) {
		console.error("Error cleaning up partial template:", error);
	}
}

async function deleteWorkoutById(workoutId: string): Promise<void> {
	const supabase = createAdminClient();
	const { error } = await supabase
		.from("workouts")
		.delete()
		.eq("id", workoutId);

	if (error) {
		console.error("Error cleaning up partial workout:", error);
	}
}

async function deleteWorkoutExerciseById(
	workoutExerciseId: string
): Promise<void> {
	const supabase = createAdminClient();
	const { error } = await supabase
		.from("workout_exercises")
		.delete()
		.eq("id", workoutExerciseId);

	if (error) {
		console.error("Error cleaning up partial workout exercise:", error);
	}
}

async function restoreTemplateSnapshot(
	templateId: string,
	snapshot: TemplateSnapshot
): Promise<void> {
	const supabase = createAdminClient();

	const { error: metadataError } = await supabase
		.from("workout_templates")
		.update({
			name: snapshot.name,
			description: snapshot.description,
			color: snapshot.color,
			updated_at: new Date().toISOString(),
		})
		.eq("id", templateId);

	if (metadataError) {
		console.error("Error restoring template metadata:", metadataError);
	}

	const { error: deleteError } = await supabase
		.from("template_exercises")
		.delete()
		.eq("template_id", templateId);

	if (deleteError) {
		console.error(
			"Error clearing template exercises during rollback:",
			deleteError
		);
		return;
	}

	if (snapshot.exercises.length === 0) {
		return;
	}

	const { error: restoreError } = await supabase
		.from("template_exercises")
		.insert(
			snapshot.exercises.map((exercise, index) => ({
				template_id: templateId,
				exercise_id: exercise.exerciseId,
				sort_order: index,
				target_sets: exercise.targetSets,
				target_reps: exercise.targetReps,
				target_weight: exercise.targetWeight,
				notes: exercise.notes,
				rest_seconds: exercise.restSeconds,
			}))
		);

	if (restoreError) {
		console.error("Error restoring template exercises:", restoreError);
	}
}

// ─── Templates ──────────────────────────────────────────────────

export async function createTemplate(
	formData: FormData
): Promise<ActionResult> {
	const supabaseUserId = await getAuthenticatedUserId();
	if (!supabaseUserId) {
		return { status: "error", message: "Not authenticated." };
	}

	const name = getString(formData, "name");
	if (!name) {
		return { status: "error", message: "Template name is required." };
	}

	const description = getString(formData, "description");
	const color = getString(formData, "color") ?? "#1d83ab";
	const exercisesJson = getString(formData, "exercises");
	const { exercises, error: exercisesError } =
		parseTemplateExercises(exercisesJson);

	if (exercisesError) {
		return { status: "error", message: exercisesError };
	}

	const supabase = createAdminClient();

	// Get the next sort order
	const { data: existing } = await supabase
		.from("workout_templates")
		.select("sort_order")
		.eq("user_id", supabaseUserId)
		.order("sort_order", { ascending: false })
		.limit(1);

	const nextSortOrder =
		existing && existing.length > 0
			? (existing[0].sort_order as number) + 1
			: 0;

	// Insert the template
	const { data: template, error: templateError } = await supabase
		.from("workout_templates")
		.insert({
			user_id: supabaseUserId,
			name,
			description,
			color,
			sort_order: nextSortOrder,
		})
		.select("id")
		.single();

	if (templateError) {
		console.error("Error creating template:", templateError);
		return { status: "error", message: "Failed to create template." };
	}

	// Insert template exercises if provided
	if (exercises.length > 0) {
		const rows = exercises.map((exercise, index) => ({
			template_id: template.id,
			exercise_id: exercise.exerciseId,
			sort_order: index,
			target_sets: exercise.targetSets,
			target_reps: exercise.targetReps,
			target_weight: exercise.targetWeight,
			notes: exercise.notes,
			rest_seconds: exercise.restSeconds,
		}));

		const { error: exError } = await supabase
			.from("template_exercises")
			.insert(rows);

		if (exError) {
			console.error("Error adding template exercises:", exError);
			await deleteTemplateById(template.id);
			return {
				status: "error",
				message: "Failed to create template exercises.",
			};
		}
	}

	revalidatePath("/dashboard/workouts");
	return { status: "success", message: "Template created." };
}

export async function updateTemplate(
	formData: FormData
): Promise<ActionResult> {
	const supabaseUserId = await getAuthenticatedUserId();
	if (!supabaseUserId) {
		return { status: "error", message: "Not authenticated." };
	}

	const templateId = getString(formData, "templateId");
	if (!templateId) {
		return { status: "error", message: "Template ID is required." };
	}

	const name = getString(formData, "name");
	if (!name) {
		return { status: "error", message: "Template name is required." };
	}

	const description = getString(formData, "description");
	const color = getString(formData, "color") ?? "#1d83ab";
	const exercisesJson = getString(formData, "exercises");
	const { exercises, error: exercisesError } =
		parseTemplateExercises(exercisesJson);

	if (exercisesError) {
		return { status: "error", message: exercisesError };
	}

	const supabase = createAdminClient();

	// Verify ownership
	const { data: existingTemplate } = await supabase
		.from("workout_templates")
		.select("id, name, description, color")
		.eq("id", templateId)
		.eq("user_id", supabaseUserId)
		.maybeSingle();

	if (!existingTemplate) {
		return { status: "error", message: "Template not found." };
	}

	const { data: previousExercises, error: previousExercisesError } =
		await supabase
			.from("template_exercises")
			.select(
				"exercise_id, sort_order, target_sets, target_reps, target_weight, notes, rest_seconds"
			)
			.eq("template_id", templateId)
			.order("sort_order", { ascending: true });

	if (previousExercisesError) {
		console.error(
			"Error fetching existing template exercises:",
			previousExercisesError
		);
		return { status: "error", message: "Failed to load existing template." };
	}

	const snapshot: TemplateSnapshot = {
		name: existingTemplate.name as string,
		description: (existingTemplate.description as string) ?? null,
		color: existingTemplate.color as string,
		exercises: (previousExercises ?? []).map((exercise) => ({
			exerciseId: exercise.exercise_id as string,
			targetSets: (exercise.target_sets as number) ?? null,
			targetReps: (exercise.target_reps as string) ?? null,
			targetWeight:
				exercise.target_weight !== null ? Number(exercise.target_weight) : null,
			notes: (exercise.notes as string) ?? null,
			restSeconds: (exercise.rest_seconds as number) ?? null,
		})),
	};

	// Update template
	const { error: updateError } = await supabase
		.from("workout_templates")
		.update({
			name,
			description,
			color,
			updated_at: new Date().toISOString(),
		})
		.eq("id", templateId)
		.eq("user_id", supabaseUserId);

	if (updateError) {
		console.error("Error updating template:", updateError);
		return { status: "error", message: "Failed to update template." };
	}

	const { error: deleteExercisesError } = await supabase
		.from("template_exercises")
		.delete()
		.eq("template_id", templateId);

	if (deleteExercisesError) {
		console.error(
			"Error clearing existing template exercises:",
			deleteExercisesError
		);
		await restoreTemplateSnapshot(templateId, snapshot);
		return {
			status: "error",
			message: "Failed to update template exercises.",
		};
	}

	if (exercises.length > 0) {
		const rows = exercises.map((exercise, index) => ({
			template_id: templateId,
			exercise_id: exercise.exerciseId,
			sort_order: index,
			target_sets: exercise.targetSets,
			target_reps: exercise.targetReps,
			target_weight: exercise.targetWeight,
			notes: exercise.notes,
			rest_seconds: exercise.restSeconds,
		}));

		const { error: exError } = await supabase
			.from("template_exercises")
			.insert(rows);

		if (exError) {
			console.error("Error updating template exercises:", exError);
			await restoreTemplateSnapshot(templateId, snapshot);
			return {
				status: "error",
				message: "Failed to update template exercises.",
			};
		}
	}

	revalidatePath("/dashboard/workouts");
	return { status: "success", message: "Template updated." };
}

export async function deleteTemplate(
	formData: FormData
): Promise<ActionResult> {
	const supabaseUserId = await getAuthenticatedUserId();
	if (!supabaseUserId) {
		return { status: "error", message: "Not authenticated." };
	}

	const templateId = getString(formData, "templateId");
	if (!templateId) {
		return { status: "error", message: "Template ID is required." };
	}

	const supabase = createAdminClient();

	const { error } = await supabase
		.from("workout_templates")
		.delete()
		.eq("id", templateId)
		.eq("user_id", supabaseUserId);

	if (error) {
		console.error("Error deleting template:", error);
		return { status: "error", message: "Failed to delete template." };
	}

	revalidatePath("/dashboard/workouts");
	return { status: "success", message: "Template deleted." };
}

// ─── Workouts ──────────────────────────────────────────────────

export async function createWorkoutFromTemplate(
	formData: FormData
): Promise<ActionResult> {
	const supabaseUserId = await getAuthenticatedUserId();
	if (!supabaseUserId) {
		return { status: "error", message: "Not authenticated." };
	}

	const templateId = getString(formData, "templateId");
	const date = getString(formData, "date");

	if (!templateId) {
		return { status: "error", message: "Template ID is required." };
	}

	if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		return { status: "error", message: "Invalid date." };
	}

	const supabase = createAdminClient();

	// Fetch the template and its exercises
	const { data: template, error: templateError } = await supabase
		.from("workout_templates")
		.select(
			`
			id, name, description, color,
			template_exercises (
				id, exercise_id, sort_order, target_sets, target_reps, target_weight, notes, rest_seconds
			)
		`
		)
		.eq("id", templateId)
		.eq("user_id", supabaseUserId)
		.maybeSingle();

	if (templateError || !template) {
		return { status: "error", message: "Template not found." };
	}

	// Create the workout
	const { data: workout, error: workoutError } = await supabase
		.from("workouts")
		.insert({
			user_id: supabaseUserId,
			template_id: templateId,
			name: template.name as string,
			date,
			status: "planned",
			notes: template.description,
		})
		.select("id")
		.single();

	if (workoutError) {
		console.error("Error creating workout:", workoutError);
		return { status: "error", message: "Failed to create workout." };
	}

	// Insert workout exercises from template exercises
	const templateExercises =
		(template.template_exercises as unknown as Array<
			Record<string, unknown>
		>) ?? [];

	if (templateExercises.length > 0) {
		const workoutExerciseRows = templateExercises.map((te) => ({
			workout_id: workout.id,
			exercise_id: te.exercise_id as string,
			sort_order: te.sort_order as number,
			is_completed: false,
			notes: (te.notes as string) ?? null,
		}));

		const { data: insertedExercises, error: weError } = await supabase
			.from("workout_exercises")
			.insert(workoutExerciseRows)
			.select("id, exercise_id, sort_order");

		if (weError) {
			console.error("Error adding workout exercises:", weError);
			await deleteWorkoutById(workout.id);
			return {
				status: "error",
				message: "Failed to create workout exercises.",
			};
		}

		if (insertedExercises) {
			// Create empty exercise sets based on target_sets
			const setRows: Array<Record<string, unknown>> = [];

			for (const we of insertedExercises) {
				// Find the matching template exercise
				const matchingTe = templateExercises.find(
					(te) => te.sort_order === we.sort_order
				);
				const targetSets = (matchingTe?.target_sets as number) ?? 3;

				for (let s = 1; s <= targetSets; s++) {
					setRows.push({
						workout_exercise_id: we.id,
						set_number: s,
						set_type: "working",
						weight: matchingTe?.target_weight ?? null,
						reps: null,
						rpe: null,
						is_completed: false,
						notes: null,
					});
				}
			}

			if (setRows.length > 0) {
				const { error: setError } = await supabase
					.from("exercise_sets")
					.insert(setRows);

				if (setError) {
					console.error("Error creating exercise sets:", setError);
					await deleteWorkoutById(workout.id);
					return {
						status: "error",
						message: "Failed to create workout sets.",
					};
				}
			}
		}
	}

	revalidatePath("/dashboard/workouts");
	return { status: "success", message: "Workout created from template." };
}

export async function createEmptyWorkout(
	formData: FormData
): Promise<ActionResult> {
	const supabaseUserId = await getAuthenticatedUserId();
	if (!supabaseUserId) {
		return { status: "error", message: "Not authenticated." };
	}

	const date = getString(formData, "date");
	const name = getString(formData, "name") ?? "Workout";

	if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		return { status: "error", message: "Invalid date." };
	}

	const supabase = createAdminClient();

	const { error } = await supabase.from("workouts").insert({
		user_id: supabaseUserId,
		name,
		date,
		status: "planned",
	});

	if (error) {
		console.error("Error creating workout:", error);
		return { status: "error", message: "Failed to create workout." };
	}

	revalidatePath("/dashboard/workouts");
	return { status: "success", message: "Workout created." };
}

export async function addExerciseToWorkout(
	formData: FormData
): Promise<ActionResult> {
	const supabaseUserId = await getAuthenticatedUserId();
	if (!supabaseUserId) {
		return { status: "error", message: "Not authenticated." };
	}

	const workoutId = getString(formData, "workoutId");
	const exerciseId = getString(formData, "exerciseId");

	if (!workoutId || !exerciseId) {
		return {
			status: "error",
			message: "Workout ID and Exercise ID are required.",
		};
	}

	const supabase = createAdminClient();

	// Verify ownership
	const { data: workout } = await supabase
		.from("workouts")
		.select("id")
		.eq("id", workoutId)
		.eq("user_id", supabaseUserId)
		.maybeSingle();

	if (!workout) {
		return { status: "error", message: "Workout not found." };
	}

	// Get the next sort order
	const { data: existingExercises } = await supabase
		.from("workout_exercises")
		.select("sort_order")
		.eq("workout_id", workoutId)
		.order("sort_order", { ascending: false })
		.limit(1);

	const nextSortOrder =
		existingExercises && existingExercises.length > 0
			? (existingExercises[0].sort_order as number) + 1
			: 0;

	// Insert the workout exercise
	const { data: newWe, error: weError } = await supabase
		.from("workout_exercises")
		.insert({
			workout_id: workoutId,
			exercise_id: exerciseId,
			sort_order: nextSortOrder,
			is_completed: false,
		})
		.select("id")
		.single();

	if (weError) {
		console.error("Error adding exercise to workout:", weError);
		return {
			status: "error",
			message: "Failed to add exercise.",
		};
	}

	// Create one default working set
	const { error: setError } = await supabase.from("exercise_sets").insert({
		workout_exercise_id: newWe.id,
		set_number: 1,
		set_type: "working",
		is_completed: false,
	});

	if (setError) {
		console.error("Error creating default set:", setError);
		await deleteWorkoutExerciseById(newWe.id);
		return {
			status: "error",
			message: "Failed to add the default set for this exercise.",
		};
	}

	revalidatePath("/dashboard/workouts");
	return { status: "success", message: "Exercise added." };
}

export async function removeExerciseFromWorkout(
	formData: FormData
): Promise<ActionResult> {
	const supabaseUserId = await getAuthenticatedUserId();
	if (!supabaseUserId) {
		return { status: "error", message: "Not authenticated." };
	}

	const workoutExerciseId = getString(formData, "workoutExerciseId");

	if (!workoutExerciseId) {
		return {
			status: "error",
			message: "Workout exercise ID is required.",
		};
	}

	const supabase = createAdminClient();

	// Verify ownership via join
	const { data: we } = await supabase
		.from("workout_exercises")
		.select("id, workouts (user_id)")
		.eq("id", workoutExerciseId)
		.maybeSingle();

	if (!we) {
		return { status: "error", message: "Exercise not found." };
	}

	const workoutData = we.workouts as unknown as Record<string, unknown>;
	if (workoutData?.user_id !== supabaseUserId) {
		return { status: "error", message: "Not authorized." };
	}

	// CASCADE will delete exercise_sets
	const { error } = await supabase
		.from("workout_exercises")
		.delete()
		.eq("id", workoutExerciseId);

	if (error) {
		console.error("Error removing exercise:", error);
		return {
			status: "error",
			message: "Failed to remove exercise.",
		};
	}

	revalidatePath("/dashboard/workouts");
	return { status: "success", message: "Exercise removed." };
}

// ─── Sets ──────────────────────────────────────────────────

export async function upsertSet(
	formData: FormData
): Promise<ActionResult & { setId?: string }> {
	const supabaseUserId = await getAuthenticatedUserId();
	if (!supabaseUserId) {
		return { status: "error", message: "Not authenticated." };
	}

	const setId = getString(formData, "setId");
	const workoutExerciseId = getString(formData, "workoutExerciseId");
	const setNumber = getNumber(formData, "setNumber");
	const setType = getString(formData, "setType") ?? "working";
	const weight = getNumber(formData, "weight");
	const reps = getNumber(formData, "reps");
	const rpe = getNumber(formData, "rpe");
	const isCompletedRaw = getString(formData, "isCompleted");
	const isCompleted = isCompletedRaw === "true";

	if (!workoutExerciseId) {
		return {
			status: "error",
			message: "Workout exercise ID is required.",
		};
	}

	const supabase = createAdminClient();

	// Verify ownership via join
	const { data: we } = await supabase
		.from("workout_exercises")
		.select("id, workouts (user_id)")
		.eq("id", workoutExerciseId)
		.maybeSingle();

	if (!we) {
		return { status: "error", message: "Exercise not found." };
	}

	const workoutData = we.workouts as unknown as Record<string, unknown>;
	if (workoutData?.user_id !== supabaseUserId) {
		return { status: "error", message: "Not authorized." };
	}

	if (setId) {
		// Update existing set
		const { error } = await supabase
			.from("exercise_sets")
			.update({
				set_type: setType,
				weight,
				reps: reps !== null ? Math.round(reps) : null,
				rpe,
				is_completed: isCompleted,
			})
			.eq("id", setId)
			.eq("workout_exercise_id", workoutExerciseId);

		if (error) {
			console.error("Error updating set:", error);
			return { status: "error", message: "Failed to update set." };
		}

		revalidatePath("/dashboard/workouts");
		return {
			status: "success",
			message: "Set updated.",
			setId,
		};
	}

	// Create new set
	// Determine set number if not provided
	let newSetNumber = setNumber;
	if (newSetNumber === null) {
		const { data: existingSets } = await supabase
			.from("exercise_sets")
			.select("set_number")
			.eq("workout_exercise_id", workoutExerciseId)
			.order("set_number", { ascending: false })
			.limit(1);

		newSetNumber =
			existingSets && existingSets.length > 0
				? (existingSets[0].set_number as number) + 1
				: 1;
	}

	const { data: newSet, error } = await supabase
		.from("exercise_sets")
		.insert({
			workout_exercise_id: workoutExerciseId,
			set_number: newSetNumber,
			set_type: setType,
			weight,
			reps: reps !== null ? Math.round(reps) : null,
			rpe,
			is_completed: isCompleted,
		})
		.select("id")
		.single();

	if (error) {
		console.error("Error creating set:", error);
		return { status: "error", message: "Failed to create set." };
	}

	revalidatePath("/dashboard/workouts");
	return {
		status: "success",
		message: "Set added.",
		setId: newSet.id,
	};
}

export async function deleteSet(formData: FormData): Promise<ActionResult> {
	const supabaseUserId = await getAuthenticatedUserId();
	if (!supabaseUserId) {
		return { status: "error", message: "Not authenticated." };
	}

	const setId = getString(formData, "setId");
	if (!setId) {
		return { status: "error", message: "Set ID is required." };
	}

	const supabase = createAdminClient();

	// Verify ownership via nested join
	const { data: setData } = await supabase
		.from("exercise_sets")
		.select("id, workout_exercises (id, workouts (user_id))")
		.eq("id", setId)
		.maybeSingle();

	if (!setData) {
		return { status: "error", message: "Set not found." };
	}

	const weData = setData.workout_exercises as unknown as Record<
		string,
		unknown
	>;
	const workoutData = weData?.workouts as Record<string, unknown>;
	if (workoutData?.user_id !== supabaseUserId) {
		return { status: "error", message: "Not authorized." };
	}

	const { error } = await supabase
		.from("exercise_sets")
		.delete()
		.eq("id", setId);

	if (error) {
		console.error("Error deleting set:", error);
		return { status: "error", message: "Failed to delete set." };
	}

	revalidatePath("/dashboard/workouts");
	return { status: "success", message: "Set deleted." };
}

// ─── Workout Status ──────────────────────────────────────────────

export async function updateWorkoutStatus(
	formData: FormData
): Promise<ActionResult> {
	const supabaseUserId = await getAuthenticatedUserId();
	if (!supabaseUserId) {
		return { status: "error", message: "Not authenticated." };
	}

	const workoutId = getString(formData, "workoutId");
	const status = getString(formData, "status");

	if (!workoutId || !status) {
		return {
			status: "error",
			message: "Workout ID and status are required.",
		};
	}

	const validStatuses = ["planned", "in_progress", "completed", "skipped"];
	if (!validStatuses.includes(status)) {
		return { status: "error", message: "Invalid status." };
	}

	const supabase = createAdminClient();

	const updateData: Record<string, unknown> = {
		status,
		updated_at: new Date().toISOString(),
	};

	if (status === "in_progress") {
		updateData.started_at = new Date().toISOString();
	} else if (status === "completed") {
		updateData.completed_at = new Date().toISOString();

		// Calculate duration if started_at exists
		const { data: existing } = await supabase
			.from("workouts")
			.select("started_at")
			.eq("id", workoutId)
			.eq("user_id", supabaseUserId)
			.maybeSingle();

		if (existing?.started_at) {
			const startedAt = new Date(existing.started_at as string).getTime();
			const now = Date.now();
			const durationMinutes = Math.round((now - startedAt) / 60000);
			updateData.duration_minutes = durationMinutes;
		}
	}

	const { error } = await supabase
		.from("workouts")
		.update(updateData)
		.eq("id", workoutId)
		.eq("user_id", supabaseUserId);

	if (error) {
		console.error("Error updating workout status:", error);
		return {
			status: "error",
			message: "Failed to update status.",
		};
	}

	revalidatePath("/dashboard/workouts");
	return { status: "success", message: `Workout ${status}.` };
}

export async function deleteWorkout(formData: FormData): Promise<ActionResult> {
	const supabaseUserId = await getAuthenticatedUserId();
	if (!supabaseUserId) {
		return { status: "error", message: "Not authenticated." };
	}

	const workoutId = getString(formData, "workoutId");
	if (!workoutId) {
		return { status: "error", message: "Workout ID is required." };
	}

	const supabase = createAdminClient();

	// CASCADE will delete workout_exercises and exercise_sets
	const { error } = await supabase
		.from("workouts")
		.delete()
		.eq("id", workoutId)
		.eq("user_id", supabaseUserId);

	if (error) {
		console.error("Error deleting workout:", error);
		return {
			status: "error",
			message: "Failed to delete workout.",
		};
	}

	revalidatePath("/dashboard/workouts");
	return { status: "success", message: "Workout deleted." };
}

export async function toggleExerciseComplete(
	formData: FormData
): Promise<ActionResult> {
	const supabaseUserId = await getAuthenticatedUserId();
	if (!supabaseUserId) {
		return { status: "error", message: "Not authenticated." };
	}

	const workoutExerciseId = getString(formData, "workoutExerciseId");
	const isCompletedRaw = getString(formData, "isCompleted");

	if (!workoutExerciseId) {
		return {
			status: "error",
			message: "Workout exercise ID is required.",
		};
	}

	const isCompleted = isCompletedRaw === "true";

	const supabase = createAdminClient();

	// Verify ownership
	const { data: we } = await supabase
		.from("workout_exercises")
		.select("id, workouts (user_id)")
		.eq("id", workoutExerciseId)
		.maybeSingle();

	if (!we) {
		return { status: "error", message: "Exercise not found." };
	}

	const workoutData = we.workouts as unknown as Record<string, unknown>;
	if (workoutData?.user_id !== supabaseUserId) {
		return { status: "error", message: "Not authorized." };
	}

	const { error } = await supabase
		.from("workout_exercises")
		.update({ is_completed: isCompleted })
		.eq("id", workoutExerciseId);

	if (error) {
		console.error("Error toggling exercise complete:", error);
		return {
			status: "error",
			message: "Failed to toggle exercise.",
		};
	}

	// Also mark all sets as completed/uncompleted
	const { error: setsError } = await supabase
		.from("exercise_sets")
		.update({ is_completed: isCompleted })
		.eq("workout_exercise_id", workoutExerciseId);

	if (setsError) {
		console.error("Error toggling sets:", setsError);
	}

	revalidatePath("/dashboard/workouts");
	return { status: "success", message: "Exercise toggled." };
}

// ─── Custom Exercises ────────────────────────────────────────────

export async function createCustomExercise(
	formData: FormData
): Promise<ActionResult & { exerciseId?: string }> {
	const supabaseUserId = await getAuthenticatedUserId();
	if (!supabaseUserId) {
		return { status: "error", message: "Not authenticated." };
	}

	const name = getString(formData, "name");
	if (!name) {
		return { status: "error", message: "Exercise name is required." };
	}

	const muscleGroup = getString(formData, "muscleGroup");
	const equipment = getString(formData, "equipment");

	const supabase = createAdminClient();

	const { data, error } = await supabase
		.from("exercises")
		.insert({
			user_id: supabaseUserId,
			name,
			muscle_group: muscleGroup,
			equipment,
		})
		.select("id")
		.single();

	if (error) {
		console.error("Error creating custom exercise:", error);
		return {
			status: "error",
			message: "Failed to create exercise.",
		};
	}

	revalidatePath("/dashboard/workouts");
	return {
		status: "success",
		message: "Exercise created.",
		exerciseId: data.id,
	};
}
