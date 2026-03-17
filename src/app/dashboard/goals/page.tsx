import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { ActiveChallengesList } from "@/components/goals/active-challenges-list";
import { CreateChallengeSheet } from "@/components/goals/create-challenge-sheet";
import { EmptyState } from "@/components/goals/empty-state";
import {
	getCompletionsForChallenges,
	getUserChallenges,
} from "@/lib/goals/goals.server";
import type {
	ChallengeStats,
	ChallengeWithTasks,
} from "@/lib/goals/goals.types";
import { calculateStreaks } from "@/lib/goals/goals.utils";
import { getSupabaseUserIdByClerkId } from "@/lib/integrations/oauth-connections.server";

export const metadata: Metadata = {
	title: "Goals | FitnessTracker",
};

export default async function GoalsPage() {
	const { userId } = await auth();
	if (!userId) {
		return null;
	}

	const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
	const challenges = await getUserChallenges(supabaseUserId);

	// Fetch completions for all challenges to calculate stats
	const challengeIds = challenges.map((c) => c.id);
	const allCompletions = await getCompletionsForChallenges(challengeIds);

	// Group completions by challenge
	const completionsByChallengeId = new Map<string, typeof allCompletions>();
	for (const completion of allCompletions) {
		const existing = completionsByChallengeId.get(completion.challengeId) ?? [];
		existing.push(completion);
		completionsByChallengeId.set(completion.challengeId, existing);
	}

	// Calculate stats for each challenge
	const challengesWithStats: (ChallengeWithTasks & {
		stats: ChallengeStats;
	})[] = challenges.map((challenge) => {
		const completions = completionsByChallengeId.get(challenge.id) ?? [];
		const stats = calculateStreaks(
			completions,
			challenge.tasks.length,
			challenge.startDate,
			challenge.duration,
			challenge.timezone
		);
		return { ...challenge, stats };
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<h1 className="font-primary text-2xl font-semibold text-primary-text">
						Goals
					</h1>
					<p className="font-secondary text-sm text-secondary-text">
						Track your challenges and build streaks.
					</p>
				</div>
				<CreateChallengeSheet />
			</div>

			{challenges.length === 0 ? (
				<EmptyState />
			) : (
				<ActiveChallengesList challenges={challengesWithStats} />
			)}
		</div>
	);
}
