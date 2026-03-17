"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	type DailyNutritionSummary,
	formatDate,
	getGoalStatus,
	getMonthDays,
	isSameDay,
	type NutritionGoals,
} from "@/lib/nutrition/utils";
import { cn } from "@/lib/utils";

interface NutritionCalendarProps {
	year: number;
	month: number;
	dailySummaries: Map<string, DailyNutritionSummary>;
	selectedDate: string;
	goals: NutritionGoals;
	onSelectDate: (date: string) => void;
	onChangeMonth: (year: number, month: number) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

export function NutritionCalendar({
	year,
	month,
	dailySummaries,
	selectedDate,
	goals,
	onSelectDate,
	onChangeMonth,
}: NutritionCalendarProps) {
	const today = new Date();
	const days = getMonthDays(year, month);
	const firstDayOfWeek = days[0].getDay(); // 0 = Sunday
	const emptyCells = Array.from(
		{ length: firstDayOfWeek },
		(_, position) =>
			`${year}-${String(month).padStart(2, "0")}-empty-${position + 1}`
	);

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
		<div className="space-y-3">
			{/* Header */}
			<div className="flex items-center justify-between">
				<Button
					variant="ghost"
					size="icon"
					onClick={handlePrevMonth}
					aria-label="Previous month"
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>
				<h2 className="font-primary text-base font-semibold text-primary-text">
					{MONTH_NAMES[month - 1]} {year}
				</h2>
				<Button
					variant="ghost"
					size="icon"
					onClick={handleNextMonth}
					aria-label="Next month"
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>

			{/* Weekday headers */}
			<div className="grid grid-cols-7 gap-0">
				{WEEKDAYS.map((day) => (
					<div
						key={day}
						className="py-1.5 text-center text-xs font-medium text-secondary-text"
					>
						{day}
					</div>
				))}
			</div>

			{/* Day cells */}
			<div className="grid grid-cols-7 gap-0">
				{/* Empty cells before first day */}
				{emptyCells.map((cellKey) => (
					<div key={cellKey} className="aspect-square" />
				))}

				{days.map((date) => {
					const dateStr = formatDate(date);
					const isSelected = dateStr === selectedDate;
					const isToday = isSameDay(date, today);
					const summary = dailySummaries.get(dateStr);
					const hasMeals = summary && summary.meals.length > 0;

					let dotColor: string | null = null;
					if (hasMeals) {
						const status = getGoalStatus(
							summary.totalCalories,
							goals.dailyCalories
						);
						dotColor =
							status === "met"
								? "bg-brand-cool"
								: status === "over"
									? "bg-brand-warm"
									: "bg-brand-soft";
					}

					return (
						<button
							key={dateStr}
							type="button"
							onClick={() => onSelectDate(dateStr)}
							className={cn(
								"relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors",
								isSelected
									? "bg-brand-cool text-white font-semibold ring-2 ring-brand-cool ring-offset-2 ring-offset-primary-surface"
									: isToday
										? "bg-secondary-surface font-medium text-primary-text"
										: "text-primary-text hover:bg-secondary-surface/70"
							)}
							aria-label={`${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}${hasMeals ? `, ${summary.meals.length} meal${summary.meals.length > 1 ? "s" : ""} logged` : ""}`}
							aria-current={isToday ? "date" : undefined}
						>
							<span>{date.getDate()}</span>
							{dotColor && (
								<span
									className={cn(
										"absolute bottom-1 h-1.5 w-1.5 rounded-full",
										isSelected ? "bg-white" : dotColor
									)}
								/>
							)}
						</button>
					);
				})}
			</div>

			{/* Legend */}
			<div className="flex items-center justify-center gap-4 pt-1 text-xs text-secondary-text">
				<div className="flex items-center gap-1.5">
					<span className="h-2 w-2 rounded-full bg-brand-cool" />
					<span>On track</span>
				</div>
				<div className="flex items-center gap-1.5">
					<span className="h-2 w-2 rounded-full bg-brand-soft" />
					<span>Under</span>
				</div>
				<div className="flex items-center gap-1.5">
					<span className="h-2 w-2 rounded-full bg-brand-warm" />
					<span>Over</span>
				</div>
			</div>
		</div>
	);
}
