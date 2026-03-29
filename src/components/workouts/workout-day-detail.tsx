"use client";

import { Dumbbell, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { createEmptyWorkout } from "@/app/dashboard/workouts/actions";
import { Button } from "@/components/ui/button";
import type {
	Exercise,
	TemplateWithExercises,
	WorkoutWithExercises,
} from "@/lib/workouts/workouts.types";
import { formatDateDisplay } from "@/lib/workouts/workouts.utils";
import { AddExerciseSheet } from "./add-exercise-sheet";
import { EmptyWorkoutState } from "./empty-workout-state";
import { TemplateList } from "./template-list";
import { WorkoutCard } from "./workout-card";
import { WorkoutTemplateSheet } from "./workout-template-sheet";

type WorkoutDayDetailProps = {
	date: string;
	workouts: WorkoutWithExercises[];
	templates: TemplateWithExercises[];
	exercises: Exercise[];
};

export function WorkoutDayDetail({
	date,
	workouts,
	templates,
	exercises,
}: WorkoutDayDetailProps) {
	const [isPending, startTransition] = useTransition();
	const [templateSheetOpen, setTemplateSheetOpen] = useState(false);
	const [editingTemplate, setEditingTemplate] = useState<
		TemplateWithExercises | undefined
	>(undefined);
	const [addExerciseWorkoutId, setAddExerciseWorkoutId] = useState<
		string | null
	>(null);
	const [error, setError] = useState<string | null>(null);

	const handleStartEmptyWorkout = () => {
		setError(null);
		const fd = new FormData();
		fd.append("date", date);
		fd.append("name", "Workout");
		startTransition(async () => {
			const result = await createEmptyWorkout(fd);
			if (result.status === "error") {
				setError(result.message);
			}
		});
	};

	const handleNewTemplate = () => {
		setError(null);
		setEditingTemplate(undefined);
		setTemplateSheetOpen(true);
	};

	const handleEditTemplate = (template: TemplateWithExercises) => {
		setError(null);
		setEditingTemplate(template);
		setTemplateSheetOpen(true);
	};

	return (
		<div className="space-y-4">
			{/* Date heading */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Dumbbell className="h-5 w-5 text-brand-cool" />
					<h2 className="font-primary text-lg font-semibold text-primary-text">
						{formatDateDisplay(date)}
					</h2>
				</div>
				{workouts.length > 0 && (
					<Button
						variant="outline"
						size="sm"
						className="text-xs"
						onClick={handleStartEmptyWorkout}
						disabled={isPending}
					>
						<Plus className="mr-1 h-3 w-3" />
						Add Workout
					</Button>
				)}
			</div>

			{/* Template chips */}
			{error ? <p className="text-sm text-destructive-text">{error}</p> : null}
			{templates.length > 0 && (
				<TemplateList
					templates={templates}
					selectedDate={date}
					onNewTemplate={handleNewTemplate}
					onEditTemplate={handleEditTemplate}
				/>
			)}

			{/* Workouts list */}
			{workouts.length === 0 ? (
				<EmptyWorkoutState
					onCreateTemplate={handleNewTemplate}
					onStartWorkout={handleStartEmptyWorkout}
				/>
			) : (
				<div className="space-y-3">
					{workouts.map((w) => (
						<WorkoutCard
							key={w.id}
							workout={w}
							onAddExercise={(wId) => setAddExerciseWorkoutId(wId)}
						/>
					))}
				</div>
			)}

			{/* Template sheet */}
			<WorkoutTemplateSheet
				template={editingTemplate}
				open={templateSheetOpen}
				onOpenChange={(open) => {
					setTemplateSheetOpen(open);
					if (!open) setEditingTemplate(undefined);
				}}
				exercises={exercises}
			/>

			{/* Add exercise sheet */}
			{addExerciseWorkoutId && (
				<AddExerciseSheet
					workoutId={addExerciseWorkoutId}
					exercises={exercises}
					open={!!addExerciseWorkoutId}
					onOpenChange={(open) => {
						if (!open) setAddExerciseWorkoutId(null);
					}}
				/>
			)}
		</div>
	);
}
