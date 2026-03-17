"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Workout } from "@/lib/workouts/workouts.types";
import { formatDate, getMonthDays } from "@/lib/workouts/workouts.utils";

type WorkoutCalendarProps = {
	year: number;
	month: number;
	workouts: Workout[];
	selectedDate: string;
	onSelectDate: (date: string) => void;
	onChangeMonth: (year: number, month: number) => void;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WorkoutCalendar({
	year,
	month,
	workouts,
	selectedDate,
	onSelectDate,
	onChangeMonth,
}: WorkoutCalendarProps) {
	const days = getMonthDays(year, month);
	const firstDayOfWeek = days[0].getDay();
	const today = formatDate(new Date());

	// Build a map of date → workout colors for dots
	const dateWorkoutsMap = new Map<string, string[]>();
	for (const w of workouts) {
		const existing = dateWorkoutsMap.get(w.date) ?? [];
		const color = w.color ?? "#1d83ab";
		if (!existing.includes(color)) {
			existing.push(color);
		}
		dateWorkoutsMap.set(w.date, existing);
	}

	const monthLabel = new Date(year, month - 1).toLocaleDateString("en-US", {
		month: "long",
		year: "numeric",
	});

	const handlePrevMonth = () => {
		if (month === 1) {
			onChangeMonth(year - 1, 12);
		} else {
			onChangeMonth(year, month - 1);
		}
	};

	const handleNextMonth = () => {
		if (month === 12) {
			onChangeMonth(year + 1, 1);
		} else {
			onChangeMonth(year, month + 1);
		}
	};

	return (
		<div className="rounded-xl border border-border bg-primary-surface p-3">
			{/* Header */}
			<div className="mb-3 flex items-center justify-between">
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={handlePrevMonth}
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>
				<h3 className="font-primary text-sm font-semibold text-primary-text">
					{monthLabel}
				</h3>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={handleNextMonth}
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>

			{/* Weekday headers */}
			<div className="grid grid-cols-7 gap-0.5">
				{WEEKDAYS.map((day) => (
					<div
						key={day}
						className="pb-1 text-center text-[10px] font-medium text-secondary-text"
					>
						{day}
					</div>
				))}

				{/* Empty cells before the first day */}
				{Array.from({ length: firstDayOfWeek }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static empty cells
					<div key={`empty-${i}`} />
				))}

				{/* Day cells */}
				{days.map((day) => {
					const dateStr = formatDate(day);
					const isSelected = dateStr === selectedDate;
					const isToday = dateStr === today;
					const workoutColors = dateWorkoutsMap.get(dateStr) ?? [];

					return (
						<button
							key={dateStr}
							type="button"
							onClick={() => onSelectDate(dateStr)}
							className={cn(
								"relative flex flex-col items-center rounded-md px-0.5 py-1 text-xs transition-colors",
								isSelected
									? "bg-brand-cool text-white"
									: isToday
										? "bg-brand-cool/10 text-brand-cool font-semibold"
										: "text-primary-text hover:bg-secondary-surface"
							)}
						>
							<span>{day.getDate()}</span>
							{/* Colored dots */}
							{workoutColors.length > 0 && (
								<div className="mt-0.5 flex gap-0.5">
									{workoutColors.slice(0, 3).map((color) => (
										<span
											key={color}
											className={cn(
												"h-1 w-1 rounded-full",
												isSelected ? "bg-white" : ""
											)}
											style={
												isSelected
													? undefined
													: {
															backgroundColor: color,
														}
											}
										/>
									))}
								</div>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
