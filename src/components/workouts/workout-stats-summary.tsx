"use client";

import { Clock, Dumbbell, Layers, Target } from "lucide-react";
import type { WorkoutWithExercises } from "@/lib/workouts/workouts.types";
import {
	calculateWorkoutSummary,
	formatDuration,
	formatVolume,
} from "@/lib/workouts/workouts.utils";

type WorkoutStatsSummaryProps = {
	workout: WorkoutWithExercises;
};

export function WorkoutStatsSummary({ workout }: WorkoutStatsSummaryProps) {
	const summary = calculateWorkoutSummary(workout.exercises);

	const stats = [
		{
			label: "Volume",
			value: `${formatVolume(summary.totalVolume)} lbs`,
			icon: Target,
		},
		{
			label: "Sets",
			value: String(summary.totalSets),
			icon: Layers,
		},
		{
			label: "Duration",
			value: formatDuration(workout.durationMinutes),
			icon: Clock,
		},
		{
			label: "Exercises",
			value: String(summary.exerciseCount),
			icon: Dumbbell,
		},
	];

	return (
		<div className="grid grid-cols-4 gap-2">
			{stats.map((stat) => (
				<div
					key={stat.label}
					className="flex flex-col items-center rounded-lg bg-secondary-surface/50 px-2 py-2"
				>
					<stat.icon className="mb-0.5 h-3.5 w-3.5 text-brand-cool" />
					<span className="font-mono text-xs font-semibold text-primary-text">
						{stat.value}
					</span>
					<span className="text-[10px] text-secondary-text">{stat.label}</span>
				</div>
			))}
		</div>
	);
}
