"use client";

import { Loader2, Save, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteMeal, updateMeal } from "@/app/dashboard/nutrition/actions";
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
import type { Meal } from "@/lib/nutrition/utils";

interface EditMealSheetProps {
	meal: Meal | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function EditMealSheet({
	meal,
	open,
	onOpenChange,
}: EditMealSheetProps) {
	const formKey = `${meal?.id ?? "empty"}:${open ? "open" : "closed"}`;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex flex-col overflow-y-auto p-6">
				<SheetHeader>
					<SheetTitle>Edit Meal</SheetTitle>
					<SheetDescription>Update the details for this meal.</SheetDescription>
				</SheetHeader>

				{meal ? (
					<EditMealForm
						key={formKey}
						meal={meal}
						onClose={() => onOpenChange(false)}
					/>
				) : (
					<div className="mt-4 text-sm text-secondary-text">
						Choose a meal to edit.
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}

function EditMealForm({ meal, onClose }: { meal: Meal; onClose: () => void }) {
	const [name, setName] = useState(meal.name);
	const [calories, setCalories] = useState(String(meal.calories));
	const [protein, setProtein] = useState(String(meal.protein));
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const [isDeleting, setIsDeleting] = useState(false);

	const handleSave = () => {
		if (!name.trim()) return;

		setError(null);
		startTransition(async () => {
			const fd = new FormData();
			fd.set("mealId", meal.id);
			fd.set("name", name.trim());
			fd.set("calories", calories || "0");
			fd.set("protein", protein || "0");

			const result = await updateMeal(fd);
			if (result.status === "error") {
				setError(result.message);
			} else {
				onClose();
			}
		});
	};

	const handleDelete = () => {
		setError(null);
		setIsDeleting(true);
		startTransition(async () => {
			const fd = new FormData();
			fd.set("mealId", meal.id);

			const result = await deleteMeal(fd);
			setIsDeleting(false);
			if (result.status === "error") {
				setError(result.message);
			} else {
				onClose();
			}
		});
	};

	return (
		<>
			<div className="mt-4 flex flex-1 flex-col gap-4">
				<div className="space-y-1.5">
					<label
						htmlFor="edit-name"
						className="text-sm font-medium text-primary-text"
					>
						Meal name
					</label>
					<Input
						id="edit-name"
						placeholder="e.g. Chicken salad"
						value={name}
						onChange={(event) => setName(event.target.value)}
					/>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1.5">
						<label
							htmlFor="edit-calories"
							className="text-sm font-medium text-primary-text"
						>
							Calories
						</label>
						<Input
							id="edit-calories"
							type="number"
							inputMode="numeric"
							min={0}
							placeholder="0"
							value={calories}
							onChange={(event) => setCalories(event.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<label
							htmlFor="edit-protein"
							className="text-sm font-medium text-primary-text"
						>
							Protein (g)
						</label>
						<Input
							id="edit-protein"
							type="number"
							inputMode="numeric"
							min={0}
							placeholder="0"
							value={protein}
							onChange={(event) => setProtein(event.target.value)}
						/>
					</div>
				</div>

				{meal.rawInput ? (
					<div className="space-y-1.5">
						<p className="text-xs font-medium text-secondary-text">
							Original description
						</p>
						<p className="rounded-md bg-secondary-surface p-2 text-xs italic text-secondary-text">
							&ldquo;{meal.rawInput}&rdquo;
						</p>
					</div>
				) : null}
			</div>

			{error ? <p className="mt-2 text-sm text-destructive-text">{error}</p> : null}

			<SheetFooter className="mt-4 flex-col gap-2 sm:flex-col">
				<Button
					onClick={handleSave}
					disabled={!name.trim() || isPending}
					className="w-full"
				>
					{isPending && !isDeleting ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Saving...
						</>
					) : (
						<>
							<Save className="h-4 w-4" />
							Save Changes
						</>
					)}
				</Button>
				<Button
					variant="destructive"
					onClick={handleDelete}
					disabled={isPending}
					className="w-full"
				>
					{isDeleting ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Deleting...
						</>
					) : (
						<>
							<Trash2 className="h-4 w-4" />
							Delete Meal
						</>
					)}
				</Button>
			</SheetFooter>
		</>
	);
}
