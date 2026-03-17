export type ChallengeStatus = "active" | "paused" | "completed" | "abandoned";

export type Challenge = {
	id: string;
	userId: string;
	name: string;
	description: string;
	duration: number;
	startDate: string;
	timezone: string;
	status: ChallengeStatus;
	templateId: string | null;
	createdAt: string;
	updatedAt: string;
};

export type ChallengeTask = {
	id: string;
	challengeId: string;
	label: string;
	sortOrder: number;
};

export type DailyCompletion = {
	id: string;
	challengeId: string;
	taskId: string;
	completedDate: string;
};

export type ChallengeWithTasks = Challenge & {
	tasks: ChallengeTask[];
};

export type ChallengeDetail = ChallengeWithTasks & {
	completions: DailyCompletion[];
	stats: ChallengeStats;
};

export type ChallengeStats = {
	currentStreak: number;
	longestStreak: number;
	completionRate: number;
	daysElapsed: number;
	daysRemaining: number;
	totalCompleteDays: number;
};

export type DayStatus = "complete" | "partial" | "missed" | "future" | "today";
