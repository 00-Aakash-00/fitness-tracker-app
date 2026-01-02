"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type SettingsActionState, updateSettings } from "./actions";

const initialState: SettingsActionState = { status: "idle" };

export function SettingsForm({ defaultStepGoal }: { defaultStepGoal: number }) {
	const [state, formAction, isPending] = useActionState(
		updateSettings,
		initialState
	);

	return (
		<form action={formAction} className="space-y-4">
			<div className="space-y-1.5">
				<label
					htmlFor="stepGoal"
					className="text-sm font-medium text-primary-text"
				>
					Daily step goal
				</label>
				<p className="text-xs text-secondary-text">
					Used to calculate progress across the dashboard.
				</p>
				<Input
					id="stepGoal"
					name="stepGoal"
					type="number"
					inputMode="numeric"
					min={1000}
					max={200000}
					step={100}
					defaultValue={defaultStepGoal}
				/>
			</div>

			{state.status !== "idle" && (
				<output
					className={cn(
						"text-sm",
						state.status === "success" ? "text-green-600" : "text-red-600"
					)}
				>
					{state.message}
				</output>
			)}

			<Button type="submit" disabled={isPending}>
				{isPending ? "Saving..." : "Save settings"}
			</Button>
		</form>
	);
}
