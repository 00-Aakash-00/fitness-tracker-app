import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { NutritionDashboard } from "@/components/nutrition/nutrition-dashboard";
import { getDateParts, normalizeDateString } from "@/lib/date";
import { getSupabaseUserIdByClerkId } from "@/lib/integrations/oauth-connections.server";
import { getMealsForMonth, getNutritionGoals } from "./actions";

export const metadata: Metadata = {
	title: "Nutrition | FitnessTracker",
};

export default async function NutritionPage({
	searchParams,
}: PageProps<"/dashboard/nutrition">) {
	const { userId } = await auth();
	if (!userId) {
		return null;
	}

	const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
	const resolvedSearchParams = await searchParams;
	const dateParam = resolvedSearchParams.date;
	const dateStr = normalizeDateString(
		Array.isArray(dateParam) ? dateParam[0] : dateParam
	);
	const { year, month } = getDateParts(dateStr);

	const [goals, mealsMap] = await Promise.all([
		getNutritionGoals(supabaseUserId),
		getMealsForMonth(supabaseUserId, year, month),
	]);

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h1 className="font-primary text-2xl font-semibold text-primary-text">
					Nutrition
				</h1>
				<p className="font-secondary text-sm text-secondary-text">
					Track your meals and hit your daily goals.
				</p>
			</div>
			<NutritionDashboard
				initialMeals={mealsMap}
				initialDate={dateStr}
				goals={goals}
			/>
		</div>
	);
}
