import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type {
	ProgressChart,
	ProgressRange,
	ProgressSnapshot,
} from "@/lib/progress/progress.types";
import { cn } from "@/lib/utils";

const rangeOptions: ProgressRange[] = [7, 30, 90];

const toneClasses = {
	positive: "border-brand-cool/20 bg-brand-cool/5 text-brand-cool",
	caution: "border-brand-warm/20 bg-brand-warm/10 text-brand-warm",
	neutral: "border-border/40 bg-secondary-surface/35 text-secondary-text",
} as const;

export function ProgressDashboard({
	snapshot,
}: {
	snapshot: ProgressSnapshot;
}) {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="space-y-2">
					<div className="inline-flex rounded-full border border-border/50 bg-primary-surface px-3 py-1 text-[11px] font-medium text-secondary-text">
						Progress range: last {snapshot.rangeDays} days
					</div>
					<h1 className="text-3xl tracking-tight font-semibold text-primary-text">
						How you are{" "}
						<span className="font-accent italic text-brand-cool">Trending</span>
					</h1>
					<p className="max-w-3xl text-sm leading-relaxed text-secondary-text">
						Recovery, activity, nutrition, and consistency pulled into one view,
						with enough context to see improvement and drift without hunting
						across tabs.
					</p>
				</div>

				<div className="flex flex-wrap gap-2">
					{rangeOptions.map((range) => (
						<Button
							key={range}
							asChild
							variant={range === snapshot.rangeDays ? "default" : "outline"}
							size="sm"
							className="rounded-lg"
						>
							<Link href={`/dashboard/progress?range=${range}`}>{range}d</Link>
						</Button>
					))}
				</div>
			</div>

			{snapshot.emptyStateReasons.length > 0 ? (
				<div className="rounded-xl border border-brand-warm/25 bg-brand-warm/10 p-5">
					<div className="space-y-2">
						<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-warm">
							What is still missing
						</p>
						{snapshot.emptyStateReasons.map((reason) => (
							<p
								key={reason}
								className="text-sm leading-relaxed text-secondary-text"
							>
								{reason}
							</p>
						))}
					</div>
				</div>
			) : null}

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{snapshot.summaryCards.map((card) => (
					<div
						key={card.id}
						className={cn(
							"rounded-xl border border-border/40 bg-primary-surface p-5 shadow-sm",
							card.empty && "border-dashed"
						)}
					>
						<div className="space-y-3">
							<div className="flex items-start justify-between gap-3">
								<div className="space-y-1">
									<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-text">
										{card.label}
									</p>
									<p className="text-[1.75rem] font-medium tracking-tight text-primary-text">
										{card.value}
									</p>
								</div>
								<span
									className={cn(
										"rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
										toneClasses[card.tone]
									)}
								>
									{card.tone}
								</span>
							</div>
							<p className="text-sm leading-relaxed text-secondary-text">
								{card.detail}
							</p>
							<p className="text-xs text-secondary-text">{card.deltaLabel}</p>
						</div>
					</div>
				))}
			</div>

			<div className="space-y-4">
				{snapshot.charts.map((chart) => (
					<ProgressChartCard key={chart.id} chart={chart} />
				))}
			</div>

			<div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(20rem,24rem)]">
				<div className="rounded-xl border border-border/40 bg-primary-surface p-5 shadow-sm">
					<div className="space-y-3">
						<div className="space-y-1">
							<h2 className="text-lg tracking-tight font-semibold text-primary-text">
								Wins
							</h2>
							<p className="text-xs text-secondary-text">
								Where the recent window improved versus the one before it.
							</p>
						</div>
						{snapshot.wins.length > 0 ? (
							snapshot.wins.map((item) => (
								<div
									key={item}
									className="rounded-xl border border-brand-cool/20 bg-brand-cool/5 px-3 py-3 text-sm leading-relaxed text-primary-text"
								>
									{item}
								</div>
							))
						) : (
							<p className="text-sm text-secondary-text">
								No strong upward moves yet. More tracked days will make the
								comparison sharper.
							</p>
						)}
					</div>
				</div>

				<div className="rounded-xl border border-border/40 bg-primary-surface p-5 shadow-sm">
					<div className="space-y-3">
						<div className="space-y-1">
							<h2 className="text-lg tracking-tight font-semibold text-primary-text">
								Drift
							</h2>
							<p className="text-xs text-secondary-text">
								Where consistency or recovery softened in this range.
							</p>
						</div>
						{snapshot.drift.length > 0 ? (
							snapshot.drift.map((item) => (
								<div
									key={item}
									className="rounded-xl border border-brand-warm/20 bg-brand-warm/10 px-3 py-3 text-sm leading-relaxed text-primary-text"
								>
									{item}
								</div>
							))
						) : (
							<p className="text-sm text-secondary-text">
								No major regressions stood out in this window.
							</p>
						)}
					</div>
				</div>

				<div className="rounded-xl border border-border/40 bg-primary-surface p-5 shadow-sm">
					<div className="space-y-4 rounded-xl border border-brand-cool/20 bg-gradient-to-br from-brand-cool/5 via-primary-surface to-brand-soft/10 p-4">
						<div className="space-y-1">
							<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-cool">
								Next Best Action
							</p>
							<h2 className="text-lg tracking-tight font-semibold text-primary-text">
								{snapshot.nextBestAction.title}
							</h2>
						</div>
						<p className="text-sm leading-relaxed text-secondary-text">
							{snapshot.nextBestAction.description}
						</p>
						<Button asChild className="w-full rounded-lg">
							<Link href={snapshot.nextBestAction.href}>
								{snapshot.nextBestAction.label}
								<ArrowRight className="h-4 w-4" />
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

function ProgressChartCard({ chart }: { chart: ProgressChart }) {
	const values = chart.points.flatMap((point) =>
		[point.primary, point.secondary].filter(
			(value): value is number =>
				typeof value === "number" && Number.isFinite(value)
		)
	);

	if (values.length === 0) {
		return (
			<div className="rounded-xl border border-border/40 bg-primary-surface p-5 shadow-sm">
				<div className="space-y-1">
					<h2 className="text-lg tracking-tight font-semibold text-primary-text">
						{chart.title}
					</h2>
					<p className="text-sm text-secondary-text">{chart.description}</p>
				</div>
				<div className="pt-4">
					<div className="rounded-xl border border-dashed border-border/60 bg-secondary-surface/30 px-4 py-10 text-center text-sm text-secondary-text">
						{chart.emptyMessage}
					</div>
				</div>
			</div>
		);
	}

	const width = Math.max(720, chart.points.length * 22);
	const height = 220;
	const paddingX = 24;
	const paddingY = 16;
	const maxValue = Math.max(...values);
	const interval =
		chart.points.length <= 14 ? 1 : chart.points.length <= 35 ? 4 : 7;

	const mapX = (index: number) => {
		if (chart.points.length <= 1) {
			return width / 2;
		}
		return (
			paddingX + (index / (chart.points.length - 1)) * (width - paddingX * 2)
		);
	};

	const mapY = (value: number) => {
		const normalized = maxValue === 0 ? 0 : value / maxValue;
		return height - paddingY - normalized * (height - paddingY * 2);
	};

	const buildPath = (key: "primary" | "secondary") => {
		let path = "";
		chart.points.forEach((point, index) => {
			const value = point[key];
			if (value === null) {
				return;
			}

			const command = path.length === 0 ? "M" : "L";
			path += `${command}${mapX(index)} ${mapY(value)} `;
		});
		return path.trim();
	};

	const primaryPath = buildPath("primary");
	const secondaryPath = buildPath("secondary");

	return (
		<div className="rounded-xl border border-border/40 bg-primary-surface p-5 shadow-sm">
			<div className="space-y-2">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-1">
						<h2 className="text-lg tracking-tight font-semibold text-primary-text">
							{chart.title}
						</h2>
						<p className="text-sm text-secondary-text">{chart.description}</p>
					</div>
					<div className="flex items-center gap-3 text-[11px] text-secondary-text">
						<LegendSwatch
							className="bg-brand-cool"
							label={chart.primaryLabel}
						/>
						<LegendSwatch
							className="bg-brand-warm"
							label={chart.secondaryLabel}
						/>
					</div>
				</div>
			</div>
			<div className="space-y-4 pt-4">
				<div className="overflow-x-auto">
					<div className="min-w-[720px] rounded-xl border border-border/40 bg-secondary-surface/35 px-3 py-3">
						<svg
							viewBox={`0 0 ${width} ${height}`}
							className="h-60 w-full"
							role="img"
							aria-label={`${chart.primaryLabel} and ${chart.secondaryLabel} over time`}
						>
							{[0, 0.25, 0.5, 0.75, 1].map((tick) => {
								const y = height - paddingY - tick * (height - paddingY * 2);
								return (
									<line
										key={tick}
										x1={paddingX}
										x2={width - paddingX}
										y1={y}
										y2={y}
										stroke="rgba(107,114,128,0.14)"
										strokeWidth={1}
									/>
								);
							})}
							{secondaryPath ? (
								<path
									d={secondaryPath}
									fill="none"
									stroke="rgba(217,125,38,0.88)"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={3}
								/>
							) : null}
							{primaryPath ? (
								<path
									d={primaryPath}
									fill="none"
									stroke="rgba(29,131,171,0.96)"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={3.5}
								/>
							) : null}

							{chart.points.map((point, index) => (
								<g key={`${chart.id}-${point.date}`}>
									{point.secondary !== null ? (
										<circle
											cx={mapX(index)}
											cy={mapY(point.secondary)}
											r={4}
											fill="rgba(217,125,38,0.96)"
											stroke="white"
											strokeWidth={2}
										/>
									) : null}
									{point.primary !== null ? (
										<circle
											cx={mapX(index)}
											cy={mapY(point.primary)}
											r={4}
											fill="rgba(29,131,171,0.98)"
											stroke="white"
											strokeWidth={2}
										/>
									) : null}
								</g>
							))}
						</svg>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
					{chart.points
						.filter(
							(_, index) =>
								index % interval === 0 || index === chart.points.length - 1
						)
						.map((point) => (
							<div
								key={`${chart.id}-${point.date}-label`}
								className="rounded-lg border border-border/40 bg-secondary-surface/30 px-2 py-2 text-center"
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
			</div>
		</div>
	);
}

function LegendSwatch({
	className,
	label,
}: {
	className: string;
	label: string;
}) {
	return (
		<span className="inline-flex items-center gap-2">
			<span className={cn("h-2.5 w-2.5 rounded-full", className)} />
			<span>{label}</span>
		</span>
	);
}
