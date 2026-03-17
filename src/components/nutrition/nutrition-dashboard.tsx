"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { DailyDetail } from "@/components/nutrition/daily-detail";
import { NutritionCalendar } from "@/components/nutrition/nutrition-calendar";
import { Card, CardContent } from "@/components/ui/card";
import { getDateParts, normalizeDateString } from "@/lib/date";
import {
	buildDailySummary,
	type DailyNutritionSummary,
	type Meal,
	type NutritionGoals,
} from "@/lib/nutrition/utils";

interface NutritionDashboardProps {
	initialMeals: Record<string, Meal[]>;
	initialDate: string;
	goals: NutritionGoals;
}

export function NutritionDashboard({
	initialMeals,
	initialDate,
	goals,
}: NutritionDashboardProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const selectedDate = normalizeDateString(
		searchParams.get("date"),
		initialDate
	);
	const { year, month } = getDateParts(selectedDate);

	// Build daily summaries map for the calendar
	const dailySummaries = useMemo(() => {
		const map = new Map<string, DailyNutritionSummary>();
		for (const [dateKey, meals] of Object.entries(initialMeals)) {
			map.set(dateKey, buildDailySummary(dateKey, meals));
		}
		return map;
	}, [initialMeals]);

	// Get meals for the selected date
	const selectedMeals = useMemo(
		() => initialMeals[selectedDate] ?? [],
		[initialMeals, selectedDate]
	);

	const handleSelectDate = useCallback(
		(date: string) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set("date", date);
			router.push(`/dashboard/nutrition?${params.toString()}`, {
				scroll: false,
			});
		},
		[router, searchParams]
	);

	const handleChangeMonth = useCallback(
		(year: number, month: number) => {
			const newDate = `${year}-${String(month).padStart(2, "0")}-01`;
			const params = new URLSearchParams(searchParams.toString());
			params.set("date", newDate);
			router.push(`/dashboard/nutrition?${params.toString()}`, {
				scroll: false,
			});
		},
		[router, searchParams]
	);

	return (
		<div className="flex flex-col gap-6 lg:flex-row">
			{/* Calendar */}
			<Card className="lg:w-2/5">
				<CardContent className="p-4 md:p-5">
					<NutritionCalendar
						year={year}
						month={month}
						dailySummaries={dailySummaries}
						selectedDate={selectedDate}
						goals={goals}
						onSelectDate={handleSelectDate}
						onChangeMonth={handleChangeMonth}
					/>
				</CardContent>
			</Card>

			{/* Separator (desktop only) */}
			<div className="hidden lg:block w-px bg-border" />

			{/* Daily detail */}
			<div className="flex-1">
				<DailyDetail date={selectedDate} meals={selectedMeals} goals={goals} />
			</div>
		</div>
	);
}
