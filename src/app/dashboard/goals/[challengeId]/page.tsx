import { auth } from "@clerk/nextjs/server";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChallengeActions } from "@/components/goals/challenge-actions";
import { ChallengeCalendarGrid } from "@/components/goals/challenge-calendar-grid";
import { ChallengeStatsBar } from "@/components/goals/challenge-stats-bar";
import { DailyChecklist } from "@/components/goals/daily-checklist";
import { StreakDisplay } from "@/components/goals/streak-display";
import { Badge } from "@/components/ui/badge";
import { getChallengeDetail } from "@/lib/goals/goals.server";
import { getTodayInTimezone } from "@/lib/goals/goals.utils";
import { getSupabaseUserIdByClerkId } from "@/lib/integrations/oauth-connections.server";

type Props = {
	params: Promise<{ challengeId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { challengeId } = await params;
	const { userId } = await auth();
	if (!userId) return { title: "Challenge | FitnessTracker" };

	const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
	const detail = await getChallengeDetail(challengeId, supabaseUserId);

	return {
		title: detail
			? `${detail.name} | FitnessTracker`
			: "Challenge | FitnessTracker",
	};
}

const statusConfig: Record<
	string,
	{
		label: string;
		variant: "cool" | "warm" | "secondary" | "destructive" | "outline";
	}
> = {
	active: { label: "Active", variant: "cool" },
	paused: { label: "Paused", variant: "secondary" },
	completed: { label: "Completed", variant: "warm" },
	abandoned: { label: "Abandoned", variant: "destructive" },
};

export default async function ChallengeDetailPage({ params }: Props) {
	const { challengeId } = await params;
	const { userId } = await auth();
	if (!userId) notFound();

	const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
	const detail = await getChallengeDetail(challengeId, supabaseUserId);

	if (!detail) {
		notFound();
	}

	const today = getTodayInTimezone(detail.timezone);
	const config = statusConfig[detail.status] ?? {
		label: detail.status,
		variant: "outline" as const,
	};

	// Filter completions for today's checklist
	const todayCompletions = detail.completions.filter(
		(c) => c.completedDate === today
	);

	return (
		<div className="space-y-6">
			{/* Back link + title */}
			<div className="space-y-3">
				<Link
					href="/dashboard/goals"
					className="inline-flex items-center gap-1 font-secondary text-sm text-secondary-text hover:text-primary-text"
				>
					<ChevronLeft className="h-4 w-4" />
					Back to Goals
				</Link>
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<h1 className="font-primary text-2xl font-semibold text-primary-text">
							{detail.name}
						</h1>
						{detail.description && (
							<p className="mt-1 font-secondary text-sm text-secondary-text">
								{detail.description}
							</p>
						)}
					</div>
					<Badge variant={config.variant}>{config.label}</Badge>
				</div>
			</div>

			{/* Actions */}
			<ChallengeActions challengeId={detail.id} currentStatus={detail.status} />

			{/* Streak + Stats */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<StreakDisplay
					currentStreak={detail.stats.currentStreak}
					longestStreak={detail.stats.longestStreak}
				/>
				<ChallengeStatsBar stats={detail.stats} />
			</div>

			{/* Daily checklist (only for active/paused challenges) */}
			{(detail.status === "active" || detail.status === "paused") && (
				<div className="rounded-xl border border-border bg-primary-surface p-4 md:p-6">
					<DailyChecklist
						challengeId={detail.id}
						tasks={detail.tasks}
						completions={todayCompletions}
						date={today}
					/>
				</div>
			)}

			{/* Calendar grid */}
			<div className="rounded-xl border border-border bg-primary-surface p-4 md:p-6">
				<ChallengeCalendarGrid
					startDate={detail.startDate}
					duration={detail.duration}
					completions={detail.completions}
					taskCount={detail.tasks.length}
					timezone={detail.timezone}
				/>
			</div>
		</div>
	);
}
