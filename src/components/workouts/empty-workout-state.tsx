"use client";

import { Dumbbell, LayoutTemplate, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyWorkoutStateProps = {
	onCreateTemplate: () => void;
	onStartWorkout: () => void;
};

export function EmptyWorkoutState({
	onCreateTemplate,
	onStartWorkout,
}: EmptyWorkoutStateProps) {
	return (
		<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-primary-surface p-8 text-center">
			<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-cool/10">
				<Dumbbell className="h-7 w-7 text-brand-cool" />
			</div>
			<h3 className="font-primary text-lg font-semibold text-primary-text">
				No workouts yet
			</h3>
			<p className="mt-1 max-w-xs font-secondary text-sm text-secondary-text">
				Create a workout template or start a blank workout for this day.
			</p>
			<div className="mt-5 flex flex-col gap-2 sm:flex-row">
				<Button variant="default" size="sm" onClick={onCreateTemplate}>
					<LayoutTemplate className="mr-1.5 h-4 w-4" />
					New Template
				</Button>
				<Button variant="outline" size="sm" onClick={onStartWorkout}>
					<Plus className="mr-1.5 h-4 w-4" />
					Empty Workout
				</Button>
			</div>
		</div>
	);
}
