"use client";

import { Check } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { toggleTaskCompletion } from "@/app/dashboard/goals/actions";
import type { ChallengeTask, DailyCompletion } from "@/lib/goals/goals.types";
import { cn } from "@/lib/utils";

type DailyChecklistProps = {
	challengeId: string;
	tasks: ChallengeTask[];
	completions: DailyCompletion[];
	date: string;
};

type OptimisticState = {
	completedTaskIds: Set<string>;
};

type ToggleOptimisticAction = {
	taskId: string;
	nextCompleted: boolean;
};

export function DailyChecklist({
	challengeId,
	tasks,
	completions,
	date,
}: DailyChecklistProps) {
	const initialCompletedIds = new Set(
		completions.filter((c) => c.completedDate === date).map((c) => c.taskId)
	);

	const [optimistic, addOptimistic] = useOptimistic<
		OptimisticState,
		ToggleOptimisticAction
	>(
		{ completedTaskIds: initialCompletedIds },
		(state, { taskId, nextCompleted }) => {
			const next = new Set(state.completedTaskIds);
			if (nextCompleted) {
				next.add(taskId);
			} else {
				next.delete(taskId);
			}
			return { completedTaskIds: next };
		}
	);

	const [, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const completedCount = optimistic.completedTaskIds.size;
	const totalCount = tasks.length;
	const allDone = completedCount === totalCount && totalCount > 0;

	function handleToggle(taskId: string, isCompleted: boolean) {
		const nextCompleted = !isCompleted;
		setError(null);

		startTransition(async () => {
			addOptimistic({ taskId, nextCompleted });

			const formData = new FormData();
			formData.set("challengeId", challengeId);
			formData.set("taskId", taskId);
			formData.set("completedDate", date);
			formData.set("isCompleted", String(isCompleted));

			const result = await toggleTaskCompletion(formData);
			if (result.status === "success") {
				return;
			}

			addOptimistic({ taskId, nextCompleted: isCompleted });
			setError(result.message);
		});
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h3 className="font-primary text-sm font-semibold text-primary-text">
					Today&apos;s Tasks
				</h3>
				<span
					className={cn(
						"font-secondary text-xs",
						allDone ? "text-brand-warm" : "text-secondary-text"
					)}
				>
					{completedCount}/{totalCount}
				</span>
			</div>
			{error ? <p className="text-sm text-red-500">{error}</p> : null}
			<div className="space-y-1.5">
				{tasks.map((task) => {
					const isCompleted = optimistic.completedTaskIds.has(task.id);
					return (
						<button
							key={task.id}
							type="button"
							onClick={() => handleToggle(task.id, isCompleted)}
							className={cn(
								"flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
								isCompleted
									? "border-brand-cool/30 bg-brand-cool/5"
									: "border-border bg-primary-surface hover:bg-secondary-surface"
							)}
						>
							<div
								className={cn(
									"flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
									isCompleted
										? "border-brand-cool bg-brand-cool"
										: "border-border bg-input-bg"
								)}
							>
								{isCompleted && <Check className="h-3 w-3 text-white" />}
							</div>
							<span
								className={cn(
									"font-secondary text-sm",
									isCompleted
										? "text-secondary-text line-through"
										: "text-primary-text"
								)}
							>
								{task.label}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
