"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
	label: string;
	current: number;
	goal: number;
	unit?: string;
	colorClass?: string;
}

export function ProgressBar({
	label,
	current,
	goal,
	unit = "",
	colorClass,
}: ProgressBarProps) {
	const percentage = goal > 0 ? (current / goal) * 100 : 0;
	const clampedWidth = Math.min(percentage, 100);

	// Determine color based on percentage if no custom class
	const barColor =
		colorClass ??
		(percentage <= 100
			? "bg-brand-cool"
			: percentage <= 110
				? "bg-brand-soft"
				: "bg-brand-warm");

	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between text-sm">
				<span className="font-medium text-primary-text">{label}</span>
				<span className="text-secondary-text tabular-nums">
					{current.toLocaleString()}
					{unit ? ` ${unit}` : ""} / {goal.toLocaleString()}
					{unit ? ` ${unit}` : ""}
				</span>
			</div>
			<div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary-surface">
				<div
					className={cn(
						"h-full rounded-full transition-all duration-500 ease-out",
						barColor
					)}
					style={{ width: `${clampedWidth}%` }}
				/>
			</div>
			<p className="text-xs text-secondary-text tabular-nums">
				{Math.round(percentage)}% of daily goal
			</p>
		</div>
	);
}
