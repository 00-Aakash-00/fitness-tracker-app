export type Meal = {
	id: string;
	name: string;
	calories: number;
	protein: number;
	source: "ai" | "manual";
	rawInput: string | null;
	createdAt: string;
};

export type NutritionGoals = {
	dailyCalories: number;
	dailyProtein: number;
};

export type DailyNutritionSummary = {
	date: string;
	totalCalories: number;
	totalProtein: number;
	meals: Meal[];
};

export type GoalStatus = "under" | "met" | "over";

/** Format a Date as YYYY-MM-DD */
export function formatDate(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

/** Parse a YYYY-MM-DD string into a Date (local time) */
export function parseDate(str: string): Date {
	const [y, m, d] = str.split("-").map(Number);
	return new Date(y, m - 1, d);
}

/** Get all days in a given month (1-indexed month) */
export function getMonthDays(year: number, month: number): Date[] {
	const days: Date[] = [];
	const daysInMonth = new Date(year, month, 0).getDate();
	for (let d = 1; d <= daysInMonth; d++) {
		days.push(new Date(year, month - 1, d));
	}
	return days;
}

/** Check if two dates are the same calendar day */
export function isSameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

/**
 * Determine goal status based on consumption vs. goal.
 * - under: consumed <= 90% of goal
 * - met: consumed between 90% and 110% of goal
 * - over: consumed > 110% of goal
 */
export function getGoalStatus(consumed: number, goal: number): GoalStatus {
	if (goal <= 0) return "met";
	const ratio = consumed / goal;
	if (ratio <= 0.9) return "under";
	if (ratio <= 1.1) return "met";
	return "over";
}

/** Build daily summaries from a flat meals map */
export function buildDailySummary(
	date: string,
	meals: Meal[]
): DailyNutritionSummary {
	return {
		date,
		totalCalories: meals.reduce((sum, m) => sum + m.calories, 0),
		totalProtein: meals.reduce((sum, m) => sum + m.protein, 0),
		meals,
	};
}
