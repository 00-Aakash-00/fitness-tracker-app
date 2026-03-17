"use client";

import { Loader2, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
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
	const [name, setName] = useState("");
	const [calories, setCalories] = useState("");
	const [protein, setProtein] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const [isDeleting, setIsDeleting] = useState(false);

	// Populate form when meal changes
	useEffect(() => {
		if (meal) {
			setName(meal.name);
			setCalories(String(meal.calories));
			setProtein(String(meal.protein));
			setError(null);
		}
	}, [meal]);

	const handleOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (!nextOpen) {
				setError(null);
			}
			onOpenChange(nextOpen);
		},
		[onOpenChange]
	);

	const handleSave = () => {
		if (!meal || !name.trim()) return;

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
				handleOpenChange(false);
			}
		});
	};

	const handleDelete = () => {
		if (!meal) return;

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
				handleOpenChange(false);
			}
		});
	};

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetContent className="flex flex-col overflow-y-auto p-6">
				<SheetHeader>
					<SheetTitle>Edit Meal</SheetTitle>
					<SheetDescription>Update the details for this meal.</SheetDescription>
				</SheetHeader>

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
							onChange={(e) => setName(e.target.value)}
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
								onChange={(e) => setCalories(e.target.value)}
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
								onChange={(e) => setProtein(e.target.value)}
							/>
						</div>
					</div>

					{meal?.rawInput && (
						<div className="space-y-1.5">
							<p className="text-xs font-medium text-secondary-text">
								Original description
							</p>
							<p className="rounded-md bg-secondary-surface p-2 text-xs text-secondary-text italic">
								"{meal.rawInput}"
							</p>
						</div>
					)}
				</div>

				{error && <p className="mt-2 text-sm text-red-500">{error}</p>}

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
			</SheetContent>
		</Sheet>
	);
}
