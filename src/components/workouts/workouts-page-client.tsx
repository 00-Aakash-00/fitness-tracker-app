"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type {
	Exercise,
	TemplateWithExercises,
	Workout,
	WorkoutWithExercises,
} from "@/lib/workouts/workouts.types";
import { formatDate } from "@/lib/workouts/workouts.utils";
import { WorkoutCalendar } from "./workout-calendar";
import { WorkoutDayDetail } from "./workout-day-detail";

type WorkoutsPageClientProps = {
	selectedDate: string;
	year: number;
	month: number;
	monthWorkouts: Workout[];
	dayWorkouts: WorkoutWithExercises[];
	templates: TemplateWithExercises[];
	exercises: Exercise[];
};

export function WorkoutsPageClient({
	selectedDate,
	year,
	month,
	monthWorkouts,
	dayWorkouts,
	templates,
	exercises,
}: WorkoutsPageClientProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const handleSelectDate = useCallback(
		(date: string) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set("date", date);
			router.push(`/dashboard/workouts?${params.toString()}`);
		},
		[router, searchParams]
	);

	const handleChangeMonth = useCallback(
		(newYear: number, newMonth: number) => {
			// When changing month, select the 1st of the new month
			const newDate = formatDate(new Date(newYear, newMonth - 1, 1));
			const params = new URLSearchParams(searchParams.toString());
			params.set("date", newDate);
			router.push(`/dashboard/workouts?${params.toString()}`);
		},
		[router, searchParams]
	);

	return (
		<div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
			{/* Calendar (left side) */}
			<div className="w-full shrink-0 lg:w-72">
				<WorkoutCalendar
					year={year}
					month={month}
					workouts={monthWorkouts}
					selectedDate={selectedDate}
					onSelectDate={handleSelectDate}
					onChangeMonth={handleChangeMonth}
				/>
			</div>

			{/* Day detail (right side) */}
			<div className="flex-1">
				<WorkoutDayDetail
					date={selectedDate}
					workouts={dayWorkouts}
					templates={templates}
					exercises={exercises}
				/>
			</div>
		</div>
	);
}
