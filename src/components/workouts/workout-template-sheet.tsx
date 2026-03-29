"use client";

import { ChevronDown, ChevronUp, Plus, Search, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
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
	const isEditing = Boolean(template);
	const formKey = `${template?.id ?? "new"}:${open ? "open" : "closed"}`;

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

				<WorkoutTemplateForm
					key={formKey}
					template={template}
					exercises={exercises}
					onClose={() => onOpenChange(false)}
				/>
			</SheetContent>
		</Sheet>
	);
}

function WorkoutTemplateForm({
	template,
	exercises,
	onClose,
}: {
	template?: TemplateWithExercises;
	exercises: Exercise[];
	onClose: () => void;
}) {
	const isEditing = Boolean(template);
	const initialState = getInitialTemplateState(template);
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [name, setName] = useState(initialState.name);
	const [description, setDescription] = useState(initialState.description);
	const [color, setColor] = useState(initialState.color);
	const [templateExercises, setTemplateExercises] = useState<
		TemplateExerciseForm[]
	>(initialState.templateExercises);
	const [searchQuery, setSearchQuery] = useState("");
	const [showExercisePicker, setShowExercisePicker] = useState(false);

	const groupedExercises = groupExercisesByMuscle(exercises);

	const filteredGroups = Object.entries(groupedExercises).reduce(
		(acc, [group, exerciseList]) => {
			const filtered = exerciseList.filter((exercise) =>
				exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
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
		setTemplateExercises((prev) =>
			prev.filter((_, currentIndex) => currentIndex !== index)
		);
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
			prev.map((exercise, currentIndex) =>
				currentIndex === index ? { ...exercise, [field]: value } : exercise
			)
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
				templateExercises.map((exercise) => ({
					exerciseId: exercise.exerciseId,
					targetSets: exercise.targetSets,
					targetReps: exercise.targetReps,
					targetWeight: exercise.targetWeight,
					restSeconds: exercise.restSeconds,
				}))
			)
		);

		startTransition(async () => {
			const action = isEditing ? updateTemplate : createTemplate;
			const result = await action(fd);
			if (result.status === "success") {
				onClose();
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
				onClose();
				return;
			}

			setError(result.message);
		});
	};

	return (
		<>
			<div className="flex-1 space-y-4 px-4 py-4">
				<div>
					<span className="mb-1 block text-xs font-medium text-secondary-text">
						Template Name
					</span>
					<Input
						value={name}
						onChange={(event) => setName(event.target.value)}
						placeholder="e.g. Push Day, Upper Body"
					/>
				</div>

				<div>
					<span className="mb-1 block text-xs font-medium text-secondary-text">
						Description (optional)
					</span>
					<Input
						value={description}
						onChange={(event) => setDescription(event.target.value)}
						placeholder="Brief description"
					/>
				</div>

				<div>
					<span className="mb-1 block text-xs font-medium text-secondary-text">
						Color
					</span>
					<div className="flex gap-2">
						{PRESET_COLORS.map((presetColor) => (
							<button
								key={presetColor}
								type="button"
								onClick={() => setColor(presetColor)}
								className={cn(
									"h-7 w-7 rounded-full border-2 transition-all",
									color === presetColor
										? "scale-110 border-primary-text"
										: "border-transparent"
								)}
								style={{ backgroundColor: presetColor }}
							/>
						))}
					</div>
				</div>

				<div>
					<span className="mb-2 block text-xs font-medium text-secondary-text">
						Exercises ({templateExercises.length})
					</span>

					<div className="space-y-2">
						{templateExercises.map((exercise, index) => (
							<div
								key={`${exercise.exerciseId}-${index}`}
								className="rounded-lg border border-border bg-secondary-surface/30 p-2"
							>
								<div className="mb-2 flex items-center justify-between">
									<span className="text-sm font-medium text-primary-text">
										{exercise.exerciseName}
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
											className="h-6 w-6 text-secondary-text hover:text-destructive-text"
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
											value={exercise.targetSets}
											onChange={(event) => {
												const nextValue = Number.parseInt(
													event.target.value,
													10
												);
												if (!Number.isNaN(nextValue)) {
													handleUpdateExercise(index, "targetSets", nextValue);
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
											value={exercise.targetReps}
											onChange={(event) =>
												handleUpdateExercise(
													index,
													"targetReps",
													event.target.value
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
											value={exercise.targetWeight ?? ""}
											onChange={(event) => {
												const nextValue = event.target.value;
												handleUpdateExercise(
													index,
													"targetWeight",
													nextValue === "" ? null : Number(nextValue)
												);
											}}
											className="h-8 text-xs"
										/>
									</div>
								</div>
							</div>
						))}
					</div>

					{showExercisePicker ? (
						<div className="mt-2 rounded-lg border border-border bg-primary-surface p-2">
							<div className="relative mb-2">
								<Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-secondary-text" />
								<Input
									value={searchQuery}
									onChange={(event) => setSearchQuery(event.target.value)}
									placeholder="Search exercises..."
									className="h-8 pl-7 text-xs"
									autoFocus
								/>
							</div>
							<div className="max-h-48 overflow-y-auto">
								{Object.entries(filteredGroups).map(([group, exerciseList]) => (
									<div key={group}>
										<div className="px-1 py-1 text-[10px] font-semibold uppercase tracking-wider text-secondary-text">
											{group}
										</div>
										{exerciseList.map((exercise) => (
											<button
												key={exercise.id}
												type="button"
												onClick={() => handleAddExercise(exercise)}
												className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-primary-text hover:bg-secondary-surface"
											>
												<Plus className="h-3 w-3 text-brand-cool" />
												{exercise.name}
											</button>
										))}
									</div>
								))}
								{Object.keys(filteredGroups).length === 0 ? (
									<p className="px-2 py-2 text-xs text-secondary-text">
										No exercises match your search.
									</p>
								) : null}
							</div>
						</div>
					) : null}

					<Button
						variant="outline"
						size="sm"
						className="mt-2 w-full text-xs"
						onClick={() => setShowExercisePicker((current) => !current)}
					>
						<Plus className="mr-1 h-3 w-3" />
						{showExercisePicker ? "Hide Exercise Picker" : "Add Exercise"}
					</Button>
				</div>

				{error ? <p className="text-sm text-destructive-text">{error}</p> : null}
			</div>

			<SheetFooter className="gap-2 border-t border-border px-4 py-4 sm:flex-row sm:justify-between">
				<div>
					{isEditing ? (
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={isPending}
						>
							Delete Template
						</Button>
					) : null}
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={onClose} disabled={isPending}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={!name.trim() || isPending}>
						{isPending
							? isEditing
								? "Saving..."
								: "Creating..."
							: isEditing
								? "Save Template"
								: "Create Template"}
					</Button>
				</div>
			</SheetFooter>
		</>
	);
}
