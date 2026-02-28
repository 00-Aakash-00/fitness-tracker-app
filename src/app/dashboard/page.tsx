import { cookies } from "next/headers";
import { FitnessDeviceCarousel } from "@/components/dashboard/fitness-device-carousel";
import { FitnessOverview } from "@/components/dashboard/fitness-overview";
import { QuickAssist } from "@/components/dashboard/quick-assist";
import { TopIntro } from "@/components/dashboard/top-intro";
import { WeeklyActivitySummary } from "@/components/dashboard/weekly-activity-summary";
import { isOuraConfigured } from "@/lib/integrations/oura.server";
import { isWhoopConfigured } from "@/lib/integrations/whoop.server";
import { parseStepGoal, STEP_GOAL_COOKIE } from "@/lib/preferences";

export default async function DashboardPage() {
	const cookieStore = await cookies();
	const stepGoal = parseStepGoal(cookieStore.get(STEP_GOAL_COOKIE)?.value);
	const devices = [
		...(isWhoopConfigured()
			? [
					{
						id: "whoop",
						type: "whoop" as const,
						deviceName: "WHOOP",
						status: "offline" as const,
						image: "/whoop.png",
					},
				]
			: []),
		...(isOuraConfigured()
			? [
					{
						id: "oura",
						type: "oura" as const,
						deviceName: "Oura",
						status: "offline" as const,
						image: "/oura.png",
					},
				]
			: []),
	];

	return (
		<div className="min-h-[calc(100vh-4rem)]">
			{/* Top Row - Main Content */}
			<div className="flex flex-col lg:flex-row">
				{/* Left Panel - 1/3 */}
				<div className="w-full lg:w-1/3 flex flex-col gap-8 pt-8">
					<TopIntro />
					<WeeklyActivitySummary />
					<QuickAssist />
				</div>

				{/* Vertical Separator */}
				<div className="hidden lg:block w-px bg-border mx-6" />

				{/* Right Panel - 2/3 */}
				<div className="flex-1 py-2 flex items-start pt-14">
					<FitnessOverview stepGoal={stepGoal} />
				</div>
			</div>

			{/* Bottom Row - Carousel aligned right */}
			<div className="flex justify-end mt-14">
				<div className="w-full lg:w-1/3">
					<FitnessDeviceCarousel devices={devices} />
				</div>
			</div>
		</div>
	);
}
