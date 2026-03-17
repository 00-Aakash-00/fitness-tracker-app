import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProgressDashboard } from "@/components/progress/progress-dashboard";
import { getSupabaseUserIdByClerkId } from "@/lib/integrations/oauth-connections.server";
import { parseStepGoal, STEP_GOAL_COOKIE } from "@/lib/preferences";
import { getProgressSnapshot } from "@/lib/progress/progress.server";
import type { ProgressRange } from "@/lib/progress/progress.types";

export const metadata: Metadata = {
	title: "Progress | FitnessTracker",
};

function parseRange(value: string | string[] | undefined): ProgressRange {
	const raw = Array.isArray(value) ? value[0] : value;
	return raw === "30" ? 30 : raw === "90" ? 90 : 7;
}

export default async function ProgressPage({
	searchParams,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
	const [{ userId }, cookieStore, resolvedSearchParams] = await Promise.all([
		auth(),
		cookies(),
		(searchParams ?? Promise.resolve({})) as Promise<
			Record<string, string | string[] | undefined>
		>,
	]);

	if (!userId) {
		redirect("/sign-in");
	}

	const stepGoal = parseStepGoal(cookieStore.get(STEP_GOAL_COOKIE)?.value);
	const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
	const rangeDays = parseRange(resolvedSearchParams.range);
	const snapshot = await getProgressSnapshot({
		supabaseUserId,
		rangeDays,
		stepGoal,
	});

	return <ProgressDashboard snapshot={snapshot} />;
}
