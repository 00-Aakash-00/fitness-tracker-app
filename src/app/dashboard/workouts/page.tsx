import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { WorkoutsPageClient } from "@/components/workouts/workouts-page-client";
import { getDateParts, normalizeDateString } from "@/lib/date";
import { getSupabaseUserIdByClerkId } from "@/lib/integrations/oauth-connections.server";
import {
	getExercises,
	getUserTemplates,
	getWorkoutsForDate,
	getWorkoutsForMonth,
} from "@/lib/workouts/workouts.server";

export const metadata: Metadata = {
	title: "Workouts | FitnessTracker",
};

export default async function WorkoutsPage({
	searchParams,
}: PageProps<"/dashboard/workouts">) {
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

	const [monthWorkouts, dayWorkouts, templates, exercises] = await Promise.all([
		getWorkoutsForMonth(supabaseUserId, year, month),
		getWorkoutsForDate(supabaseUserId, dateStr),
		getUserTemplates(supabaseUserId),
		getExercises(supabaseUserId),
	]);

	return (
		<div className="space-y-4">
			<div className="space-y-1">
				<h1 className="font-primary text-2xl font-semibold text-primary-text">
					Workouts
				</h1>
				<p className="font-secondary text-sm text-secondary-text">
					Plan, track, and review your training sessions.
				</p>
			</div>

			<WorkoutsPageClient
				selectedDate={dateStr}
				year={year}
				month={month}
				monthWorkouts={monthWorkouts}
				dayWorkouts={dayWorkouts}
				templates={templates}
				exercises={exercises}
			/>
		</div>
	);
}
