import { Calendar, Flame, Percent, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ChallengeStats } from "@/lib/goals/goals.types";

type ChallengeStatsBarProps = {
	stats: ChallengeStats;
};

export function ChallengeStatsBar({ stats }: ChallengeStatsBarProps) {
	const items = [
		{
			icon: Percent,
			label: "Completion",
			value: `${stats.completionRate}%`,
		},
		{
			icon: Calendar,
			label: "Days Elapsed",
			value: String(stats.daysElapsed),
		},
		{
			icon: Timer,
			label: "Remaining",
			value: String(stats.daysRemaining),
		},
		{
			icon: Flame,
			label: "Streak",
			value: String(stats.currentStreak),
			highlight: stats.currentStreak > 0,
		},
	];

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
			{items.map((item) => (
				<Card key={item.label}>
					<CardContent className="flex flex-col items-center gap-1 p-3 text-center">
						<item.icon
							className={`h-4 w-4 ${
								item.highlight ? "text-brand-warm" : "text-secondary-text"
							}`}
						/>
						<span
							className={`font-primary text-xl font-bold ${
								item.highlight ? "text-brand-warm" : "text-primary-text"
							}`}
						>
							{item.value}
						</span>
						<span className="font-secondary text-xs text-secondary-text">
							{item.label}
						</span>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
