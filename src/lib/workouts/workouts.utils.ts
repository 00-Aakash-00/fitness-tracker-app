import type {
	Exercise,
	ExerciseSet,
	WorkoutExercise,
	WorkoutStatus,
	WorkoutSummary,
} from "./workouts.types";

/** Calculate aggregate stats for a workout's exercises */
export function calculateWorkoutSummary(
	exercises: WorkoutExercise[]
): WorkoutSummary {
	let totalSets = 0;
	let totalReps = 0;
	let totalVolume = 0;

	for (const we of exercises) {
		for (const set of we.sets) {
			if (set.isCompleted) {
				totalSets += 1;
				totalReps += set.reps ?? 0;
				totalVolume += (set.weight ?? 0) * (set.reps ?? 0);
			}
		}
	}

	return {
		totalSets,
		totalReps,
		totalVolume,
		exerciseCount: exercises.length,
	};
}

/** Format a weight value with unit (lbs) */
export function formatWeight(weight: number | null): string {
	if (weight === null || weight === 0) return "--";
	return `${weight} lbs`;
}

/** Format duration in minutes to a human-readable string */
export function formatDuration(minutes: number | null): string {
	if (minutes === null || minutes <= 0) return "--";
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	if (h === 0) return `${m}m`;
	if (m === 0) return `${h}h`;
	return `${h}h ${m}m`;
}

/** Return a Tailwind badge class string for a workout status */
export function getStatusColor(status: WorkoutStatus): string {
	switch (status) {
		case "planned":
			return "bg-brand-cool/10 text-brand-cool";
		case "in_progress":
			return "bg-brand-warm/10 text-brand-warm";
		case "completed":
			return "bg-green-100 text-green-700";
		case "skipped":
			return "bg-secondary-surface text-secondary-text";
		default:
			return "bg-secondary-surface text-secondary-text";
	}
}

/** Return a human-readable label for a workout status */
export function getStatusLabel(status: WorkoutStatus): string {
	switch (status) {
		case "planned":
			return "Planned";
		case "in_progress":
			return "In Progress";
		case "completed":
			return "Completed";
		case "skipped":
			return "Skipped";
		default:
			return status;
	}
}

/** Group exercises by muscle group */
export function groupExercisesByMuscle(
	exercises: Exercise[]
): Record<string, Exercise[]> {
	const grouped: Record<string, Exercise[]> = {};
	for (const ex of exercises) {
		const group = ex.muscleGroup ?? "Other";
		if (!grouped[group]) {
			grouped[group] = [];
		}
		grouped[group].push(ex);
	}
	return grouped;
}

/** Format a YYYY-MM-DD date string for display */
export function formatDateDisplay(dateStr: string): string {
	const [y, m, d] = dateStr.split("-").map(Number);
	const date = new Date(y, m - 1, d);
	return date.toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
	});
}

/** Format a Date as YYYY-MM-DD */
export function formatDate(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
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

/** Format volume to a compact string */
export function formatVolume(volume: number): string {
	if (volume === 0) return "0";
	if (volume >= 1000) {
		return `${(volume / 1000).toFixed(1)}k`;
	}
	return volume.toLocaleString();
}

/** Get the last set from a list (for auto-fill) */
export function getLastSetDefaults(
	sets: ExerciseSet[]
): Pick<ExerciseSet, "weight" | "reps" | "setType"> {
	if (sets.length === 0) {
		return { weight: null, reps: null, setType: "working" };
	}
	const last = sets[sets.length - 1];
	return {
		weight: last.weight,
		reps: last.reps,
		setType: last.setType,
	};
}
