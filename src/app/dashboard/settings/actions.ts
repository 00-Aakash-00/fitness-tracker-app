"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { updateNutritionGoals } from "@/app/dashboard/nutrition/actions";
import { DEFAULT_STEP_GOAL, STEP_GOAL_COOKIE } from "@/lib/preferences";
import { refreshUserAppState } from "@/lib/progress/progress.server";
import { getAuthenticatedSupabaseContext } from "@/lib/supabase-user.server";
import {
	normalizeTimezone,
	upsertUserSettings,
	type WeeklySummaryDay,
} from "@/lib/user-settings.server";

export type SettingsActionState =
	| { status: "idle" }
	| { status: "success"; message: string; stepGoal: number }
	| { status: "error"; message: string };

function isChecked(formData: FormData, key: string) {
	return formData.get(key) === "on";
}

export async function updateSettings(
	_prevState: SettingsActionState,
	formData: FormData
): Promise<SettingsActionState> {
	const rawStepGoal = formData.get("stepGoal");
	const rawStepGoalString = typeof rawStepGoal === "string" ? rawStepGoal : "";
	const parsedStepGoal = Number.parseInt(rawStepGoalString, 10);

	if (!Number.isFinite(parsedStepGoal)) {
		return { status: "error", message: "Enter a valid number." };
	}

	if (parsedStepGoal < 1000 || parsedStepGoal > 200_000) {
		return {
			status: "error",
			message: "Step goal must be between 1,000 and 200,000.",
		};
	}

	const context = await getAuthenticatedSupabaseContext();
	if (!context) {
		return { status: "error", message: "Not authenticated." };
	}

	const rawTimezone = formData.get("timezone");
	const rawReminderTime = formData.get("reminderTime");
	const rawWeeklySummaryDay = formData.get("weeklySummaryDay");
	const rawTimezoneString =
		typeof rawTimezone === "string" ? rawTimezone : null;
	const timezone = normalizeTimezone(rawTimezoneString);

	if (rawTimezoneString?.trim() && !timezone) {
		return {
			status: "error",
			message: "Enter a valid IANA timezone, like America/Phoenix.",
		};
	}

	try {
		const settings = await upsertUserSettings({
			userId: context.supabaseUserId,
			timezone,
			reminderTime:
				typeof rawReminderTime === "string" ? rawReminderTime : undefined,
			weeklySummaryDay:
				typeof rawWeeklySummaryDay === "string"
					? (rawWeeklySummaryDay as WeeklySummaryDay)
					: undefined,
			notifications: {
				recovery: isChecked(formData, "notifyRecovery"),
				goals: isChecked(formData, "notifyGoals"),
				nutrition: isChecked(formData, "notifyNutrition"),
				summaries: isChecked(formData, "notifySummaries"),
				devices: isChecked(formData, "notifyDevices"),
			},
		});

		await refreshUserAppState({
			supabaseUserId: context.supabaseUserId,
			days: 90,
			timezoneOverride: settings.timezone,
		});
	} catch (error) {
		console.error("Error updating settings:", error);
		return { status: "error", message: "Failed to save settings." };
	}

	const cookieStore = await cookies();
	cookieStore.set(STEP_GOAL_COOKIE, String(parsedStepGoal), {
		httpOnly: true,
		path: "/",
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 365,
	});

	revalidatePath("/dashboard", "layout");
	revalidatePath("/dashboard");
	revalidatePath("/dashboard/progress");
	revalidatePath("/dashboard/settings");

	const message =
		parsedStepGoal === DEFAULT_STEP_GOAL
			? "Settings saved."
			: `Settings saved. Daily step goal set to ${parsedStepGoal.toLocaleString()}.`;

	return {
		status: "success",
		message,
		stepGoal: parsedStepGoal,
	};
}

export type NutritionGoalsActionState =
	| { status: "idle" }
	| { status: "success"; message: string }
	| { status: "error"; message: string };

export async function updateNutritionGoalsAction(
	_prevState: NutritionGoalsActionState,
	formData: FormData
): Promise<NutritionGoalsActionState> {
	const result = await updateNutritionGoals(formData);
	return result;
}
