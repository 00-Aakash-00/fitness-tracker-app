"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Flame, Footprints, Utensils, Beef, X } from "lucide-react";
import { useOutsideClick } from "@/hooks/use-outside-click";

// Types
interface ActivityItem {
	activity: string;
	calories: number;
	duration: string;
}

interface HourlyStep {
	hour: string;
	steps: number;
}

interface MealItem {
	name: string;
	calories: number;
	time: string;
}

interface ProteinSource {
	name: string;
	protein: number;
	time: string;
}

interface MetricData {
	id: string;
	title: string;
	value: number;
	goal: number;
	unit: string;
	subtitle: string;
	icon: React.ReactNode;
	breakdown: ActivityItem[] | HourlyStep[] | MealItem[] | ProteinSource[];
	breakdownType: "activity" | "hourly" | "meal" | "protein";
}

// Mock data with detailed breakdowns
const metricsData: MetricData[] = [
	{
		id: "calories-burned",
		title: "Calories Burned",
		value: 1847,
		goal: 2200,
		unit: "kcal",
		subtitle: "Active burn today",
		icon: <Flame className="h-4 w-4" />,
		breakdownType: "activity",
		breakdown: [
			{ activity: "Morning Walk", calories: 320, duration: "45 min" },
			{ activity: "Gym Workout", calories: 580, duration: "1 hr" },
			{ activity: "Evening Jog", calories: 420, duration: "30 min" },
			{ activity: "Daily Movement", calories: 527, duration: "Throughout" },
		] as ActivityItem[],
	},
	{
		id: "steps",
		title: "Steps",
		value: 8432,
		goal: 10000,
		unit: "steps",
		subtitle: "Keep moving!",
		icon: <Footprints className="h-4 w-4" />,
		breakdownType: "hourly",
		breakdown: [
			{ hour: "6 AM", steps: 450 },
			{ hour: "7 AM", steps: 1200 },
			{ hour: "8 AM", steps: 890 },
			{ hour: "9 AM", steps: 320 },
			{ hour: "10 AM", steps: 540 },
			{ hour: "11 AM", steps: 680 },
			{ hour: "12 PM", steps: 920 },
			{ hour: "1 PM", steps: 450 },
			{ hour: "2 PM", steps: 380 },
			{ hour: "3 PM", steps: 720 },
			{ hour: "4 PM", steps: 560 },
			{ hour: "5 PM", steps: 1322 },
		] as HourlyStep[],
	},
	{
		id: "calories-eaten",
		title: "Calories Eaten",
		value: 1520,
		goal: 2000,
		unit: "kcal",
		subtitle: "Nutrition intake",
		icon: <Utensils className="h-4 w-4" />,
		breakdownType: "meal",
		breakdown: [
			{ name: "Oatmeal with Berries", calories: 350, time: "8:00 AM" },
			{ name: "Grilled Chicken Salad", calories: 480, time: "12:30 PM" },
			{ name: "Protein Shake", calories: 220, time: "3:00 PM" },
			{ name: "Salmon with Vegetables", calories: 470, time: "7:00 PM" },
		] as MealItem[],
	},
	{
		id: "protein",
		title: "Protein",
		value: 87,
		goal: 120,
		unit: "g",
		subtitle: "Daily protein goal",
		icon: <Beef className="h-4 w-4" />,
		breakdownType: "protein",
		breakdown: [
			{ name: "Eggs (3)", protein: 18, time: "8:00 AM" },
			{ name: "Chicken Breast", protein: 35, time: "12:30 PM" },
			{ name: "Protein Shake", protein: 24, time: "3:00 PM" },
			{ name: "Salmon Fillet", protein: 10, time: "7:00 PM" },
		] as ProteinSource[],
	},
];

// Breakdown content components
function ActivityBreakdown({ items }: { items: ActivityItem[] }) {
	return (
		<div className="space-y-3">
			{items.map((item, index) => (
				<div
					key={index}
					className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
				>
					<div className="flex-1">
						<p className="text-sm font-medium text-primary-text">
							{item.activity}
						</p>
						<p className="text-xs text-secondary-text">{item.duration}</p>
					</div>
					<div className="text-right">
						<p className="font-geist text-lg font-medium text-primary-text">
							{item.calories}
						</p>
						<p className="text-xs text-secondary-text">kcal</p>
					</div>
				</div>
			))}
		</div>
	);
}

function HourlyBreakdown({ items }: { items: HourlyStep[] }) {
	const maxSteps = Math.max(...items.map((i) => i.steps));

	return (
		<div className="space-y-2">
			{items.map((item, index) => (
				<div key={index} className="flex items-center gap-3">
					<span className="text-xs text-secondary-text w-12 shrink-0">
						{item.hour}
					</span>
					<div className="flex-1 h-2 bg-border/30 rounded-full overflow-hidden">
						<div
							className="h-full bg-brand-cool rounded-full transition-all duration-300"
							style={{ width: `${(item.steps / maxSteps) * 100}%` }}
						/>
					</div>
					<span className="font-geist text-sm font-medium text-primary-text w-14 text-right">
						{item.steps.toLocaleString()}
					</span>
				</div>
			))}
		</div>
	);
}

function MealBreakdown({ items }: { items: MealItem[] }) {
	return (
		<div className="space-y-3">
			{items.map((item, index) => (
				<div
					key={index}
					className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
				>
					<div className="flex-1">
						<p className="text-sm font-medium text-primary-text">{item.name}</p>
						<p className="text-xs text-secondary-text">{item.time}</p>
					</div>
					<div className="text-right">
						<p className="font-geist text-lg font-medium text-primary-text">
							{item.calories}
						</p>
						<p className="text-xs text-secondary-text">kcal</p>
					</div>
				</div>
			))}
		</div>
	);
}

function ProteinBreakdown({ items }: { items: ProteinSource[] }) {
	return (
		<div className="space-y-3">
			{items.map((item, index) => (
				<div
					key={index}
					className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
				>
					<div className="flex-1">
						<p className="text-sm font-medium text-primary-text">{item.name}</p>
						<p className="text-xs text-secondary-text">{item.time}</p>
					</div>
					<div className="text-right">
						<p className="font-geist text-lg font-medium text-primary-text">
							{item.protein}g
						</p>
						<p className="text-xs text-secondary-text">protein</p>
					</div>
				</div>
			))}
		</div>
	);
}

function BreakdownContent({ metric }: { metric: MetricData }) {
	switch (metric.breakdownType) {
		case "activity":
			return <ActivityBreakdown items={metric.breakdown as ActivityItem[]} />;
		case "hourly":
			return <HourlyBreakdown items={metric.breakdown as HourlyStep[]} />;
		case "meal":
			return <MealBreakdown items={metric.breakdown as MealItem[]} />;
		case "protein":
			return <ProteinBreakdown items={metric.breakdown as ProteinSource[]} />;
		default:
			return null;
	}
}

export function FitnessOverview() {
	const [active, setActive] = useState<MetricData | null>(null);
	const ref = useRef<HTMLDivElement>(null);
	const id = useId();

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setActive(null);
			}
		}

		if (active) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "auto";
		}

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [active]);

	useOutsideClick(ref, () => setActive(null));

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

			{/* Backdrop */}
			<AnimatePresence>
				{active && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
					/>
				)}
			</AnimatePresence>

			{/* Expanded Card Modal */}
			{active && (
				<div className="fixed inset-0 grid place-items-center z-50 p-4">
					<motion.button
						key={`button-${active.id}-${id}`}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0, transition: { duration: 0.05 } }}
						className="absolute top-4 right-4 lg:hidden flex items-center justify-center bg-primary-surface rounded-full h-8 w-8 shadow-md z-10"
						onClick={() => setActive(null)}
					>
						<X className="h-4 w-4 text-primary-text" />
					</motion.button>

					<motion.div
						layoutId={`card-${active.id}-${id}`}
						ref={ref}
						transition={{ type: "spring", stiffness: 300, damping: 30 }}
						className="w-full max-w-md bg-primary-surface rounded-2xl shadow-xl overflow-hidden border border-border/40"
					>
						{/* Card Header */}
						<div className="p-5 border-b border-border/30">
							<div className="flex items-start justify-between mb-4">
								<motion.p
									layoutId={`title-${active.id}-${id}`}
									transition={{ type: "spring", stiffness: 300, damping: 30 }}
									className="text-sm font-medium tracking-tight text-secondary-text"
								>
									{active.title}
								</motion.p>
								<motion.div
									layoutId={`icon-${active.id}-${id}`}
									transition={{ type: "spring", stiffness: 300, damping: 30 }}
									className="text-secondary-text/70"
								>
									{active.icon}
								</motion.div>
							</div>

							<div className="mb-1">
								<motion.span
									layoutId={`value-${active.id}-${id}`}
									transition={{ type: "spring", stiffness: 300, damping: 30 }}
									className="font-geist text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tighter text-primary-text"
								>
									{active.value.toLocaleString()}
								</motion.span>
								<span className="text-secondary-text/60 text-lg font-light ml-1">
									/
								</span>
								<span className="text-secondary-text/60 text-lg font-light">
									{active.goal.toLocaleString()}
								</span>
								<span className="text-xs text-secondary-text font-light ml-1.5">
									{active.unit}
								</span>
							</div>

							<p className="text-xs text-secondary-text font-light">
								{active.subtitle}
							</p>

							{/* Progress bar */}
							<div className="mt-3 flex items-center gap-2">
								<div className="flex-1 h-1 bg-border/50 rounded-full overflow-hidden">
									<motion.div
										className="h-full bg-brand-cool rounded-full"
										initial={{ width: 0 }}
										animate={{
											width: `${Math.min((active.value / active.goal) * 100, 100)}%`,
										}}
										transition={{ duration: 0.5, ease: "easeOut" }}
									/>
								</div>
								<span className="text-xs font-medium text-secondary-text">
									{Math.round((active.value / active.goal) * 100)}%
								</span>
							</div>
						</div>

						{/* Breakdown Content */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="p-5 max-h-[50vh] overflow-y-auto"
						>
							<p className="text-xs font-medium text-secondary-text uppercase tracking-wider mb-4">
								Breakdown
							</p>
							<BreakdownContent metric={active} />
						</motion.div>
					</motion.div>
				</div>
			)}

			{/* Metric Cards Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
				{metricsData.map((metric) => {
					const percentage = Math.round((metric.value / metric.goal) * 100);
					const isActive = active?.id === metric.id;

					return (
						<motion.div
							key={metric.id}
							layoutId={`card-${metric.id}-${id}`}
							onClick={() => !isActive && setActive(metric)}
							transition={{ type: "spring", stiffness: 300, damping: 30 }}
							className={`p-5 rounded-xl bg-primary-surface border border-border/40 cursor-pointer transition-shadow duration-300 hover:shadow-md group ${isActive ? "opacity-0 pointer-events-none" : ""}`}
						>
							<div className="relative">
								{/* Header */}
								<div className="flex items-start justify-between mb-4">
									<motion.p
										layoutId={`title-${metric.id}-${id}`}
										transition={{ type: "spring", stiffness: 300, damping: 30 }}
										className="text-sm font-medium tracking-tight text-secondary-text"
									>
										{metric.title}
									</motion.p>
									<motion.div
										layoutId={`icon-${metric.id}-${id}`}
										transition={{ type: "spring", stiffness: 300, damping: 30 }}
										className="text-secondary-text/70 transition-transform duration-200 group-hover:scale-110"
									>
										{metric.icon}
									</motion.div>
								</div>

								{/* Value */}
								<div className="mb-1">
									<motion.span
										layoutId={`value-${metric.id}-${id}`}
										transition={{ type: "spring", stiffness: 300, damping: 30 }}
										className="font-geist text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tighter text-primary-text"
									>
										{metric.value.toLocaleString()}
									</motion.span>
									<span className="text-secondary-text/60 text-lg font-light ml-1">
										/
									</span>
									<span className="text-secondary-text/60 text-lg font-light">
										{metric.goal.toLocaleString()}
									</span>
									<span className="text-xs text-secondary-text font-light ml-1.5">
										{metric.unit}
									</span>
								</div>

								{/* Subtitle */}
								<p className="text-xs text-secondary-text font-light">
									{metric.subtitle}
								</p>

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
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}
