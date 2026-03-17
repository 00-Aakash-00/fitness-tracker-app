import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { SetupChecklistItem } from "@/lib/progress/progress.types";
import { cn } from "@/lib/utils";

export function SetupChecklist({ items }: { items: SetupChecklistItem[] }) {
	const completeCount = items.filter((item) => item.complete).length;

	return (
		<section className="w-full space-y-3 rounded-xl border border-border/40 bg-primary-surface p-4 sm:p-5">
			<div className="flex items-center justify-between gap-4">
				<div className="space-y-1">
					<h2 className="text-lg tracking-tight font-semibold text-primary-text">
						Setup{" "}
						<span className="font-accent italic text-brand-cool">Path</span>
					</h2>
					<p className="text-sm font-medium text-primary-text">
						Connected, but still forming
					</p>
					<p className="text-xs leading-relaxed text-secondary-text">
						The wearable is live, but the product gets meaningfully better once
						these basics are in place too.
					</p>
				</div>
				<div className="rounded-full border border-border/50 bg-secondary-surface/40 px-3 py-1 text-[11px] font-medium text-secondary-text">
					{completeCount} of {items.length} complete
				</div>
			</div>

			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{items.map((item) => (
					<div
						key={item.id}
						className={cn(
							"rounded-xl border p-4",
							item.complete
								? "border-brand-soft/35 bg-brand-soft/10"
								: "border-border/40 bg-secondary-surface/35"
						)}
					>
						<div className="flex items-start gap-3">
							<div
								className={cn(
									"mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
									item.complete
										? "border-brand-soft/25 bg-brand-soft/15 text-brand-warm"
										: "border-border/50 bg-primary-surface text-secondary-text"
								)}
							>
								{item.complete ? (
									<CheckCircle2 className="h-4 w-4" />
								) : (
									<Circle className="h-4 w-4" />
								)}
							</div>
							<div className="min-w-0 flex-1 space-y-2">
								<div className="space-y-1">
									<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-text">
										{item.complete ? "Complete" : "Next step"}
									</p>
									<p className="text-sm font-semibold text-primary-text">
										{item.label}
									</p>
								</div>
								<p className="text-xs leading-relaxed text-secondary-text">
									{item.description}
								</p>
								{item.complete ? (
									<span className="inline-flex rounded-full border border-brand-soft/25 bg-brand-soft/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-warm">
										Complete
									</span>
								) : (
									<Button
										asChild
										variant="outline"
										size="sm"
										className="h-8 rounded-lg"
									>
										<Link href={item.href}>Open</Link>
									</Button>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
