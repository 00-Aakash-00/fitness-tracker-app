import type { Tables } from "@/types/database";

export type ProgressRange = 7 | 30 | 90;
export type ProgressTone = "positive" | "caution" | "neutral";
export type ActiveWearableProvider =
	Tables<"daily_user_metrics">["active_wearable_provider"];
export type SyncFreshness = Tables<"daily_user_metrics">["sync_freshness"];

export type NextBestAction = {
	id: string;
	title: string;
	description: string;
	label: string;
	href: string;
	tone: "primary" | "secondary";
};

export type TodayAtAGlanceItem = {
	id: string;
	label: string;
	value: string;
	detail: string;
	tone: ProgressTone;
};

export type TodayAtAGlance = {
	headline: string;
	subtitle: string;
	items: TodayAtAGlanceItem[];
	primaryAction: NextBestAction;
};

export type SetupChecklistItem = {
	id: string;
	label: string;
	description: string;
	complete: boolean;
	href: string;
};

export type ProgressSummaryCard = {
	id: string;
	label: string;
	value: string;
	detail: string;
	deltaLabel: string;
	tone: ProgressTone;
	empty?: boolean;
};

export type ProgressChartPoint = {
	date: string;
	label: string;
	primary: number | null;
	secondary: number | null;
	primaryDisplay: string;
	secondaryDisplay: string;
};

export type ProgressChart = {
	id: "recovery_sleep" | "training_activity" | "nutrition_goals";
	title: string;
	description: string;
	primaryLabel: string;
	secondaryLabel: string;
	points: ProgressChartPoint[];
	emptyMessage: string;
};

export type ProgressSnapshot = {
	rangeDays: ProgressRange;
	timezone: string | null;
	currentState: {
		activeProvider: ActiveWearableProvider;
		syncFreshness: SyncFreshness;
	};
	summaryCards: ProgressSummaryCard[];
	charts: ProgressChart[];
	wins: string[];
	drift: string[];
	emptyStateReasons: string[];
	nextBestAction: NextBestAction;
	todayAtAGlance: TodayAtAGlance;
	setupChecklist: SetupChecklistItem[] | null;
};
