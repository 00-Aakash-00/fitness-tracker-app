"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserSettings } from "@/lib/user-settings.server";
import { cn } from "@/lib/utils";
import { type SettingsActionState, updateSettings } from "./actions";

const initialState: SettingsActionState = { status: "idle" };
const weeklySummaryDays = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
] as const;

export function SettingsForm({
	defaultStepGoal,
	defaultSettings,
}: {
	defaultStepGoal: number;
	defaultSettings: UserSettings;
}) {
	const [state, formAction, isPending] = useActionState(
		updateSettings,
		initialState
	);

	return (
		<form action={formAction} className="space-y-6">
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-1.5">
					<label
						htmlFor="stepGoal"
						className="text-sm font-medium text-primary-text"
					>
						Daily step goal
					</label>
					<p className="text-xs text-secondary-text">
						Used across dashboard, progress, and daily summaries.
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

				<div className="space-y-1.5">
					<label
						htmlFor="timezone"
						className="text-sm font-medium text-primary-text"
					>
						Timezone
					</label>
					<p className="text-xs text-secondary-text">
						Used to bucket daily rollups, reminder timing, and weekly summaries.
					</p>
					<Input
						id="timezone"
						name="timezone"
						type="text"
						defaultValue={defaultSettings.timezone ?? ""}
						placeholder="America/Phoenix"
						autoComplete="off"
					/>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-1.5">
					<label
						htmlFor="reminderTime"
						className="text-sm font-medium text-primary-text"
					>
						Reminder time
					</label>
					<p className="text-xs text-secondary-text">
						Used for protein-gap and end-of-day goal risk reminders.
					</p>
					<Input
						id="reminderTime"
						name="reminderTime"
						type="time"
						defaultValue={defaultSettings.reminderTime}
					/>
				</div>

				<div className="space-y-1.5">
					<label
						htmlFor="weeklySummaryDay"
						className="text-sm font-medium text-primary-text"
					>
						Weekly summary day
					</label>
					<p className="text-xs text-secondary-text">
						Choose which day the in-app weekly summary becomes available.
					</p>
					<select
						id="weeklySummaryDay"
						name="weeklySummaryDay"
						defaultValue={defaultSettings.weeklySummaryDay}
						className="flex h-10 w-full rounded-md border border-border bg-input-bg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cool focus-visible:ring-offset-2"
					>
						{weeklySummaryDays.map((day) => (
							<option key={day} value={day}>
								{day.charAt(0).toUpperCase() + day.slice(1)}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className="space-y-3">
				<div className="space-y-1">
					<h3 className="text-sm font-medium text-primary-text">
						In-app notifications
					</h3>
					<p className="text-xs text-secondary-text">
						Choose which product events should appear in the notification feed.
					</p>
				</div>

				<div className="grid gap-3 md:grid-cols-2">
					<NotificationToggle
						id="notifyRecovery"
						label="Recovery updates"
						description="Low-readiness warnings, stale syncs, and baseline readiness."
						defaultChecked={defaultSettings.notifications.recovery}
					/>
					<NotificationToggle
						id="notifyGoals"
						label="Goal progress"
						description="Challenge wins, missed-risk reminders, and workout streaks."
						defaultChecked={defaultSettings.notifications.goals}
					/>
					<NotificationToggle
						id="notifyNutrition"
						label="Nutrition nudges"
						description="Protein-gap reminders and nutrition goal hits."
						defaultChecked={defaultSettings.notifications.nutrition}
					/>
					<NotificationToggle
						id="notifySummaries"
						label="Weekly summaries"
						description="Progress rollups in the dashboard feed."
						defaultChecked={defaultSettings.notifications.summaries}
					/>
					<NotificationToggle
						id="notifyDevices"
						label="Device status"
						description="Sync completion and wearable freshness issues."
						defaultChecked={defaultSettings.notifications.devices}
					/>
				</div>
			</div>

			{state.status !== "idle" ? (
				<output
					className={cn(
						"text-sm",
						state.status === "success" ? "text-green-600" : "text-red-600"
					)}
				>
					{state.message}
				</output>
			) : null}

			<Button type="submit" disabled={isPending}>
				{isPending ? "Saving..." : "Save settings"}
			</Button>
		</form>
	);
}

function NotificationToggle({
	id,
	label,
	description,
	defaultChecked,
}: {
	id: string;
	label: string;
	description: string;
	defaultChecked: boolean;
}) {
	return (
		<label
			htmlFor={id}
			className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/50 bg-primary-surface/70 p-4"
		>
			<input
				id={id}
				name={id}
				type="checkbox"
				defaultChecked={defaultChecked}
				className="mt-1 h-4 w-4 rounded border-border text-brand-cool focus:ring-brand-cool"
			/>
			<div className="space-y-1">
				<p className="text-sm font-medium text-primary-text">{label}</p>
				<p className="text-xs leading-relaxed text-secondary-text">
					{description}
				</p>
			</div>
		</label>
	);
}
