import { ChevronRight, Flame } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
	ChallengeStats,
	ChallengeWithTasks,
} from "@/lib/goals/goals.types";
import { cn } from "@/lib/utils";

type ChallengeCardProps = {
	challenge: ChallengeWithTasks;
	stats: ChallengeStats;
};

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

export function ChallengeCard({ challenge, stats }: ChallengeCardProps) {
	const progress =
		challenge.duration > 0
			? Math.round((stats.daysElapsed / challenge.duration) * 100)
			: 0;
	const config = statusConfig[challenge.status] ?? {
		label: challenge.status,
		variant: "outline" as const,
	};

	return (
		<Link href={`/dashboard/goals/${challenge.id}`}>
			<Card className="group transition-shadow hover:shadow-md">
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between gap-2">
						<CardTitle className="line-clamp-1 text-base">
							{challenge.name}
						</CardTitle>
						<Badge variant={config.variant}>{config.label}</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-3">
					{/* Streak + task count */}
					<div className="flex items-center gap-4 font-secondary text-sm text-secondary-text">
						{stats.currentStreak > 0 && (
							<span className="flex items-center gap-1 text-brand-warm">
								<Flame className="h-3.5 w-3.5" />
								{stats.currentStreak}d streak
							</span>
						)}
						<span>
							{challenge.tasks.length}{" "}
							{challenge.tasks.length === 1 ? "task" : "tasks"}
						</span>
					</div>

					{/* Progress bar */}
					<div className="space-y-1">
						<div className="flex justify-between font-secondary text-xs text-secondary-text">
							<span>
								Day {stats.daysElapsed} of {challenge.duration}
							</span>
							<span>{progress}%</span>
						</div>
						<div className="h-2 w-full overflow-hidden rounded-full bg-secondary-surface">
							<div
								className={cn(
									"h-full rounded-full transition-all",
									challenge.status === "completed"
										? "bg-brand-warm"
										: "bg-brand-cool"
								)}
								style={{
									width: `${Math.min(progress, 100)}%`,
								}}
							/>
						</div>
					</div>

					{/* Completion rate */}
					<div className="flex items-center justify-between font-secondary text-xs text-secondary-text">
						<span>{stats.completionRate}% completion rate</span>
						<ChevronRight className="h-4 w-4 text-secondary-text transition-transform group-hover:translate-x-0.5" />
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
