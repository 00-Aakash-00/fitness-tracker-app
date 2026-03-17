"use client";

import { History, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import type { ExerciseSet } from "@/lib/workouts/workouts.types";
import { formatDateDisplay, formatWeight } from "@/lib/workouts/workouts.utils";

type ExerciseHistoryEntry = {
	date: string;
	workoutName: string;
	sets: ExerciseSet[];
};

type ExerciseHistorySheetProps = {
	exerciseId: string;
	exerciseName: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function ExerciseHistorySheet({
	exerciseId,
	exerciseName,
	open,
	onOpenChange,
}: ExerciseHistorySheetProps) {
	const [history, setHistory] = useState<ExerciseHistoryEntry[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!open) return;

		setIsLoading(true);
		fetch(`/api/exercise-history?exerciseId=${exerciseId}`)
			.then((res) => res.json())
			.then((data) => {
				setHistory(data.history ?? []);
			})
			.catch(() => {
				setHistory([]);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [open, exerciseId]);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="flex w-full flex-col overflow-y-auto sm:max-w-sm"
			>
				<SheetHeader className="px-4 pt-6">
					<SheetTitle className="flex items-center gap-2">
						<History className="h-4 w-4 text-brand-cool" />
						{exerciseName}
					</SheetTitle>
					<SheetDescription>
						Recent workout history for this exercise.
					</SheetDescription>
				</SheetHeader>

				<div className="flex-1 px-4 py-3">
					{isLoading && (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-6 w-6 animate-spin text-brand-cool" />
						</div>
					)}

					{!isLoading && history.length === 0 && (
						<div className="py-12 text-center">
							<History className="mx-auto mb-2 h-8 w-8 text-secondary-text" />
							<p className="text-sm text-secondary-text">
								No history yet for this exercise.
							</p>
						</div>
					)}

					{!isLoading && history.length > 0 && (
						<div className="space-y-4">
							{history.map((entry, i) => (
								<div
									key={`${entry.date}-${i}`}
									className="rounded-lg border border-border p-3"
								>
									<div className="mb-2 flex items-center justify-between">
										<span className="text-xs font-semibold text-primary-text">
											{formatDateDisplay(entry.date)}
										</span>
										<span className="text-[10px] text-secondary-text">
											{entry.workoutName}
										</span>
									</div>
									<div className="space-y-0.5">
										{entry.sets.map((set) => (
											<div
												key={set.id}
												className="flex items-center gap-3 text-xs text-secondary-text"
											>
												<span className="w-4 font-mono">{set.setNumber}</span>
												<span className="font-mono">
													{formatWeight(set.weight)}
												</span>
												<span>x</span>
												<span className="font-mono">
													{set.reps ?? "--"} reps
												</span>
												{set.rpe !== null && (
													<span className="text-brand-warm">
														@RPE {set.rpe}
													</span>
												)}
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
