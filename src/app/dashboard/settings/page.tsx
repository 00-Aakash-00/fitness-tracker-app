import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseStepGoal, STEP_GOAL_COOKIE } from "@/lib/preferences";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = {
	title: "Settings | FitnessTracker",
};

export default async function SettingsPage() {
	const cookieStore = await cookies();
	const stepGoal = parseStepGoal(cookieStore.get(STEP_GOAL_COOKIE)?.value);

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
					<SettingsForm defaultStepGoal={stepGoal} />
				</CardContent>
			</Card>
		</div>
	);
}
