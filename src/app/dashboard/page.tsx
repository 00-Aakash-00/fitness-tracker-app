import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import {
	FitnessDeviceCarousel,
	type FitnessDeviceConnection,
} from "@/components/dashboard/fitness-device-carousel";
import { FitnessOverview } from "@/components/dashboard/fitness-overview";
import { QuickAssist } from "@/components/dashboard/quick-assist";
import { TopIntro } from "@/components/dashboard/top-intro";
import { WeeklyActivitySummary } from "@/components/dashboard/weekly-activity-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	getOAuthConnection,
	getSupabaseUserIdByClerkId,
} from "@/lib/integrations/oauth-connections.server";
import { isOuraConfigured } from "@/lib/integrations/oura.server";
import { isWhoopConfigured } from "@/lib/integrations/whoop.server";
import { parseStepGoal, STEP_GOAL_COOKIE } from "@/lib/preferences";

export default async function DashboardPage({
	searchParams,
}: {
	searchParams?: Record<string, string | string[] | undefined>;
}) {
	const [{ userId }, cookieStore] = await Promise.all([auth(), cookies()]);
	const stepGoal = parseStepGoal(cookieStore.get(STEP_GOAL_COOKIE)?.value);
	const isWhoopAvailable = isWhoopConfigured();
	const isOuraAvailable = isOuraConfigured();
	const integration =
		typeof searchParams?.integration === "string"
			? searchParams.integration
			: undefined;
	const status =
		typeof searchParams?.status === "string" ? searchParams.status : undefined;
	const message =
		typeof searchParams?.message === "string"
			? searchParams.message
			: undefined;
	const deviceDefinitions: Array<
		Pick<FitnessDeviceConnection, "id" | "type" | "deviceName" | "image"> & {
			isAvailable: boolean;
		}
	> = [
		{
			id: "whoop",
			type: "whoop",
			deviceName: "WHOOP",
			image: "/whoop.png",
			isAvailable: isWhoopAvailable,
		},
		{
			id: "oura",
			type: "oura",
			deviceName: "Oura",
			image: "/oura.png",
			isAvailable: isOuraAvailable,
		},
	];
	let devices: FitnessDeviceConnection[] = deviceDefinitions.map(
		({ isAvailable, ...device }) => ({
			...device,
			status: isAvailable ? "not_connected" : "unavailable",
		})
	);

	if (userId && (isWhoopAvailable || isOuraAvailable)) {
		try {
			const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
			const [whoopConnection, ouraConnection] = await Promise.all([
				isWhoopAvailable
					? getOAuthConnection({ userId: supabaseUserId, provider: "whoop" })
					: Promise.resolve(null),
				isOuraAvailable
					? getOAuthConnection({ userId: supabaseUserId, provider: "oura" })
					: Promise.resolve(null),
			]);

			devices = [
				{
					id: "whoop",
					type: "whoop",
					deviceName: "WHOOP",
					status: !isWhoopAvailable
						? "unavailable"
						: whoopConnection
							? "connected"
							: "not_connected",
					image: "/whoop.png",
				},
				{
					id: "oura",
					type: "oura",
					deviceName: "Oura",
					status: !isOuraAvailable
						? "unavailable"
						: ouraConnection
							? "connected"
							: "not_connected",
					image: "/oura.png",
				},
			];
		} catch {
			devices = deviceDefinitions.map(({ isAvailable, ...device }) => ({
				...device,
				status: isAvailable ? "not_connected" : "unavailable",
			}));
		}
	}

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

			{/* Top Row - Main Content */}
			<div className="flex flex-col gap-8 lg:flex-row">
				{/* Left Panel - 1/3 */}
				<div className="w-full lg:w-1/3 flex flex-col gap-8 pt-8">
					<TopIntro />
					<QuickAssist />
				</div>

				{/* Vertical Separator */}
				<div className="hidden lg:block w-px bg-border mx-6" />

				{/* Right Panel - 2/3 */}
				<div className="flex-1 flex items-start pt-2 lg:pt-14">
					<FitnessOverview stepGoal={stepGoal} />
				</div>
			</div>

			{/* Bottom Row - Weekly activity + device connections */}
			<div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-start">
				<WeeklyActivitySummary />
				<FitnessDeviceCarousel devices={devices} />
			</div>
		</div>
	);
}
