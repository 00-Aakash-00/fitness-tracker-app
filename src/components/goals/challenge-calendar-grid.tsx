import type { DailyCompletion } from "@/lib/goals/goals.types";
import {
	getChallengeDays,
	getChallengeEndDate,
	getDayStatus,
	getTodayInTimezone,
} from "@/lib/goals/goals.utils";
import { cn } from "@/lib/utils";

type ChallengeCalendarGridProps = {
	startDate: string;
	duration: number;
	completions: DailyCompletion[];
	taskCount: number;
	timezone?: string;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDayOfWeek(dateStr: string): number {
	// 0=Mon, 1=Tue, ..., 6=Sun
	const d = new Date(`${dateStr}T00:00:00`);
	const jsDay = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
	return jsDay === 0 ? 6 : jsDay - 1;
}

export function ChallengeCalendarGrid({
	startDate,
	duration,
	completions,
	taskCount,
	timezone = "UTC",
}: ChallengeCalendarGridProps) {
	const today = getTodayInTimezone(timezone);
	const endDate = getChallengeEndDate(startDate, duration);
	const days = getChallengeDays(startDate, duration);

	// Group completions by date
	const completionsByDate = new Map<string, number>();
	for (const c of completions) {
		const count = completionsByDate.get(c.completedDate) ?? 0;
		completionsByDate.set(c.completedDate, count + 1);
	}

	// Build the grid: fill leading empty cells based on the start day of week
	const startDow = getDayOfWeek(startDate);
	const cells: (string | null)[] = [];

	// Add leading empty cells
	for (let i = 0; i < startDow; i++) {
		cells.push(null);
	}

	// Add all challenge days
	for (const day of days) {
		cells.push(day);
	}

	// Fill trailing empty cells to complete the last week
	while (cells.length % 7 !== 0) {
		cells.push(null);
	}

	// Assign positional keys to each cell
	const keyedCells = cells.map((day, idx) => ({
		day,
		key: day ?? `empty-${idx}`,
	}));

	// Split into weeks (rows of 7)
	const weeks: { day: string | null; key: string }[][] = [];
	for (let i = 0; i < keyedCells.length; i += 7) {
		weeks.push(keyedCells.slice(i, i + 7));
	}

	return (
		<div className="space-y-2">
			<h3 className="font-primary text-sm font-semibold text-primary-text">
				Progress Grid
			</h3>
			<div className="overflow-x-auto">
				<div className="inline-block">
					{/* Day labels header */}
					<div className="mb-1 grid grid-cols-7 gap-1">
						{DAY_LABELS.map((label) => (
							<div
								key={label}
								className="flex h-5 w-7 items-center justify-center font-secondary text-[10px] text-secondary-text sm:w-8"
							>
								{label.charAt(0)}
							</div>
						))}
					</div>

					{/* Grid rows */}
					<div className="grid gap-1">
						{weeks.map((week) => {
							const weekKey = week.map((c) => c.key).join(",");
							return (
								<div key={weekKey} className="grid grid-cols-7 gap-1">
									{week.map((cell) => {
										if (cell.day === null) {
											return (
												<div key={cell.key} className="h-7 w-7 sm:h-8 sm:w-8" />
											);
										}

										const count = completionsByDate.get(cell.day) ?? 0;
										const status = getDayStatus(
											cell.day,
											count,
											taskCount,
											today,
											endDate
										);

										return (
											<div
												key={cell.key}
												title={`${cell.day}: ${status}`}
												className={cn(
													"h-7 w-7 rounded-sm sm:h-8 sm:w-8",
													status === "complete" && "bg-emerald-500",
													status === "partial" && "bg-amber-400",
													status === "missed" && "bg-red-400/60",
													status === "future" && "bg-secondary-surface",
													status === "today" &&
														count >= taskCount &&
														taskCount > 0
														? "bg-emerald-500 ring-2 ring-brand-cool ring-offset-1 ring-offset-primary-surface"
														: status === "today" && count > 0
															? "bg-amber-400 ring-2 ring-brand-cool ring-offset-1 ring-offset-primary-surface"
															: status === "today" &&
																"bg-secondary-surface ring-2 ring-brand-cool ring-offset-1 ring-offset-primary-surface"
												)}
											/>
										);
									})}
								</div>
							);
						})}
					</div>

					{/* Legend */}
					<div className="mt-3 flex flex-wrap items-center gap-3 font-secondary text-[10px] text-secondary-text">
						<div className="flex items-center gap-1">
							<div className="h-3 w-3 rounded-sm bg-emerald-500" />
							<span>Complete</span>
						</div>
						<div className="flex items-center gap-1">
							<div className="h-3 w-3 rounded-sm bg-amber-400" />
							<span>Partial</span>
						</div>
						<div className="flex items-center gap-1">
							<div className="h-3 w-3 rounded-sm bg-red-400/60" />
							<span>Missed</span>
						</div>
						<div className="flex items-center gap-1">
							<div className="h-3 w-3 rounded-sm bg-secondary-surface" />
							<span>Future</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
