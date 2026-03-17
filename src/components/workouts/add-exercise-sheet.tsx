"use client";

import { Dumbbell, Plus, Search } from "lucide-react";
import { useState, useTransition } from "react";
import {
	addExerciseToWorkout,
	createCustomExercise,
} from "@/app/dashboard/workouts/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import type { Exercise } from "@/lib/workouts/workouts.types";
import { groupExercisesByMuscle } from "@/lib/workouts/workouts.utils";

type AddExerciseSheetProps = {
	workoutId: string;
	exercises: Exercise[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function AddExerciseSheet({
	workoutId,
	exercises,
	open,
	onOpenChange,
}: AddExerciseSheetProps) {
	const [isPending, startTransition] = useTransition();
	const [searchQuery, setSearchQuery] = useState("");
	const [showCreate, setShowCreate] = useState(false);
	const [newExerciseName, setNewExerciseName] = useState("");
	const [newMuscleGroup, setNewMuscleGroup] = useState("");
	const [newEquipment, setNewEquipment] = useState("");
	const [error, setError] = useState<string | null>(null);

	const groupedExercises = groupExercisesByMuscle(exercises);

	const filteredGroups = Object.entries(groupedExercises).reduce(
		(acc, [group, exList]) => {
			const filtered = exList.filter((ex) =>
				ex.name.toLowerCase().includes(searchQuery.toLowerCase())
			);
			if (filtered.length > 0) {
				acc[group] = filtered;
			}
			return acc;
		},
		{} as Record<string, Exercise[]>
	);

	const handleSelectExercise = (exerciseId: string) => {
		setError(null);
		const fd = new FormData();
		fd.append("workoutId", workoutId);
		fd.append("exerciseId", exerciseId);
		startTransition(async () => {
			const result = await addExerciseToWorkout(fd);
			if (result.status === "success") {
				onOpenChange(false);
				setSearchQuery("");
				setShowCreate(false);
				return;
			}

			setError(result.message);
		});
	};

	const handleCreateExercise = () => {
		if (!newExerciseName.trim()) return;

		setError(null);
		const fd = new FormData();
		fd.append("name", newExerciseName.trim());
		if (newMuscleGroup.trim()) {
			fd.append("muscleGroup", newMuscleGroup.trim());
		}
		if (newEquipment.trim()) {
			fd.append("equipment", newEquipment.trim());
		}

		startTransition(async () => {
			const result = await createCustomExercise(fd);
			if (result.status !== "success" || !result.exerciseId) {
				setError(result.message);
				return;
			}

			const addFd = new FormData();
			addFd.append("workoutId", workoutId);
			addFd.append("exerciseId", result.exerciseId);
			const addResult = await addExerciseToWorkout(addFd);
			if (addResult.status !== "success") {
				setError(addResult.message);
				return;
			}

			onOpenChange(false);
			setShowCreate(false);
			setNewExerciseName("");
			setNewMuscleGroup("");
			setNewEquipment("");
			setSearchQuery("");
		});
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="flex w-full flex-col overflow-y-auto sm:max-w-md"
			>
				<SheetHeader className="px-4 pt-6">
					<SheetTitle>Add Exercise</SheetTitle>
					<SheetDescription>
						Search for an exercise or create a custom one.
					</SheetDescription>
				</SheetHeader>

				<div className="flex-1 px-4 py-3">
					{/* Search */}
					<div className="relative mb-3">
						<Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-text" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search exercises..."
							className="pl-8"
							autoFocus
						/>
					</div>

					{/* Exercise list grouped by muscle */}
					<div className="max-h-[60vh] overflow-y-auto">
						{error ? (
							<p className="mb-3 text-sm text-red-500">{error}</p>
						) : null}
						{Object.entries(filteredGroups).map(([group, exList]) => (
							<div key={group} className="mb-3">
								<div className="sticky top-0 bg-primary-surface px-1 py-1 text-[11px] font-semibold uppercase tracking-wider text-secondary-text">
									{group}
								</div>
								{exList.map((ex) => (
									<button
										key={ex.id}
										type="button"
										onClick={() => handleSelectExercise(ex.id)}
										disabled={isPending}
										className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-primary-text transition-colors hover:bg-secondary-surface disabled:opacity-50"
									>
										<Dumbbell className="h-4 w-4 shrink-0 text-brand-cool" />
										<div className="flex-1">
											<span>{ex.name}</span>
											{ex.equipment && (
												<span className="ml-2 text-xs text-secondary-text">
													{ex.equipment}
												</span>
											)}
										</div>
										<Plus className="h-3.5 w-3.5 text-secondary-text" />
									</button>
								))}
							</div>
						))}

						{Object.keys(filteredGroups).length === 0 && (
							<div className="py-8 text-center">
								<p className="text-sm text-secondary-text">
									No exercises found.
								</p>
							</div>
						)}
					</div>

					{/* Create custom exercise */}
					<div className="mt-3 border-t border-border pt-3">
						{showCreate ? (
							<div className="space-y-2">
								<Input
									value={newExerciseName}
									onChange={(e) => setNewExerciseName(e.target.value)}
									placeholder="Exercise name"
									className="text-sm"
								/>
								<div className="grid grid-cols-2 gap-2">
									<Input
										value={newMuscleGroup}
										onChange={(e) => setNewMuscleGroup(e.target.value)}
										placeholder="Muscle group"
										className="text-sm"
									/>
									<Input
										value={newEquipment}
										onChange={(e) => setNewEquipment(e.target.value)}
										placeholder="Equipment"
										className="text-sm"
									/>
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										className="flex-1"
										onClick={() => setShowCreate(false)}
									>
										Cancel
									</Button>
									<Button
										size="sm"
										className="flex-1"
										onClick={handleCreateExercise}
										disabled={isPending || !newExerciseName.trim()}
									>
										Create & Add
									</Button>
								</div>
							</div>
						) : (
							<Button
								variant="outline"
								size="sm"
								className="w-full text-xs"
								onClick={() => setShowCreate(true)}
							>
								<Plus className="mr-1 h-3 w-3" />
								Create Custom Exercise
							</Button>
						)}
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
