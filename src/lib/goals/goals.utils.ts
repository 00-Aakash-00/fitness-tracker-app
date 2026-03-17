import type { ChallengeStats, DailyCompletion, DayStatus } from "./goals.types";

/**
 * Get the end date of a challenge (start + duration - 1 day).
 * Returns YYYY-MM-DD string.
 */
export function getChallengeEndDate(
	startDate: string,
	duration: number
): string {
	const start = new Date(`${startDate}T00:00:00`);
	start.setDate(start.getDate() + duration - 1);
	return formatDateToISO(start);
}

/**
 * Generate an array of all YYYY-MM-DD date strings for the challenge.
 */
export function getChallengeDays(
	startDate: string,
	duration: number
): string[] {
	const days: string[] = [];
	const current = new Date(`${startDate}T00:00:00`);
	for (let i = 0; i < duration; i++) {
		days.push(formatDateToISO(current));
		current.setDate(current.getDate() + 1);
	}
	return days;
}

/**
 * Get today's date in the challenge's timezone as YYYY-MM-DD.
 */
export function getTodayInTimezone(timezone: string): string {
	try {
		const formatter = new Intl.DateTimeFormat("en-CA", {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
		return formatter.format(new Date());
	} catch {
		// Fallback to UTC if timezone is invalid
		const now = new Date();
		return formatDateToISO(now);
	}
}

/**
 * Format a Date object to YYYY-MM-DD string (local date, not UTC).
 */
function formatDateToISO(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

/**
 * Calculate streaks and stats for a challenge.
 */
export function calculateStreaks(
	completions: DailyCompletion[],
	taskCount: number,
	startDate: string,
	duration: number,
	timezone: string
): ChallengeStats {
	if (taskCount === 0) {
		return {
			currentStreak: 0,
			longestStreak: 0,
			completionRate: 0,
			daysElapsed: 0,
			daysRemaining: duration,
			totalCompleteDays: 0,
		};
	}

	const today = getTodayInTimezone(timezone);
	const endDate = getChallengeEndDate(startDate, duration);

	// Group completions by date
	const completionsByDate = new Map<string, number>();
	for (const c of completions) {
		const count = completionsByDate.get(c.completedDate) ?? 0;
		completionsByDate.set(c.completedDate, count + 1);
	}

	// Calculate days elapsed (from start to min(today, endDate))
	const startMs = new Date(`${startDate}T00:00:00`).getTime();
	const todayMs = new Date(`${today}T00:00:00`).getTime();
	const endMs = new Date(`${endDate}T00:00:00`).getTime();

	// If challenge hasn't started yet
	if (todayMs < startMs) {
		return {
			currentStreak: 0,
			longestStreak: 0,
			completionRate: 0,
			daysElapsed: 0,
			daysRemaining: duration,
			totalCompleteDays: 0,
		};
	}

	const effectiveEndMs = Math.min(todayMs, endMs);
	const daysElapsed =
		Math.floor((effectiveEndMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
	const daysRemaining = Math.max(0, duration - daysElapsed);

	// Count total complete days
	let totalCompleteDays = 0;
	const allDays = getChallengeDays(startDate, duration);
	const pastAndTodayDays = allDays.filter((d) => d <= today);

	for (const day of pastAndTodayDays) {
		const count = completionsByDate.get(day) ?? 0;
		if (count >= taskCount) {
			totalCompleteDays++;
		}
	}

	// Completion rate
	const completionRate =
		daysElapsed > 0 ? Math.round((totalCompleteDays / daysElapsed) * 100) : 0;

	// Current streak: walk backward from today (or endDate if passed)
	let currentStreak = 0;
	const walkStartDate = today <= endDate ? today : endDate;
	const walkStart = new Date(`${walkStartDate}T00:00:00`);

	// If today is not complete, current streak is 0 (unless we count partial)
	// Walk backward from today
	const walker = new Date(walkStart);
	while (walker >= new Date(`${startDate}T00:00:00`)) {
		const dayStr = formatDateToISO(walker);
		const count = completionsByDate.get(dayStr) ?? 0;
		if (count >= taskCount) {
			currentStreak++;
		} else {
			break;
		}
		walker.setDate(walker.getDate() - 1);
	}

	// Longest streak: scan all past days in order
	let longestStreak = 0;
	let runningStreak = 0;

	for (const day of pastAndTodayDays) {
		const count = completionsByDate.get(day) ?? 0;
		if (count >= taskCount) {
			runningStreak++;
			longestStreak = Math.max(longestStreak, runningStreak);
		} else {
			runningStreak = 0;
		}
	}

	return {
		currentStreak,
		longestStreak,
		completionRate,
		daysElapsed,
		daysRemaining,
		totalCompleteDays,
	};
}

/**
 * Determine the display status of a single day.
 */
export function getDayStatus(
	date: string,
	completionsForDate: number,
	taskCount: number,
	today: string,
	endDate: string
): DayStatus {
	if (date > today || date > endDate) {
		return "future";
	}
	if (date === today) {
		return "today";
	}
	if (taskCount > 0 && completionsForDate >= taskCount) {
		return "complete";
	}
	if (completionsForDate > 0) {
		return "partial";
	}
	return "missed";
}
