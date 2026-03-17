"use client";

import { Plus, UtensilsCrossed } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import { deleteMeal } from "@/app/dashboard/nutrition/actions";
import { AddMealSheet } from "@/components/nutrition/add-meal-sheet";
import { EditMealSheet } from "@/components/nutrition/edit-meal-sheet";
import { MealCard } from "@/components/nutrition/meal-card";
import { ProgressBar } from "@/components/nutrition/progress-bar";
import { Button } from "@/components/ui/button";
import type { Meal, NutritionGoals } from "@/lib/nutrition/utils";

interface DailyDetailProps {
	date: string;
	meals: Meal[];
	goals: NutritionGoals;
}

export function DailyDetail({ date, meals, goals }: DailyDetailProps) {
	const [addOpen, setAddOpen] = useState(false);
	const [editMeal, setEditMeal] = useState<Meal | null>(null);
	const [editOpen, setEditOpen] = useState(false);
	const [, startTransition] = useTransition();

	const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
	const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);

	const displayDate = new Date(`${date}T12:00:00`);
	const formattedDate = displayDate.toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric",
	});

	const handleEdit = useCallback((meal: Meal) => {
		setEditMeal(meal);
		setEditOpen(true);
	}, []);

	const handleDelete = useCallback((meal: Meal) => {
		startTransition(async () => {
			const fd = new FormData();
			fd.set("mealId", meal.id);
			await deleteMeal(fd);
		});
	}, []);

	return (
		<div className="space-y-5">
			{/* Date heading + Add button */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-primary text-lg font-semibold text-primary-text">
						{formattedDate}
					</h2>
					<p className="text-xs text-secondary-text">
						{meals.length} meal{meals.length !== 1 ? "s" : ""} logged
					</p>
				</div>
				<Button size="sm" onClick={() => setAddOpen(true)}>
					<Plus className="h-4 w-4" />
					Add Meal
				</Button>
			</div>

			{/* Progress bars */}
			<div className="space-y-4 rounded-lg border border-border bg-primary-surface p-4">
				<ProgressBar
					label="Calories"
					current={totalCalories}
					goal={goals.dailyCalories}
					unit="cal"
				/>
				<ProgressBar
					label="Protein"
					current={totalProtein}
					goal={goals.dailyProtein}
					unit="g"
				/>
			</div>

			{/* Meals list */}
			{meals.length > 0 ? (
				<div className="space-y-2">
					{meals.map((meal) => (
						<MealCard
							key={meal.id}
							meal={meal}
							onEdit={() => handleEdit(meal)}
							onDelete={() => handleDelete(meal)}
						/>
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
					<UtensilsCrossed className="h-10 w-10 text-secondary-text/50" />
					<p className="mt-3 font-medium text-primary-text">No meals logged</p>
					<p className="mt-1 text-sm text-secondary-text">
						Start tracking your nutrition by adding a meal.
					</p>
					<Button
						size="sm"
						variant="outline"
						className="mt-4"
						onClick={() => setAddOpen(true)}
					>
						<Plus className="h-4 w-4" />
						Add your first meal
					</Button>
				</div>
			)}

			{/* Sheets */}
			<AddMealSheet
				selectedDate={date}
				open={addOpen}
				onOpenChange={setAddOpen}
			/>
			<EditMealSheet
				meal={editMeal}
				open={editOpen}
				onOpenChange={setEditOpen}
			/>
		</div>
	);
}
