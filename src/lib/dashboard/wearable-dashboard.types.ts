export type DashboardProvider = "oura" | "whoop";

export type DashboardState =
	| "none"
	| "oura"
	| "whoop"
	| "conflict"
	| "syncing"
	| "baseline_forming"
	| "ready"
	| "stale";

export type DashboardTone =
	| "boost"
	| "steady"
	| "recover"
	| "neutral"
	| "warning";

export type DashboardIcon =
	| "heart"
	| "moon"
	| "activity"
	| "lungs"
	| "shield"
	| "spark"
	| "watch"
	| "arrow";

export type DashboardMetricTone = "good" | "caution" | "neutral";

export type InsightCardMode = "live" | "setup" | "preview";

export type DashboardDeviceStatus =
	| "connected"
	| "not_connected"
	| "blocked"
	| "unavailable";

export interface DashboardActionLink {
	id: string;
	label: string;
	href: string;
	tone: "primary" | "secondary";
	icon?: DashboardIcon;
}

export interface DashboardJourneyStep {
	id: string;
	title: string;
	description: string;
	state: "complete" | "current" | "upcoming";
	icon: DashboardIcon;
}

export interface InsightMetric {
	label: string;
	value: string;
	tone?: DashboardMetricTone;
}

export interface InsightDetailSection {
	title: string;
	description?: string;
	metrics: InsightMetric[];
}

export interface InsightCard {
	id: "recovery" | "sleep" | "load" | "signal";
	mode: InsightCardMode;
	title: string;
	icon: DashboardIcon;
	tone: DashboardTone;
	statusLabel: string;
	value: string;
	unit?: string;
	supportingValue?: string;
	summary: string;
	caption: string;
	empty?: boolean;
	detailTitle: string;
	detailSections: InsightDetailSection[];
}

export interface TrendPoint {
	label: string;
	fullLabel: string;
	dateLabel: string;
	primary: number | null;
	secondary: number | null;
	primaryDisplay: string;
	secondaryDisplay: string;
	best?: boolean;
}

export interface ActionItem {
	id: string;
	title: string;
	description: string;
	icon: DashboardIcon;
	tone: DashboardTone;
}

export interface ConnectionDevicePanelState {
	id: DashboardProvider;
	deviceName: string;
	image: string;
	status: DashboardDeviceStatus;
	featured: boolean;
	description: string;
	actionLabel: string;
	actionHref?: string;
	actionMethod?: "get" | "post";
	lastSyncedLabel?: string | null;
}

export interface ConnectionPanelState {
	activeProvider: DashboardProvider | null;
	headline: string;
	description: string;
	primary: ConnectionDevicePanelState;
	secondary: ConnectionDevicePanelState;
}

export interface DashboardTrendSummary {
	title: string;
	description: string;
	primaryLabel: string;
	secondaryLabel: string;
	points: TrendPoint[];
	primaryAverageLabel: string;
	secondaryAverageLabel: string;
	bestDayLabel: string;
	streakLabel: string;
	emptyMessage?: string;
}

export interface DashboardStatusMessage {
	eyebrow: string;
	title: string;
	description: string;
	tone: DashboardTone;
}

export interface DashboardWearableContext {
	provider: DashboardProvider | null;
	providerLabel: string;
	state: DashboardState;
	lastSyncedAt: string | null;
	lastSyncedLabel: string;
	headline: string;
	highlight: string;
	description: string;
	status: DashboardStatusMessage;
	heroActions: DashboardActionLink[];
	journeySteps: DashboardJourneyStep[];
	showQuickAssist: boolean;
	cards: InsightCard[];
	trend: DashboardTrendSummary;
	actions: ActionItem[];
	connectionPanel: ConnectionPanelState;
}
