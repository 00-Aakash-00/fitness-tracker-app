"use client";

import { Flame, Footprints, Utensils, Beef } from "lucide-react";

// Mock data - will be replaced with real data later
const mockData = {
	caloriesBurned: { value: 1847, goal: 2200 },
	steps: { value: 8432, goal: 10000 },
	caloriesEaten: { value: 1520, goal: 2000 },
	protein: { value: 87, goal: 120 },
};

interface MetricCardProps {
	title: string;
	value: number;
	goal: number;
	unit: string;
	subtitle: string;
	icon: React.ReactNode;
}

function MetricCard({
	title,
	value,
	goal,
	unit,
	subtitle,
	icon,
}: MetricCardProps) {
	const percentage = Math.round((value / goal) * 100);

	return (
		<div className="p-5 rounded-xl bg-primary-surface border border-border/40 transition-all duration-300 ease-out transform hover:-translate-y-0.5 group">
			<div className="relative">
				{/* Header */}
				<div className="flex items-start justify-between mb-4">
					<p className="text-sm font-medium tracking-tight text-secondary-text">
						{title}
					</p>
					<div className="text-secondary-text/70 transition-transform duration-200 group-hover:scale-110">
						{icon}
					</div>
				</div>

				{/* Value */}
				<div className="mb-1">
					<span className="font-geist text-5xl font-normal tracking-tighter text-primary-text">
						{value.toLocaleString()}
					</span>
					<span className="text-secondary-text/60 text-lg font-light ml-1">
						/
					</span>
					<span className="text-secondary-text/60 text-lg font-light">
						{goal.toLocaleString()}
					</span>
					<span className="text-xs text-secondary-text font-light ml-1.5">
						{unit}
					</span>
				</div>

				{/* Subtitle */}
				<p className="text-xs text-secondary-text font-light">{subtitle}</p>

				{/* Progress indicator */}
				<div className="mt-3 flex items-center gap-2">
					<div className="flex-1 h-1 bg-border/50 rounded-full overflow-hidden">
						<div
							className="h-full bg-brand-cool rounded-full transition-all duration-500"
							style={{ width: `${Math.min(percentage, 100)}%` }}
						/>
					</div>
					<span className="text-xs font-medium text-secondary-text">
						{percentage}%
					</span>
				</div>
			</div>
		</div>
	);
}

export function FitnessOverview() {
	return (
		<div className="w-full space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h2 className="text-xl tracking-tight font-semibold text-primary-text">
					Today's{" "}
					<span className="font-accent italic text-brand-cool">Snapshot</span>
				</h2>
				<p className="text-xs text-secondary-text font-light">
					Last synced: Just now
				</p>
			</div>

			{/* Metric Cards Grid */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<MetricCard
					title="Calories Burned"
					value={mockData.caloriesBurned.value}
					goal={mockData.caloriesBurned.goal}
					unit="kcal"
					subtitle="Active burn today"
					icon={<Flame className="h-4 w-4" />}
				/>

				<MetricCard
					title="Steps"
					value={mockData.steps.value}
					goal={mockData.steps.goal}
					unit="steps"
					subtitle="Keep moving!"
					icon={<Footprints className="h-4 w-4" />}
				/>

				<MetricCard
					title="Calories Eaten"
					value={mockData.caloriesEaten.value}
					goal={mockData.caloriesEaten.goal}
					unit="kcal"
					subtitle="Nutrition intake"
					icon={<Utensils className="h-4 w-4" />}
				/>

				<MetricCard
					title="Protein"
					value={mockData.protein.value}
					goal={mockData.protein.goal}
					unit="g"
					subtitle="Daily protein goal"
					icon={<Beef className="h-4 w-4" />}
				/>
			</div>
		</div>
	);
}
