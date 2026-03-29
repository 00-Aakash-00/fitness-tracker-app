"use client";

import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExerciseSet, SetType } from "@/lib/workouts/workouts.types";

type ExerciseSetRowProps = {
	set: ExerciseSet;
	onUpdate: (setId: string, data: Partial<ExerciseSet>) => void;
	onDelete: (setId: string) => void;
};

const setTypeLabels: Record<SetType, string> = {
	warmup: "W",
	working: "",
	dropset: "D",
	failure: "F",
};

const setTypeColors: Record<SetType, string> = {
	warmup: "text-brand-soft",
	working: "text-primary-text",
	dropset: "text-brand-warm",
	failure: "text-destructive-text",
};

export function ExerciseSetRow({
	set,
	onUpdate,
	onDelete,
}: ExerciseSetRowProps) {
	const typeLabel = setTypeLabels[set.setType];

	return (
		<div
			className={cn(
				"flex items-center gap-1.5 rounded-md px-2 py-1",
				set.isCompleted && "bg-success-surface"
			)}
		>
			{/* Set number */}
			<span
				className={cn(
					"w-6 shrink-0 text-center font-mono text-xs font-medium",
					setTypeColors[set.setType]
				)}
			>
				{typeLabel || set.setNumber}
			</span>

			{/* Weight input */}
			<div className="flex items-center gap-0.5">
				<input
					type="text"
					inputMode="decimal"
					placeholder="--"
					value={set.weight ?? ""}
					onChange={(e) => {
						const val = e.target.value;
						const num = val === "" ? null : Number(val);
						if (val !== "" && Number.isNaN(num)) return;
						onUpdate(set.id, { weight: num });
					}}
					className="h-7 w-14 rounded border border-border bg-input-bg px-1 text-center font-mono text-xs focus:outline-none focus:ring-1 focus:ring-brand-cool"
				/>
				<span className="text-[10px] text-secondary-text">lbs</span>
			</div>

			{/* Reps input */}
			<div className="flex items-center gap-0.5">
				<input
					type="text"
					inputMode="numeric"
					placeholder="--"
					value={set.reps ?? ""}
					onChange={(e) => {
						const val = e.target.value;
						const num = val === "" ? null : Number.parseInt(val, 10);
						if (val !== "" && Number.isNaN(num)) return;
						onUpdate(set.id, { reps: num });
					}}
					className="h-7 w-10 rounded border border-border bg-input-bg px-1 text-center font-mono text-xs focus:outline-none focus:ring-1 focus:ring-brand-cool"
				/>
				<span className="text-[10px] text-secondary-text">reps</span>
			</div>

			{/* RPE input (optional, smaller) */}
			<div className="hidden items-center gap-0.5 sm:flex">
				<input
					type="text"
					inputMode="decimal"
					placeholder="--"
					value={set.rpe ?? ""}
					onChange={(e) => {
						const val = e.target.value;
						const num = val === "" ? null : Number(val);
						if (val !== "" && Number.isNaN(num)) return;
						onUpdate(set.id, { rpe: num });
					}}
					className="h-7 w-9 rounded border border-border bg-input-bg px-1 text-center font-mono text-xs focus:outline-none focus:ring-1 focus:ring-brand-cool"
				/>
				<span className="text-[10px] text-secondary-text">RPE</span>
			</div>

			{/* Complete toggle */}
			<button
				type="button"
				onClick={() =>
					onUpdate(set.id, {
						isCompleted: !set.isCompleted,
					})
				}
				className={cn(
					"flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors",
					set.isCompleted
						? "border-success bg-success text-white"
						: "border-border text-transparent hover:border-success"
				)}
			>
				<Check className="h-3 w-3" />
			</button>

			{/* Delete */}
			<Button
				variant="ghost"
				size="icon"
				className="size-6 shrink-0 text-secondary-text hover:text-destructive-text"
				onClick={() => onDelete(set.id)}
			>
				<Trash2 className="h-3 w-3" />
			</Button>
		</div>
	);
}
