"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { DEFAULT_STEP_GOAL, STEP_GOAL_COOKIE } from "@/lib/preferences";

export type SettingsActionState =
	| { status: "idle" }
	| { status: "success"; message: string; stepGoal: number }
	| { status: "error"; message: string };

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

	const cookieStore = await cookies();
	cookieStore.set(STEP_GOAL_COOKIE, String(parsedStepGoal), {
		httpOnly: true,
		path: "/",
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 365,
	});

	revalidatePath("/dashboard");
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
