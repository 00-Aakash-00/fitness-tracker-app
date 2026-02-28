const weeklyActivityPlaceholder = [
	{ day: "M", minutes: 132 },
	{ day: "T", minutes: 278 },
	{ day: "W", minutes: 167 },
	{ day: "T", minutes: 196 },
	{ day: "F", minutes: 265 },
	{ day: "S", minutes: 180 },
	{ day: "S", minutes: 143 },
];

const yAxisTicks = [0, 50, 100, 150, 200, 250];
const chartMaxValue = 300;

export function WeeklyActivitySummary() {
	return (
		<section className="w-full space-y-3">
			<div className="flex items-center justify-between">
				<h2 className="text-lg tracking-tight font-semibold text-primary-text">
					Weekly Activity{" "}
					<span className="font-accent italic text-brand-cool">Summary</span>
				</h2>
				<span className="text-xs text-secondary-text">Placeholder</span>
			</div>

			<div className="rounded-xl border border-border/40 bg-primary-surface p-4 sm:p-5">
				<h3 className="text-base font-medium text-primary-text mb-4">
					Active Minutes This Week
				</h3>

				<div className="grid grid-cols-[2.25rem_1fr] gap-3">
					<div className="relative h-52">
						{yAxisTicks
							.slice()
							.reverse()
							.map((tick, index) => (
								<span
									key={tick}
									className={`absolute left-0 text-[11px] text-secondary-text ${
										index === 0 ? "top-0" : ""
									} ${index === yAxisTicks.length - 1 ? "bottom-0" : ""}`}
									style={{
										top:
											index === 0 || index === yAxisTicks.length - 1
												? undefined
												: `${(index / (yAxisTicks.length - 1)) * 100}%`,
										transform:
											index === 0
												? "translateY(-50%)"
												: index === yAxisTicks.length - 1
													? "translateY(50%)"
													: "translateY(-50%)",
									}}
								>
									{tick}
								</span>
							))}
					</div>

					<div className="relative h-52">
						<div className="absolute inset-0 flex flex-col justify-between">
							{yAxisTicks
								.slice()
								.reverse()
								.map((tick) => (
									<div key={`grid-${tick}`} className="h-px bg-border/70" />
								))}
						</div>

						<div
							className="relative z-10 h-full flex items-end justify-between gap-3"
							role="img"
							aria-label="Weekly active minutes placeholder chart"
						>
							{weeklyActivityPlaceholder.map((item, index) => {
								const barHeight = (item.minutes / chartMaxValue) * 100;

								return (
									<div
										key={`${item.day}-${item.minutes}-${index}`}
										className="flex-1 min-w-0 flex flex-col items-center justify-end gap-2"
									>
										<span className="font-geist text-xs font-medium text-primary-text">
											{item.minutes}
										</span>
										<div className="h-44 w-full flex items-end">
											<div
												className="w-full rounded-t-md bg-brand-cool/95"
												style={{ height: `${barHeight}%` }}
											/>
										</div>
										<span className="font-geist text-xs text-secondary-text">
											{item.day}
										</span>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
