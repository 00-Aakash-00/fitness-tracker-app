import { Dumbbell, Target, TrendingUp, Utensils } from "lucide-react";
import Link from "next/link";

const quickActions = [
	{
		label: "Log Workout",
		icon: Dumbbell,
		href: "/dashboard/workouts",
	},
	{
		label: "Track Meal",
		icon: Utensils,
		href: "/dashboard/nutrition",
	},
	{
		label: "View Progress",
		icon: TrendingUp,
		href: "/dashboard/progress",
	},
	{
		label: "Set Goal",
		icon: Target,
		href: "/dashboard/goals",
	},
];

export function QuickAssist() {
	return (
		<div className="space-y-4">
			<h2 className="font-primary text-lg font-semibold text-primary-text">
				Quick Actions
			</h2>
			<div className="grid grid-cols-2 gap-2.5">
				{quickActions.map((action) => (
					<Link
						key={action.label}
						href={action.href}
						className="group inline-flex items-center justify-center gap-2 rounded-lg border border-border/40 bg-primary-surface/80 px-3.5 py-2 text-[13px] text-secondary-text/90 backdrop-blur-sm transition-all duration-200 ease-out hover:border-border/60 hover:bg-primary-surface hover:text-primary-text"
					>
						<action.icon className="h-3.5 w-3.5 stroke-[1.5] transition-colors duration-200" />
						<span className="font-geist font-normal tracking-tight">{action.label}</span>
					</Link>
				))}
			</div>
		</div>
	);
}
