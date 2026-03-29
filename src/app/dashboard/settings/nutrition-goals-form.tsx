"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
	type NutritionGoalsActionState,
	updateNutritionGoalsAction,
} from "./actions";

const initialState: NutritionGoalsActionState = { status: "idle" };

interface NutritionGoalsFormProps {
	defaultCalories: number;
	defaultProtein: number;
}

export function NutritionGoalsForm({
	defaultCalories,
	defaultProtein,
}: NutritionGoalsFormProps) {
	const [state, formAction, isPending] = useActionState(
		updateNutritionGoalsAction,
		initialState
	);

	return (
		<form action={formAction} className="space-y-4">
			<div className="space-y-1.5">
				<label
					htmlFor="dailyCalories"
					className="text-sm font-medium text-primary-text"
				>
					Daily calorie goal
				</label>
				<p className="text-xs text-secondary-text">
					Target calories per day (500 - 10,000).
				</p>
				<Input
					id="dailyCalories"
					name="dailyCalories"
					type="number"
					inputMode="numeric"
					min={500}
					max={10000}
					step={50}
					defaultValue={defaultCalories}
				/>
			</div>

			<div className="space-y-1.5">
				<label
					htmlFor="dailyProtein"
					className="text-sm font-medium text-primary-text"
				>
					Daily protein goal (grams)
				</label>
				<p className="text-xs text-secondary-text">
					Target protein per day (10 - 500g).
				</p>
				<Input
					id="dailyProtein"
					name="dailyProtein"
					type="number"
					inputMode="numeric"
					min={10}
					max={500}
					step={5}
					defaultValue={defaultProtein}
				/>
			</div>

			{state.status !== "idle" && (
				<output
					className={cn(
						"text-sm",
						state.status === "success" ? "text-success-text" : "text-destructive-text"
					)}
				>
					{state.message}
				</output>
			)}

			<Button type="submit" disabled={isPending}>
				{isPending ? "Saving..." : "Save nutrition goals"}
			</Button>
		</form>
	);
}
