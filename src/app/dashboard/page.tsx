import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { FitnessOverview } from "@/components/dashboard/fitness-overview";
import { NextBestActions } from "@/components/dashboard/next-best-actions";
import { QuickAssist } from "@/components/dashboard/quick-assist";
import { SetupChecklist } from "@/components/dashboard/setup-checklist";
import { TodayAtAGlancePanel } from "@/components/dashboard/today-at-a-glance";
import { TopIntro } from "@/components/dashboard/top-intro";
import { WearableConnectionPanel } from "@/components/dashboard/wearable-connection-panel";
import { WeeklyActivitySummary } from "@/components/dashboard/weekly-activity-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardWearableContext } from "@/lib/dashboard/wearable-dashboard.server";
import {
	getOAuthConnection,
	getSupabaseUserIdByClerkId,
} from "@/lib/integrations/oauth-connections.server";
import { isOuraConfigured } from "@/lib/integrations/oura.server";
import { isWhoopConfigured } from "@/lib/integrations/whoop.server";
import { parseStepGoal, STEP_GOAL_COOKIE } from "@/lib/preferences";
import { getProgressSnapshot } from "@/lib/progress/progress.server";

export default async function DashboardPage({
	searchParams,
}: PageProps<"/dashboard">) {
	const [{ userId }, cookieStore] = await Promise.all([auth(), cookies()]);
	const resolvedSearchParams = await searchParams;
	const stepGoal = parseStepGoal(cookieStore.get(STEP_GOAL_COOKIE)?.value);
	const isWhoopAvailable = isWhoopConfigured();
	const isOuraAvailable = isOuraConfigured();
	const integration =
		typeof resolvedSearchParams.integration === "string"
			? resolvedSearchParams.integration
			: undefined;
	const status =
		typeof resolvedSearchParams.status === "string"
			? resolvedSearchParams.status
			: undefined;
	const message =
		typeof resolvedSearchParams.message === "string"
			? resolvedSearchParams.message
			: undefined;
	let supabaseUserId: string | null = null;
	let whoopConnected = false;
	let ouraConnected = false;

	if (userId) {
		try {
			supabaseUserId = await getSupabaseUserIdByClerkId(userId);
			if (isWhoopAvailable || isOuraAvailable) {
				const [whoopConnection, ouraConnection] = await Promise.all([
					isWhoopAvailable
						? getOAuthConnection({ userId: supabaseUserId, provider: "whoop" })
						: Promise.resolve(null),
					isOuraAvailable
						? getOAuthConnection({ userId: supabaseUserId, provider: "oura" })
						: Promise.resolve(null),
				]);

				whoopConnected = Boolean(whoopConnection);
				ouraConnected = Boolean(ouraConnection);
			}
		} catch {
			supabaseUserId = null;
			whoopConnected = false;
			ouraConnected = false;
		}
	}

	const [dashboardContext, progressSnapshot] = await Promise.all([
		getDashboardWearableContext({
			stepGoal,
			connections: {
				isWhoopAvailable,
				isOuraAvailable,
				whoopConnected,
				ouraConnected,
			},
		}),
		supabaseUserId
			? getProgressSnapshot({
					supabaseUserId,
					rangeDays: 7,
					stepGoal,
				})
			: Promise.resolve(null),
	]);

	return (
		<div className="min-h-[calc(100vh-4rem)] space-y-10 lg:space-y-14">
			{integration && status ? (
				<Card
					className={
						status === "error" ? "border-red-500/40" : "border-brand-cool/30"
					}
				>
					<CardHeader>
						<CardTitle className="capitalize">
							{integration}{" "}
							{status === "connected"
								? "connected"
								: status === "disconnected"
									? "disconnected"
									: "error"}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-secondary-text">
							{status === "error"
								? message || "Something went wrong. Please try again."
								: status === "connected"
									? "Your account is connected."
									: "Your account is disconnected."}
						</p>
					</CardContent>
				</Card>
			) : null}

			{progressSnapshot ? (
				<TodayAtAGlancePanel glance={progressSnapshot.todayAtAGlance} />
			) : null}

			{progressSnapshot?.setupChecklist ? (
				<SetupChecklist items={progressSnapshot.setupChecklist} />
			) : null}

			{/* Top Row - Main Content */}
			<div className="flex flex-col gap-8 lg:flex-row">
				{/* Left Panel - 1/3 */}
				<div className="w-full lg:w-1/3 flex flex-col gap-8 pt-8">
					<TopIntro
						headline={dashboardContext.headline}
						highlight={dashboardContext.highlight}
						description={dashboardContext.description}
						providerLabel={dashboardContext.providerLabel}
						actions={dashboardContext.heroActions}
					/>
					{progressSnapshot ? (
						<NextBestActions action={progressSnapshot.nextBestAction} />
					) : null}
					{dashboardContext.showQuickAssist ? <QuickAssist /> : null}
				</div>

				{/* Vertical Separator */}
				<div className="hidden lg:block w-px bg-border mx-6" />

				{/* Right Panel - 2/3 */}
				<div className="flex-1 flex items-start pt-2 lg:pt-14">
					<FitnessOverview
						providerLabel={dashboardContext.providerLabel}
						lastSyncedLabel={dashboardContext.lastSyncedLabel}
						status={dashboardContext.status}
						cards={dashboardContext.cards}
					/>
				</div>
			</div>

			{/* Bottom Row - Weekly activity + device connections */}
			<div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-start">
				<WeeklyActivitySummary
					state={dashboardContext.state}
					trend={dashboardContext.trend}
					journeySteps={dashboardContext.journeySteps}
				/>
				<WearableConnectionPanel panel={dashboardContext.connectionPanel} />
			</div>
		</div>
	);
}
