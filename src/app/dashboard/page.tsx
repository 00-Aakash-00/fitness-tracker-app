import { FitnessOverview } from "@/components/dashboard/fitness-overview";
import { QuickAssist } from "@/components/dashboard/quick-assist";
import { TopIntro } from "@/components/dashboard/top-intro";

export default function DashboardPage() {
	return (
		<div className="min-h-[calc(100vh-4rem)]">
			<div className="flex flex-col lg:flex-row h-full">
				{/* Left Panel - 1/3 */}
				<div className="w-full lg:w-1/3 flex flex-col gap-8 pt-8">
					<TopIntro />
					<QuickAssist />
				</div>

				{/* Vertical Separator */}
				<div className="hidden lg:block w-px bg-border mx-6" />

				{/* Right Panel - 2/3 */}
				<div className="flex-1 py-2 flex items-start pt-8">
					<FitnessOverview />
				</div>
			</div>
		</div>
	);
}
