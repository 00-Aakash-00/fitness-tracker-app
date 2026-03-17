"use client";

import { ChevronDown, ChevronUp, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import {
	createTemplate,
	deleteTemplate,
	updateTemplate,
} from "@/app/dashboard/workouts/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type {
	Exercise,
	TemplateWithExercises,
} from "@/lib/workouts/workouts.types";
import { groupExercisesByMuscle } from "@/lib/workouts/workouts.utils";

type TemplateExerciseForm = {
	exerciseId: string;
	exerciseName: string;
	targetSets: number;
	targetReps: string;
	targetWeight: number | null;
	restSeconds: number | null;
};

type WorkoutTemplateSheetProps = {
	template?: TemplateWithExercises;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	exercises: Exercise[];
};

const PRESET_COLORS = [
	"#1d83ab",
	"#4651ba",
	"#d97d26",
	"#dfb255",
	"#22c55e",
	"#ef4444",
	"#8b5cf6",
	"#ec4899",
];

function getInitialTemplateState(template?: TemplateWithExercises) {
	return {
		name: template?.name ?? "",
		description: template?.description ?? "",
		color: template?.color ?? "#1d83ab",
		templateExercises:
			template?.exercises.map((exercise) => ({
				exerciseId: exercise.exerciseId,
				exerciseName: exercise.exercise.name,
				targetSets: exercise.targetSets ?? 3,
				targetReps: exercise.targetReps ?? "8-12",
				targetWeight: exercise.targetWeight,
				restSeconds: exercise.restSeconds,
			})) ?? [],
	};
}

export function WorkoutTemplateSheet({
	template,
	open,
	onOpenChange,
	exercises,
}: WorkoutTemplateSheetProps) {
	const isEditing = !!template;
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const [name, setName] = useState(getInitialTemplateState(template).name);
	const [description, setDescription] = useState(
		getInitialTemplateState(template).description
	);
	const [color, setColor] = useState(getInitialTemplateState(template).color);
	const [templateExercises, setTemplateExercises] = useState<
		TemplateExerciseForm[]
	>(getInitialTemplateState(template).templateExercises);

	const [searchQuery, setSearchQuery] = useState("");
	const [showExercisePicker, setShowExercisePicker] = useState(false);

	useEffect(() => {
		if (!open) {
			return;
		}

		const initialState = getInitialTemplateState(template);
		setName(initialState.name);
		setDescription(initialState.description);
		setColor(initialState.color);
		setTemplateExercises(initialState.templateExercises);
		setSearchQuery("");
		setShowExercisePicker(false);
		setError(null);
	}, [open, template]);

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

	const handleAddExercise = (exercise: Exercise) => {
		setError(null);
		setTemplateExercises((prev) => [
			...prev,
			{
				exerciseId: exercise.id,
				exerciseName: exercise.name,
				targetSets: 3,
				targetReps: "8-12",
				targetWeight: null,
				restSeconds: null,
			},
		]);
		setShowExercisePicker(false);
		setSearchQuery("");
	};

	const handleRemoveExercise = (index: number) => {
		setTemplateExercises((prev) => prev.filter((_, i) => i !== index));
	};

	const handleMoveExercise = (index: number, direction: "up" | "down") => {
		setTemplateExercises((prev) => {
			const next = [...prev];
			const swapIndex = direction === "up" ? index - 1 : index + 1;
			if (swapIndex < 0 || swapIndex >= next.length) return prev;
			[next[index], next[swapIndex]] = [next[swapIndex], next[index]];
			return next;
		});
	};

	const handleUpdateExercise = (
		index: number,
		field: keyof TemplateExerciseForm,
		value: string | number | null
	) => {
		setTemplateExercises((prev) =>
			prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
		);
	};

	const handleSave = () => {
		if (!name.trim()) return;

		setError(null);
		const fd = new FormData();
		if (isEditing && template) {
			fd.append("templateId", template.id);
		}
		fd.append("name", name.trim());
		fd.append("description", description.trim());
		fd.append("color", color);
		fd.append(
			"exercises",
			JSON.stringify(
				templateExercises.map((ex) => ({
					exerciseId: ex.exerciseId,
					targetSets: ex.targetSets,
					targetReps: ex.targetReps,
					targetWeight: ex.targetWeight,
					restSeconds: ex.restSeconds,
				}))
			)
		);

		startTransition(async () => {
			const action = isEditing ? updateTemplate : createTemplate;
			const result = await action(fd);
			if (result.status === "success") {
				onOpenChange(false);
				return;
			}

			setError(result.message);
		});
	};

	const handleDelete = () => {
		if (!template) return;
		setError(null);
		const fd = new FormData();
		fd.append("templateId", template.id);
		startTransition(async () => {
			const result = await deleteTemplate(fd);
			if (result.status === "success") {
				onOpenChange(false);
				return;
			}

			setError(result.message);
		});
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="flex w-full flex-col overflow-y-auto sm:max-w-lg"
			>
				<SheetHeader className="px-4 pt-6">
					<SheetTitle>
						{isEditing ? "Edit Template" : "New Workout Template"}
					</SheetTitle>
					<SheetDescription>
						{isEditing
							? "Update your workout template."
							: "Create a reusable workout template."}
					</SheetDescription>
				</SheetHeader>

				<div className="flex-1 space-y-4 px-4 py-4">
					{/* Name */}
					<div>
						<span className="mb-1 block text-xs font-medium text-secondary-text">
							Template Name
						</span>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Push Day, Upper Body"
						/>
					</div>

					{/* Description */}
					<div>
						<span className="mb-1 block text-xs font-medium text-secondary-text">
							Description (optional)
						</span>
						<Input
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Brief description"
						/>
					</div>

					{/* Color */}
					<div>
						<span className="mb-1 block text-xs font-medium text-secondary-text">
							Color
						</span>
						<div className="flex gap-2">
							{PRESET_COLORS.map((c) => (
								<button
									key={c}
									type="button"
									onClick={() => setColor(c)}
									className={cn(
										"h-7 w-7 rounded-full border-2 transition-all",
										color === c
											? "border-primary-text scale-110"
											: "border-transparent"
									)}
									style={{ backgroundColor: c }}
								/>
							))}
						</div>
					</div>

					{/* Template exercises */}
					<div>
						<span className="mb-2 block text-xs font-medium text-secondary-text">
							Exercises ({templateExercises.length})
						</span>

						<div className="space-y-2">
							{templateExercises.map((ex, index) => (
								<div
									key={`${ex.exerciseId}-${index}`}
									className="rounded-lg border border-border bg-secondary-surface/30 p-2"
								>
									<div className="mb-2 flex items-center justify-between">
										<span className="text-sm font-medium text-primary-text">
											{ex.exerciseName}
										</span>
										<div className="flex items-center gap-0.5">
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6"
												onClick={() => handleMoveExercise(index, "up")}
												disabled={index === 0}
											>
												<ChevronUp className="h-3 w-3" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6"
												onClick={() => handleMoveExercise(index, "down")}
												disabled={index === templateExercises.length - 1}
											>
												<ChevronDown className="h-3 w-3" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6 text-secondary-text hover:text-red-500"
												onClick={() => handleRemoveExercise(index)}
											>
												<Trash2 className="h-3 w-3" />
											</Button>
										</div>
									</div>

									<div className="grid grid-cols-3 gap-2">
										<div>
											<span className="text-[10px] text-secondary-text">
												Sets
											</span>
											<Input
												type="text"
												inputMode="numeric"
												value={ex.targetSets}
												onChange={(e) => {
													const num = Number.parseInt(e.target.value, 10);
													if (!Number.isNaN(num)) {
														handleUpdateExercise(index, "targetSets", num);
													}
												}}
												className="h-8 text-xs"
											/>
										</div>
										<div>
											<span className="text-[10px] text-secondary-text">
												Reps
											</span>
											<Input
												type="text"
												value={ex.targetReps}
												onChange={(e) =>
													handleUpdateExercise(
														index,
														"targetReps",
														e.target.value
													)
												}
												placeholder="8-12"
												className="h-8 text-xs"
											/>
										</div>
										<div>
											<span className="text-[10px] text-secondary-text">
												Weight (lbs)
											</span>
											<Input
												type="text"
												inputMode="decimal"
												value={ex.targetWeight ?? ""}
												onChange={(e) => {
													const val = e.target.value;
													handleUpdateExercise(
														index,
														"targetWeight",
														val === "" ? null : Number(val)
													);
												}}
												className="h-8 text-xs"
											/>
										</div>
									</div>
								</div>
							))}
						</div>

						{/* Exercise picker */}
						{showExercisePicker ? (
							<div className="mt-2 rounded-lg border border-border bg-primary-surface p-2">
								<div className="relative mb-2">
									<Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-secondary-text" />
									<Input
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										placeholder="Search exercises..."
										className="h-8 pl-7 text-xs"
										autoFocus
									/>
								</div>
								<div className="max-h-48 overflow-y-auto">
									{Object.entries(filteredGroups).map(([group, exList]) => (
										<div key={group}>
											<div className="px-1 py-1 text-[10px] font-semibold uppercase tracking-wider text-secondary-text">
												{group}
											</div>
											{exList.map((ex) => (
												<button
													key={ex.id}
													type="button"
													onClick={() => handleAddExercise(ex)}
													className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-primary-text hover:bg-secondary-surface"
												>
													<Plus className="h-3 w-3 text-brand-cool" />
													{ex.name}
												</button>
											))}
										</div>
									))}
									{Object.keys(filteredGroups).length === 0 && (
										<p className="px-2 py-2 text-xs text-secondary-text">
											No exercises found.
										</p>
									)}
								</div>
								<Button
									variant="ghost"
									size="sm"
									className="mt-1 w-full text-xs"
									onClick={() => {
										setShowExercisePicker(false);
										setSearchQuery("");
									}}
								>
									Cancel
								</Button>
							</div>
						) : (
							<Button
								variant="outline"
								size="sm"
								className="mt-2 w-full text-xs"
								onClick={() => setShowExercisePicker(true)}
							>
								<Plus className="mr-1 h-3 w-3" />
								Add Exercise
							</Button>
						)}
					</div>
				</div>
				{error ? <p className="px-4 text-sm text-red-500">{error}</p> : null}

				<SheetFooter className="gap-2 border-t border-border px-4 py-3">
					{isEditing && (
						<Button
							variant="destructive"
							size="sm"
							onClick={handleDelete}
							disabled={isPending}
						>
							Delete
						</Button>
					)}
					<div className="flex-1" />
					<Button
						variant="outline"
						size="sm"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						size="sm"
						onClick={handleSave}
						disabled={isPending || !name.trim()}
					>
						{isEditing ? "Save Changes" : "Create"}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
