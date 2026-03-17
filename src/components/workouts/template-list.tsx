"use client";

import { Pencil, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { createWorkoutFromTemplate } from "@/app/dashboard/workouts/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TemplateWithExercises } from "@/lib/workouts/workouts.types";

type TemplateListProps = {
	templates: TemplateWithExercises[];
	selectedDate: string;
	onNewTemplate: () => void;
	onEditTemplate: (template: TemplateWithExercises) => void;
};

export function TemplateList({
	templates,
	selectedDate,
	onNewTemplate,
	onEditTemplate,
}: TemplateListProps) {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const handleUseTemplate = (templateId: string) => {
		setError(null);
		const fd = new FormData();
		fd.append("templateId", templateId);
		fd.append("date", selectedDate);
		startTransition(async () => {
			const result = await createWorkoutFromTemplate(fd);
			if (result.status === "error") {
				setError(result.message);
			}
		});
	};

	return (
		<div className="space-y-2">
			{error ? <p className="text-sm text-red-500">{error}</p> : null}
			<div className="flex gap-2 overflow-x-auto pb-1">
				{templates.map((t) => (
					<div key={t.id} className="group flex shrink-0 items-center gap-1.5">
						<button
							type="button"
							onClick={() => handleUseTemplate(t.id)}
							disabled={isPending}
							className={cn(
								"flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
								"border-border bg-primary-surface text-primary-text hover:bg-secondary-surface",
								"disabled:opacity-50"
							)}
							style={{
								borderLeftColor: t.color ?? undefined,
								borderLeftWidth: 3,
							}}
						>
							<span>{t.name}</span>
							<span className="text-secondary-text">
								({t.exercises.length})
							</span>
						</button>
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
							onClick={() => onEditTemplate(t)}
						>
							<Pencil className="h-3 w-3" />
						</Button>
					</div>
				))}
				<Button
					variant="outline"
					size="sm"
					className="shrink-0 rounded-full text-xs"
					onClick={onNewTemplate}
				>
					<Plus className="mr-1 h-3 w-3" />
					Template
				</Button>
			</div>
		</div>
	);
}
