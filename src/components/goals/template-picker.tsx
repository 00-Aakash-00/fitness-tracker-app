"use client";

import { Brain, Dumbbell, Flame, type LucideIcon, Pencil } from "lucide-react";
import type { GoalTemplate } from "@/data/goal-templates";
import { goalTemplates } from "@/data/goal-templates";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
	Flame,
	Dumbbell,
	Brain,
	Pencil,
};

type TemplatePickerProps = {
	onSelect: (template: GoalTemplate) => void;
};

export function TemplatePicker({ onSelect }: TemplatePickerProps) {
	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
			{goalTemplates.map((template) => {
				const Icon = iconMap[template.icon] ?? Flame;
				return (
					<button
						key={template.id}
						type="button"
						onClick={() => onSelect(template)}
						className={cn(
							"flex flex-col items-start gap-2 rounded-lg border border-border bg-primary-surface p-4 text-left transition-all",
							"hover:border-brand-cool hover:shadow-sm",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cool focus-visible:ring-offset-2"
						)}
					>
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-cool/10">
							<Icon className="h-4.5 w-4.5 text-brand-cool" />
						</div>
						<div>
							<p className="font-primary text-sm font-semibold text-primary-text">
								{template.name}
							</p>
							<p className="mt-0.5 font-secondary text-xs text-secondary-text">
								{template.description}
							</p>
						</div>
						<div className="flex gap-2 font-secondary text-xs text-secondary-text">
							<span>{template.duration} days</span>
							{template.tasks.length > 0 && (
								<>
									<span aria-hidden="true">&middot;</span>
									<span>{template.tasks.length} tasks</span>
								</>
							)}
						</div>
					</button>
				);
			})}
		</div>
	);
}
