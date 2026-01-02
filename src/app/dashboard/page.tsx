import { cookies } from "next/headers";
import { FitnessDeviceCarousel } from "@/components/dashboard/fitness-device-carousel";
import { FitnessOverview } from "@/components/dashboard/fitness-overview";
import { QuickAssist } from "@/components/dashboard/quick-assist";
import { TopIntro } from "@/components/dashboard/top-intro";
import { parseStepGoal, STEP_GOAL_COOKIE } from "@/lib/preferences";

export default async function DashboardPage() {
	const cookieStore = await cookies();
	const stepGoal = parseStepGoal(cookieStore.get(STEP_GOAL_COOKIE)?.value);

	return (
		<div className="min-h-[calc(100vh-4rem)]">
			{/* Top Row - Main Content */}
			<div className="flex flex-col lg:flex-row">
				{/* Left Panel - 1/3 */}
				<div className="w-full lg:w-1/3 flex flex-col gap-8 pt-8">
					<TopIntro />
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
			<div className="flex justify-end mt-8">
				<div className="w-full lg:w-1/3">
					<FitnessDeviceCarousel />
				</div>
			</div>
		</div>
	);
}
