import type {
	ChallengeStats,
	ChallengeWithTasks,
} from "@/lib/goals/goals.types";
import { ChallengeCard } from "./challenge-card";

type ActiveChallengesListProps = {
	challenges: (ChallengeWithTasks & { stats: ChallengeStats })[];
};

export function ActiveChallengesList({
	challenges,
}: ActiveChallengesListProps) {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
			{challenges.map((challenge) => (
				<ChallengeCard
					key={challenge.id}
					challenge={challenge}
					stats={challenge.stats}
				/>
			))}
		</div>
	);
}
