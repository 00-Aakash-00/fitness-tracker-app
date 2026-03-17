import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

type StreakDisplayProps = {
	currentStreak: number;
	longestStreak: number;
	className?: string;
};

export function StreakDisplay({
	currentStreak,
	longestStreak,
	className,
}: StreakDisplayProps) {
	return (
		<div
			className={cn(
				"flex items-center gap-4 rounded-xl border border-border bg-primary-surface p-4 md:p-6",
				className
			)}
		>
			<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-warm/10">
				<Flame
					className={cn(
						"h-7 w-7",
						currentStreak > 0 ? "text-brand-warm" : "text-secondary-text"
					)}
				/>
			</div>
			<div className="min-w-0">
				<div className="flex items-baseline gap-1.5">
					<span className="font-primary text-3xl font-bold text-brand-warm">
						{currentStreak}
					</span>
					<span className="font-secondary text-sm text-secondary-text">
						{currentStreak === 1 ? "day" : "days"}
					</span>
				</div>
				<p className="font-secondary text-sm text-secondary-text">
					Current Streak
				</p>
				<p className="font-secondary text-xs text-secondary-text/70">
					Best: {longestStreak} {longestStreak === 1 ? "day" : "days"}
				</p>
			</div>
		</div>
	);
}
