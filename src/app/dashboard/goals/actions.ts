"use server";

import { revalidatePath } from "next/cache";
import { isValidDateString } from "@/lib/date";
import type { AppSupabaseClient } from "@/lib/supabase";
import { getAuthenticatedSupabaseContext } from "@/lib/supabase-user.server";

export type GoalsActionResult = {
	status: "success" | "error";
	message: string;
	challengeId?: string;
};

function parseChallengeTasks(
	rawTasks: FormDataEntryValue | null
): string[] | null {
	if (typeof rawTasks !== "string") {
		return null;
	}

	try {
		const parsed = JSON.parse(rawTasks);
		if (!Array.isArray(parsed)) {
			return null;
		}

		const tasks = parsed
			.filter((task): task is string => typeof task === "string")
			.map((task) => task.trim())
			.filter((task) => task.length > 0);

		return tasks;
	} catch {
		return null;
	}
}

async function deleteChallengeById(
	supabase: AppSupabaseClient,
	challengeId: string
): Promise<void> {
	const { error } = await supabase
		.from("challenges")
		.delete()
		.eq("id", challengeId);

	if (error) {
		console.error("Error cleaning up partial challenge:", error);
	}
}

export async function createChallenge(
	formData: FormData
): Promise<GoalsActionResult> {
	const context = await getAuthenticatedSupabaseContext();
	if (!context) {
		return { status: "error", message: "Not authenticated." };
	}

	const rawName = formData.get("name");
	const rawDescription = formData.get("description");
	const rawStartDate = formData.get("startDate");
	const rawTimezone = formData.get("timezone");
	const rawTemplateId = formData.get("templateId");
	const name = typeof rawName === "string" ? rawName : "";
	const description = typeof rawDescription === "string" ? rawDescription : "";
	const duration = Number.parseInt(
		typeof formData.get("duration") === "string"
			? (formData.get("duration") as string)
			: "",
		10
	);
	const startDate = typeof rawStartDate === "string" ? rawStartDate : "";
	const timezone =
		(typeof rawTimezone === "string" ? rawTimezone : "") ||
		Intl.DateTimeFormat().resolvedOptions().timeZone;
	const templateId =
		typeof rawTemplateId === "string" && rawTemplateId.length > 0
			? rawTemplateId
			: null;
	const tasks = parseChallengeTasks(formData.get("tasks"));

	// Validation
	if (!name || name.trim().length === 0) {
		return { status: "error", message: "Challenge name is required." };
	}
	if (!Number.isFinite(duration) || duration < 1 || duration > 365) {
		return {
			status: "error",
			message: "Duration must be between 1 and 365 days.",
		};
	}
	if (!isValidDateString(startDate)) {
		return { status: "error", message: "A valid start date is required." };
	}
	if (!tasks || tasks.length === 0) {
		return {
			status: "error",
			message: "At least one valid task is required.",
		};
	}

	// Insert challenge
	const { data: challenge, error: challengeError } = await context.supabase
		.from("challenges")
		.insert({
			user_id: context.supabaseUserId,
			name: name.trim(),
			description: description.trim(),
			duration,
			start_date: startDate,
			timezone,
			status: "active",
			template_id: templateId,
		})
		.select("id")
		.single();

	if (challengeError) {
		console.error("Error creating challenge:", challengeError);
		return { status: "error", message: "Failed to create challenge." };
	}

	// Bulk insert tasks
	const taskInserts = tasks.map((label, index) => ({
		challenge_id: challenge.id,
		label,
		sort_order: index,
	}));

	const { error: taskError } = await context.supabase
		.from("challenge_tasks")
		.insert(taskInserts);

	if (taskError) {
		console.error("Error creating challenge tasks:", taskError);
		await deleteChallengeById(context.supabase, challenge.id);
		return {
			status: "error",
			message: "Failed to create challenge tasks.",
		};
	}

	revalidatePath("/dashboard/goals");
	return {
		status: "success",
		message: "Challenge created.",
		challengeId: challenge.id,
	};
}

export async function toggleTaskCompletion(
	formData: FormData
): Promise<GoalsActionResult> {
	const context = await getAuthenticatedSupabaseContext();
	if (!context) {
		return { status: "error", message: "Not authenticated." };
	}

	const challengeId = formData.get("challengeId") as string;
	const taskId = formData.get("taskId") as string;
	const completedDate = formData.get("completedDate") as string;
	const isCompleted = formData.get("isCompleted") === "true";

	if (!challengeId || !taskId || !completedDate) {
		return { status: "error", message: "Missing required fields." };
	}

	if (!isValidDateString(completedDate)) {
		return { status: "error", message: "Invalid completion date." };
	}

	// Verify the challenge belongs to the authenticated user
	const { data: challenge, error: challengeError } = await context.supabase
		.from("challenges")
		.select("id")
		.eq("id", challengeId)
		.eq("user_id", context.supabaseUserId)
		.maybeSingle();

	if (challengeError) {
		console.error("Error verifying challenge ownership:", challengeError);
		return { status: "error", message: "Failed to verify challenge." };
	}

	if (!challenge) {
		return { status: "error", message: "Challenge not found." };
	}

	const { data: task, error: taskError } = await context.supabase
		.from("challenge_tasks")
		.select("id")
		.eq("id", taskId)
		.eq("challenge_id", challengeId)
		.maybeSingle();

	if (taskError) {
		console.error("Error verifying challenge task:", taskError);
		return { status: "error", message: "Failed to verify challenge task." };
	}

	if (!task) {
		return {
			status: "error",
			message: "Task does not belong to this challenge.",
		};
	}

	if (isCompleted) {
		// Currently completed -> delete
		const { error } = await context.supabase
			.from("daily_completions")
			.delete()
			.eq("challenge_id", challengeId)
			.eq("task_id", taskId)
			.eq("completed_date", completedDate);

		if (error) {
			console.error("Error removing daily completion:", error);
			return { status: "error", message: "Failed to update completion." };
		}
	} else {
		// Not completed -> insert
		const { error } = await context.supabase.from("daily_completions").insert({
			challenge_id: challengeId,
			task_id: taskId,
			completed_date: completedDate,
		});

		if (error && error.code !== "23505") {
			console.error("Error creating daily completion:", error);
			return { status: "error", message: "Failed to update completion." };
		}
	}

	revalidatePath("/dashboard/goals");
	revalidatePath(`/dashboard/goals/${challengeId}`);
	return { status: "success", message: "Completion updated." };
}

export async function updateChallengeStatus(
	formData: FormData
): Promise<GoalsActionResult> {
	const context = await getAuthenticatedSupabaseContext();
	if (!context) {
		return { status: "error", message: "Not authenticated." };
	}

	const challengeId = formData.get("challengeId") as string;
	const status = formData.get("status") as string;

	if (!challengeId || !status) {
		return { status: "error", message: "Missing required fields." };
	}

	const validStatuses = ["active", "paused", "completed", "abandoned"] as const;
	if (!validStatuses.includes(status as (typeof validStatuses)[number])) {
		return { status: "error", message: "Invalid status." };
	}

	// Verify ownership
	const { data: challenge, error: verifyError } = await context.supabase
		.from("challenges")
		.select("id")
		.eq("id", challengeId)
		.eq("user_id", context.supabaseUserId)
		.maybeSingle();

	if (verifyError) {
		console.error("Error verifying challenge ownership:", verifyError);
		return { status: "error", message: "Failed to verify challenge." };
	}

	if (!challenge) {
		return { status: "error", message: "Challenge not found." };
	}

	const { error } = await context.supabase
		.from("challenges")
		.update({
			status: status as (typeof validStatuses)[number],
			updated_at: new Date().toISOString(),
		})
		.eq("id", challengeId);

	if (error) {
		console.error("Error updating challenge status:", error);
		return { status: "error", message: "Failed to update challenge." };
	}

	revalidatePath("/dashboard/goals");
	revalidatePath(`/dashboard/goals/${challengeId}`);
	return { status: "success", message: "Challenge updated." };
}

export async function deleteChallenge(
	formData: FormData
): Promise<GoalsActionResult> {
	const context = await getAuthenticatedSupabaseContext();
	if (!context) {
		return { status: "error", message: "Not authenticated." };
	}

	const challengeId = formData.get("challengeId") as string;

	if (!challengeId) {
		return { status: "error", message: "Missing challenge ID." };
	}

	// Verify ownership
	const { data: challenge, error: verifyError } = await context.supabase
		.from("challenges")
		.select("id")
		.eq("id", challengeId)
		.eq("user_id", context.supabaseUserId)
		.maybeSingle();

	if (verifyError) {
		console.error("Error verifying challenge ownership:", verifyError);
		return { status: "error", message: "Failed to verify challenge." };
	}

	if (!challenge) {
		return { status: "error", message: "Challenge not found." };
	}

	// Delete challenge (cascade will remove tasks and completions)
	const { error } = await context.supabase
		.from("challenges")
		.delete()
		.eq("id", challengeId);

	if (error) {
		console.error("Error deleting challenge:", error);
		return { status: "error", message: "Failed to delete challenge." };
	}

	revalidatePath("/dashboard/goals");
	return { status: "success", message: "Challenge deleted." };
}
