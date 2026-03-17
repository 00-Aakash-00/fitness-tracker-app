"use client";

import { Pencil, Sparkles, Trash2, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Meal } from "@/lib/nutrition/utils";

interface MealCardProps {
	meal: Meal;
	onEdit: () => void;
	onDelete: () => void;
}

export function MealCard({ meal, onEdit, onDelete }: MealCardProps) {
	return (
		<div className="group flex items-start gap-3 rounded-lg border border-border bg-primary-surface p-3 transition-colors hover:bg-secondary-surface/50">
			<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-surface text-secondary-text">
				{meal.source === "ai" ? (
					<Sparkles className="h-4 w-4" />
				) : (
					<UtensilsCrossed className="h-4 w-4" />
				)}
			</div>

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<p className="font-medium text-sm text-primary-text truncate">
						{meal.name}
					</p>
					<Badge
						variant={meal.source === "ai" ? "cool" : "secondary"}
						className="shrink-0 text-[10px] px-1.5 py-0"
					>
						{meal.source === "ai" ? "AI" : "Manual"}
					</Badge>
				</div>
				<div className="mt-1 flex items-center gap-3 text-xs text-secondary-text">
					<span className="tabular-nums">
						{meal.calories.toLocaleString()} cal
					</span>
					<span className="text-border">|</span>
					<span className="tabular-nums">{meal.protein}g protein</span>
				</div>
			</div>

			<div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 text-secondary-text hover:text-primary-text"
					onClick={onEdit}
					aria-label={`Edit ${meal.name}`}
				>
					<Pencil className="h-3.5 w-3.5" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 text-secondary-text hover:text-red-500"
					onClick={onDelete}
					aria-label={`Delete ${meal.name}`}
				>
					<Trash2 className="h-3.5 w-3.5" />
				</Button>
			</div>
		</div>
	);
}
