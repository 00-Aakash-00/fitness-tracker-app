export const STEP_GOAL_COOKIE = "ft_step_goal";
export const DEFAULT_STEP_GOAL = 10_000;

export function parseStepGoal(rawValue: string | null | undefined) {
	if (!rawValue) return DEFAULT_STEP_GOAL;
	const value = Number.parseInt(rawValue, 10);
	if (!Number.isFinite(value)) return DEFAULT_STEP_GOAL;
	if (value < 1000) return 1000;
	if (value > 200_000) return 200_000;
	return value;
}
