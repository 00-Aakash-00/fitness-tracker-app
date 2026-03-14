import type {
	DashboardJourneyStep,
	DashboardState,
	DashboardTrendSummary,
	TrendPoint,
} from "@/lib/dashboard/wearable-dashboard.types";
import { cn } from "@/lib/utils";
import { DashboardIconGlyph } from "./dashboard-icon";

const chartHeight = 208;
const chartWidth = 640;
const chartPaddingX = 24;
const chartPaddingY = 16;
const yAxisTicks = [0, 25, 50, 75, 100];

export function WeeklyActivitySummary({
	state,
	trend,
	journeySteps,
}: {
	state: DashboardState;
	trend: DashboardTrendSummary;
	journeySteps: DashboardJourneyStep[];
}) {
	const validPointCount = trend.points.filter(
		(point) => point.primary !== null && point.secondary !== null
	).length;
	const showTimeline =
		state === "none" ||
		state === "syncing" ||
		state === "conflict" ||
		(state === "baseline_forming" && validPointCount < 3);
	const hasPoints = trend.points.length > 0;
	const primaryPath = hasPoints ? buildLinePath(trend.points, "primary") : "";
	const secondaryPath = hasPoints
		? buildLinePath(trend.points, "secondary")
		: "";
	const chartSummary = buildTrendNarrative(trend);

	return (
		<section className="w-full space-y-3">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h2 className="text-lg tracking-tight font-semibold text-primary-text">
						{showTimeline ? "Your First Week" : trend.title}{" "}
						<span className="font-accent italic text-brand-cool">
							{showTimeline ? "Timeline" : "View"}
						</span>
					</h2>
					<p className="mt-1 text-xs text-secondary-text">
						{showTimeline ? getTimelineDescription(state) : trend.description}
					</p>
				</div>
				{showTimeline ? (
					<span className="rounded-full border border-border/50 bg-secondary-surface/50 px-3 py-1 text-[11px] font-medium text-secondary-text">
						{journeySteps.filter((step) => step.state === "complete").length} of{" "}
						{journeySteps.length} steps complete
					</span>
				) : (
					<div className="flex items-center gap-3 text-[11px] text-secondary-text">
						<LegendSwatch
							className="bg-brand-cool"
							label={trend.primaryLabel}
						/>
						<LegendSwatch
							className="bg-brand-warm"
							label={trend.secondaryLabel}
						/>
					</div>
				)}
			</div>

			<div className="rounded-xl border border-border/40 bg-primary-surface p-4 sm:p-5">
				{showTimeline ? (
					<div className="space-y-4">
						<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
							{journeySteps.map((step, index) => (
								<JourneyStepCard
									key={step.id}
									step={step}
									showConnector={index < journeySteps.length - 1}
								/>
							))}
						</div>

						<div className="rounded-xl border border-border/40 bg-secondary-surface/35 px-4 py-3.5">
							<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-text">
								What happens next
							</p>
							<p className="mt-2 text-sm font-medium text-primary-text">
								{buildJourneyNarrative(journeySteps)}
							</p>
							<p className="mt-1 text-xs leading-relaxed text-secondary-text">
								Once three complete scored days exist, the dashboard swaps this
								timeline for the live 7-day balance view.
							</p>
						</div>
					</div>
				) : hasPoints ? (
					<div className="space-y-5">
						<div className="relative">
							<div className="absolute inset-y-0 left-0 flex w-7 flex-col justify-between text-[10px] text-secondary-text">
								{yAxisTicks
									.slice()
									.reverse()
									.map((tick) => (
										<span key={tick}>{tick}</span>
									))}
							</div>
							<div className="ml-8 overflow-hidden rounded-xl border border-border/40 bg-secondary-surface/35 px-3 py-3">
								<svg
									viewBox={`0 0 ${chartWidth} ${chartHeight}`}
									className="h-56 w-full"
									role="img"
									aria-label={`${trend.primaryLabel} and ${trend.secondaryLabel} over the last seven days`}
								>
									{yAxisTicks.map((tick) => {
										const y = mapValueToY(tick);
										return (
											<line
												key={tick}
												x1={chartPaddingX}
												x2={chartWidth - chartPaddingX}
												y1={y}
												y2={y}
												stroke="rgba(107,114,128,0.12)"
												strokeWidth={1}
											/>
										);
									})}

									<path
										d={secondaryPath}
										fill="none"
										stroke="rgba(217,125,38,0.7)"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={3}
									/>
									<path
										d={primaryPath}
										fill="none"
										stroke="rgba(29,131,171,0.92)"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={3.5}
									/>

									{trend.points.map((point, index) => {
										const x = mapIndexToX(index, trend.points.length);
										return (
											<g key={`${point.dateLabel}-${point.label}`}>
												{point.secondary !== null ? (
													<circle
														cx={x}
														cy={mapValueToY(point.secondary)}
														r={4}
														fill="rgba(217,125,38,0.92)"
														stroke="white"
														strokeWidth={2}
													/>
												) : null}
												{point.primary !== null ? (
													<circle
														cx={x}
														cy={mapValueToY(point.primary)}
														r={point.best ? 5 : 4}
														fill="rgba(29,131,171,0.98)"
														stroke={point.best ? "rgba(223,178,85,1)" : "white"}
														strokeWidth={point.best ? 3 : 2}
													/>
												) : null}
											</g>
										);
									})}
								</svg>
							</div>
						</div>

						<div className="ml-8 grid grid-cols-7 gap-2">
							{trend.points.map((point) => (
								<div
									key={`${point.dateLabel}-${point.fullLabel}`}
									className={cn(
										"rounded-lg border px-2 py-2 text-center",
										point.best
											? "border-brand-soft/40 bg-brand-soft/10"
											: "border-border/30 bg-secondary-surface/30"
									)}
								>
									<p className="text-[11px] font-medium text-primary-text">
										{point.label}
									</p>
									<p className="mt-1 text-[10px] text-brand-cool">
										{point.primaryDisplay}
									</p>
									<p className="text-[10px] text-brand-warm">
										{point.secondaryDisplay}
									</p>
								</div>
							))}
						</div>

						<div className="rounded-xl border border-border/40 bg-secondary-surface/35 px-4 py-3.5">
							<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-text">
								Text summary
							</p>
							<p className="mt-2 text-sm leading-relaxed text-primary-text">
								{chartSummary}
							</p>
						</div>
					</div>
				) : (
					<div className="rounded-xl border border-dashed border-border/60 bg-secondary-surface/30 px-4 py-12 text-center">
						<p className="text-sm font-medium text-primary-text">
							{trend.emptyMessage ??
								"Waiting for enough data to plot the week."}
						</p>
						<p className="mt-2 text-xs leading-relaxed text-secondary-text">
							The chart becomes more useful once both daily score streams have
							at least a few completed entries.
						</p>
					</div>
				)}

				<div className="mt-5 grid gap-3 md:grid-cols-3">
					<SummaryTile
						label="7-day averages"
						value={trend.primaryAverageLabel}
						supporting={trend.secondaryAverageLabel}
					/>
					<SummaryTile label="Best day" value={trend.bestDayLabel} />
					<SummaryTile label="Strongest streak" value={trend.streakLabel} />
				</div>
			</div>
		</section>
	);
}

function JourneyStepCard({
	step,
	showConnector,
}: {
	step: DashboardJourneyStep;
	showConnector: boolean;
}) {
	return (
		<article
			className={cn(
				"relative rounded-xl border p-3.5",
				step.state === "current"
					? "border-brand-cool/35 bg-brand-cool/5"
					: step.state === "complete"
						? "border-brand-soft/35 bg-brand-soft/10"
						: "border-border/40 bg-secondary-surface/35"
			)}
		>
			{showConnector ? (
				<div className="absolute right-[-0.55rem] top-1/2 hidden h-px w-4 -translate-y-1/2 bg-border xl:block" />
			) : null}
			<div className="flex items-start gap-3">
				<div
					className={cn(
						"flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
						step.state === "current"
							? "border-brand-cool/25 bg-brand-cool/10 text-brand-cool"
							: step.state === "complete"
								? "border-brand-soft/25 bg-brand-soft/15 text-brand-warm"
								: "border-border/50 bg-primary-surface text-secondary-text"
					)}
				>
					<DashboardIconGlyph icon={step.icon} className="h-4 w-4" />
				</div>
				<div className="space-y-1">
					<span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-text">
						{step.state === "complete"
							? "Complete"
							: step.state === "current"
								? "Current"
								: "Upcoming"}
					</span>
					<h3 className="text-sm font-semibold text-primary-text">
						{step.title}
					</h3>
					<p className="text-xs leading-relaxed text-secondary-text">
						{step.description}
					</p>
				</div>
			</div>
		</article>
	);
}

function getTimelineDescription(state: DashboardState) {
	if (state === "syncing") {
		return "Your device is connected. The first complete sleep unlocks the first scored guidance.";
	}

	if (state === "baseline_forming") {
		return "Early patterns are starting to form, but the weekly balance view sharpens after a few more complete days.";
	}

	if (state === "conflict") {
		return "Resolve the extra connection first so the dashboard can build one clean baseline.";
	}

	return "Connect one wearable, let the first full sync arrive, then the dashboard turns those signals into a weekly pattern.";
}

function buildJourneyNarrative(journeySteps: DashboardJourneyStep[]) {
	const currentStep =
		journeySteps.find((step) => step.state === "current") ??
		journeySteps[journeySteps.length - 1];

	return currentStep
		? `${currentStep.title}: ${currentStep.description}`
		: "Connect one wearable and complete your first full sleep to start the dashboard journey.";
}

function buildTrendNarrative(trend: DashboardTrendSummary) {
	return `${trend.primaryAverageLabel}. ${trend.secondaryAverageLabel}. Best day: ${trend.bestDayLabel}. Strongest streak: ${trend.streakLabel}.`;
}

function LegendSwatch({
	className,
	label,
}: {
	className: string;
	label: string;
}) {
	return (
		<div className="flex items-center gap-1.5">
			<span className={cn("h-2.5 w-2.5 rounded-full", className)} />
			<span>{label}</span>
		</div>
	);
}

function SummaryTile({
	label,
	value,
	supporting,
}: {
	label: string;
	value: string;
	supporting?: string;
}) {
	return (
		<div className="rounded-xl border border-border/40 bg-secondary-surface/35 px-3 py-3.5">
			<p className="text-[10px] uppercase tracking-[0.18em] text-secondary-text">
				{label}
			</p>
			<p className="mt-2 text-sm font-medium text-primary-text">{value}</p>
			{supporting ? (
				<p className="mt-1 text-xs text-secondary-text">{supporting}</p>
			) : null}
		</div>
	);
}

function buildLinePath(points: TrendPoint[], key: "primary" | "secondary") {
	let hasStarted = false;

	return points
		.map((point, index) => {
			const value = point[key];
			if (value === null) {
				hasStarted = false;
				return null;
			}

			const command = hasStarted ? "L" : "M";
			hasStarted = true;
			return `${command} ${mapIndexToX(index, points.length)} ${mapValueToY(value)}`;
		})
		.filter((point): point is string => point !== null)
		.join(" ");
}

function mapIndexToX(index: number, length: number) {
	if (length <= 1) {
		return chartWidth / 2;
	}

	const availableWidth = chartWidth - chartPaddingX * 2;
	return chartPaddingX + (availableWidth / (length - 1)) * index;
}

function mapValueToY(value: number) {
	const clamped = Math.max(0, Math.min(100, value));
	const availableHeight = chartHeight - chartPaddingY * 2;
	return chartHeight - chartPaddingY - (clamped / 100) * availableHeight;
}
