"use client";

import {
	Check,
	ChevronDown,
	ChevronUp,
	History,
	Plus,
	Trash2,
} from "lucide-react";
import { useState, useTransition } from "react";
import {
	removeExerciseFromWorkout,
	toggleExerciseComplete,
} from "@/app/dashboard/workouts/actions";
import { Button } from "@/components/ui/button";
import { useWorkoutForm } from "@/hooks/use-workout-form";
import { cn } from "@/lib/utils";
import type { WorkoutExercise } from "@/lib/workouts/workouts.types";
import { ExerciseHistorySheet } from "./exercise-history-sheet";
import { ExerciseSetRow } from "./exercise-set-row";

type WorkoutExerciseRowProps = {
	workoutExercise: WorkoutExercise;
	workoutId: string;
};

export function WorkoutExerciseRow({
	workoutExercise,
	// biome-ignore lint/correctness/noUnusedFunctionParameters: kept for prop interface consistency
	workoutId,
}: WorkoutExerciseRowProps) {
	const [isExpanded, setIsExpanded] = useState(true);
	const [historyOpen, setHistoryOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [actionError, setActionError] = useState<string | null>(null);
	const {
		sets,
		addSet,
		updateSet,
		removeSet,
		error: setError,
		clearError: clearSetError,
		isPending: isSetPending,
	} = useWorkoutForm({
		workoutExerciseId: workoutExercise.id,
		initialSets: workoutExercise.sets,
	});

	const handleToggleComplete = () => {
		setActionError(null);
		const fd = new FormData();
		fd.append("workoutExerciseId", workoutExercise.id);
		fd.append("isCompleted", String(!workoutExercise.isCompleted));
		startTransition(async () => {
			const result = await toggleExerciseComplete(fd);
			if (result.status === "error") {
				setActionError(result.message);
			}
		});
	};

	const handleRemoveExercise = () => {
		setActionError(null);
		const fd = new FormData();
		fd.append("workoutExerciseId", workoutExercise.id);
		startTransition(async () => {
			const result = await removeExerciseFromWorkout(fd);
			if (result.status === "error") {
				setActionError(result.message);
			}
		});
	};

	const completedSets = sets.filter((set) => set.isCompleted).length;
	const totalSets = sets.length;
	const errorMessage = setError ?? actionError;

	return (
		<div
			className={cn(
				"rounded-lg border border-border bg-primary-surface transition-colors",
				workoutExercise.isCompleted && "border-green-200"
			)}
		>
			{/* Header */}
			<div className="flex items-center gap-2 px-3 py-2">
				<button
					type="button"
					onClick={handleToggleComplete}
					className={cn(
						"flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
						workoutExercise.isCompleted
							? "border-green-500 bg-green-500 text-white"
							: "border-border text-transparent hover:border-green-400"
					)}
				>
					<Check className="h-3 w-3" />
				</button>

				<button
					type="button"
					onClick={() => setIsExpanded(!isExpanded)}
					className="flex flex-1 items-center gap-2 text-left"
				>
					<div className="flex-1">
						<span
							className={cn(
								"font-primary text-sm font-medium",
								workoutExercise.isCompleted
									? "text-green-700 line-through"
									: "text-primary-text"
							)}
						>
							{workoutExercise.exercise.name}
						</span>
						{workoutExercise.exercise.muscleGroup && (
							<span className="ml-2 text-[10px] text-secondary-text">
								{workoutExercise.exercise.muscleGroup}
							</span>
						)}
					</div>
					<span className="font-mono text-xs text-secondary-text">
						{completedSets}/{totalSets}
					</span>
					{isExpanded ? (
						<ChevronUp className="h-4 w-4 text-secondary-text" />
					) : (
						<ChevronDown className="h-4 w-4 text-secondary-text" />
					)}
				</button>

				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 text-secondary-text hover:text-brand-cool"
					onClick={() => setHistoryOpen(true)}
				>
					<History className="h-3.5 w-3.5" />
				</Button>

				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 text-secondary-text hover:text-red-500"
					onClick={handleRemoveExercise}
					disabled={isPending}
				>
					<Trash2 className="h-3.5 w-3.5" />
				</Button>
			</div>

			{errorMessage ? (
				<p className="border-t border-border px-3 py-2 text-sm text-red-500">
					{errorMessage}
				</p>
			) : null}

			{/* Sets list */}
			{isExpanded && (
				<div className="border-t border-border px-2 pb-2 pt-1">
					{/* Column headers */}
					<div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-secondary-text">
						<span className="w-6 text-center">Set</span>
						<span className="w-14 text-center">Weight</span>
						<span className="ml-2.5 w-10 text-center">Reps</span>
						<span className="ml-2.5 hidden w-9 text-center sm:block">RPE</span>
					</div>

					{sets.map((set) => (
						<ExerciseSetRow
							key={set.id}
							set={set}
							workoutExerciseId={workoutExercise.id}
							onUpdate={(setId, data) => {
								setActionError(null);
								clearSetError();
								updateSet(setId, data);
							}}
							onDelete={(setId) => {
								setActionError(null);
								clearSetError();
								removeSet(setId);
							}}
						/>
					))}

					<Button
						variant="ghost"
						size="sm"
						className="mt-1 w-full text-xs text-brand-cool hover:text-brand-deep"
						onClick={() => {
							setActionError(null);
							clearSetError();
							addSet();
						}}
						disabled={isPending || isSetPending}
					>
						<Plus className="mr-1 h-3 w-3" />
						Add Set
					</Button>
				</div>
			)}

			<ExerciseHistorySheet
				exerciseId={workoutExercise.exerciseId}
				exerciseName={workoutExercise.exercise.name}
				open={historyOpen}
				onOpenChange={setHistoryOpen}
			/>
		</div>
	);
}
