import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getNutritionGoals } from "@/app/dashboard/nutrition/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseUserIdByClerkId } from "@/lib/integrations/oauth-connections.server";
import { parseStepGoal, STEP_GOAL_COOKIE } from "@/lib/preferences";
import {
	DEFAULT_USER_SETTINGS,
	getUserSettings,
} from "@/lib/user-settings.server";
import { NutritionGoalsForm } from "./nutrition-goals-form";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = {
	title: "Settings | FitnessTracker",
};

export default async function SettingsPage() {
	const cookieStore = await cookies();
	const stepGoal = parseStepGoal(cookieStore.get(STEP_GOAL_COOKIE)?.value);

	const { userId } = await auth();
	let nutritionGoals = { dailyCalories: 2000, dailyProtein: 150 };
	let userSettings = DEFAULT_USER_SETTINGS;

	if (userId) {
		try {
			const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
			const [resolvedNutritionGoals, resolvedUserSettings] = await Promise.all([
				getNutritionGoals(supabaseUserId),
				getUserSettings(supabaseUserId),
			]);
			nutritionGoals = resolvedNutritionGoals;
			userSettings = resolvedUserSettings;
		} catch (err) {
			console.error("Error fetching dashboard settings:", err);
		}
	}

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h1 className="font-primary text-2xl font-semibold text-primary-text">
					Settings
				</h1>
				<p className="font-secondary text-sm text-secondary-text">
					Manage your preferences.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Goals</CardTitle>
				</CardHeader>
				<CardContent>
					<SettingsForm
						defaultStepGoal={stepGoal}
						defaultSettings={userSettings}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Nutrition Goals</CardTitle>
				</CardHeader>
				<CardContent>
					<NutritionGoalsForm
						defaultCalories={nutritionGoals.dailyCalories}
						defaultProtein={nutritionGoals.dailyProtein}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
