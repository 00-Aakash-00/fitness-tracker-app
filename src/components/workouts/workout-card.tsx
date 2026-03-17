"use client";

import {
	CheckCircle,
	ChevronDown,
	ChevronUp,
	Play,
	Plus,
	Trash2,
} from "lucide-react";
import { useState, useTransition } from "react";
import {
	deleteWorkout,
	updateWorkoutStatus,
} from "@/app/dashboard/workouts/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WorkoutWithExercises } from "@/lib/workouts/workouts.types";
import { getStatusColor, getStatusLabel } from "@/lib/workouts/workouts.utils";
import { WorkoutExerciseRow } from "./workout-exercise-row";
import { WorkoutStatsSummary } from "./workout-stats-summary";

type WorkoutCardProps = {
	workout: WorkoutWithExercises;
	onAddExercise: (workoutId: string) => void;
};

export function WorkoutCard({ workout, onAddExercise }: WorkoutCardProps) {
	const [isExpanded, setIsExpanded] = useState(
		workout.status === "in_progress"
	);
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const handleStatusChange = (
		newStatus: "in_progress" | "completed" | "skipped"
	) => {
		setError(null);
		const fd = new FormData();
		fd.append("workoutId", workout.id);
		fd.append("status", newStatus);
		startTransition(async () => {
			const result = await updateWorkoutStatus(fd);
			if (result.status === "error") {
				setError(result.message);
			}
		});
	};

	const handleDelete = () => {
		setError(null);
		const fd = new FormData();
		fd.append("workoutId", workout.id);
		startTransition(async () => {
			const result = await deleteWorkout(fd);
			if (result.status === "error") {
				setError(result.message);
			}
		});
	};

	const borderColor = workout.color ?? "#1d83ab";

	return (
		<Card
			className="overflow-hidden"
			style={{ borderLeftColor: borderColor, borderLeftWidth: 3 }}
		>
			<CardHeader className="p-3 pb-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<CardTitle className="text-base">{workout.name}</CardTitle>
						<Badge
							className={cn("text-[10px]", getStatusColor(workout.status))}
						>
							{getStatusLabel(workout.status)}
						</Badge>
					</div>
					<div className="flex items-center gap-1">
						{workout.status === "planned" && (
							<Button
								variant="ghost"
								size="sm"
								className="h-7 text-xs text-brand-cool"
								onClick={() => handleStatusChange("in_progress")}
								disabled={isPending}
							>
								<Play className="mr-1 h-3 w-3" />
								Start
							</Button>
						)}
						{workout.status === "in_progress" && (
							<Button
								variant="ghost"
								size="sm"
								className="h-7 text-xs text-green-600"
								onClick={() => handleStatusChange("completed")}
								disabled={isPending}
							>
								<CheckCircle className="mr-1 h-3 w-3" />
								Complete
							</Button>
						)}
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 text-secondary-text hover:text-red-500"
							onClick={handleDelete}
							disabled={isPending}
						>
							<Trash2 className="h-3.5 w-3.5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 text-secondary-text"
							onClick={() => setIsExpanded(!isExpanded)}
						>
							{isExpanded ? (
								<ChevronUp className="h-4 w-4" />
							) : (
								<ChevronDown className="h-4 w-4" />
							)}
						</Button>
					</div>
				</div>

				{/* Summary stats */}
				{error ? <p className="text-sm text-red-500">{error}</p> : null}
				<WorkoutStatsSummary workout={workout} />
			</CardHeader>

			{isExpanded && (
				<CardContent className="space-y-2 px-3 pb-3 pt-0">
					{workout.exercises.map((we) => (
						<WorkoutExerciseRow
							key={`${we.id}:${we.isCompleted ? "1" : "0"}:${we.sets
								.map(
									(set) =>
										`${set.id}-${set.weight ?? ""}-${set.reps ?? ""}-${set.rpe ?? ""}-${set.isCompleted ? "1" : "0"}`
								)
								.join("|")}`}
							workoutExercise={we}
						/>
					))}

					<Button
						variant="outline"
						size="sm"
						className="w-full text-xs"
						onClick={() => onAddExercise(workout.id)}
						disabled={isPending}
					>
						<Plus className="mr-1 h-3 w-3" />
						Add Exercise
					</Button>
				</CardContent>
			)}
		</Card>
	);
}
