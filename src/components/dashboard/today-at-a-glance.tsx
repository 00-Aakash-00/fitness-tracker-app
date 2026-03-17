import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { TodayAtAGlance } from "@/lib/progress/progress.types";
import { cn } from "@/lib/utils";

const toneClasses = {
	positive: "border-brand-cool/25 bg-brand-cool/5",
	caution: "border-brand-warm/25 bg-brand-warm/10",
	neutral: "border-border/40 bg-secondary-surface/35",
} as const;

export function TodayAtAGlancePanel({ glance }: { glance: TodayAtAGlance }) {
	return (
		<section className="w-full space-y-3 rounded-xl border border-border/40 bg-primary-surface p-4 sm:p-5">
			<div className="space-y-1">
				<h2 className="text-lg tracking-tight font-semibold text-primary-text">
					Today{" "}
					<span className="font-accent italic text-brand-cool">
						At A Glance
					</span>
				</h2>
				<p className="text-sm font-medium text-primary-text">
					{glance.headline}
				</p>
				<p className="text-xs leading-relaxed text-secondary-text">
					{glance.subtitle}
				</p>
			</div>

			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
				{glance.items.map((item) => (
					<div
						key={item.id}
						className={cn(
							"rounded-xl border px-3.5 py-3.5",
							toneClasses[item.tone]
						)}
					>
						<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-text">
							{item.label}
						</p>
						<p className="mt-2 text-[1.45rem] font-medium tracking-tight text-primary-text">
							{item.value}
						</p>
						<p className="mt-1 text-xs leading-relaxed text-secondary-text">
							{item.detail}
						</p>
					</div>
				))}
			</div>

			<div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-secondary-surface/35 p-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-text">
						Primary Recommendation
					</p>
					<p className="text-sm font-semibold text-primary-text">
						{glance.primaryAction.title}
					</p>
					<p className="text-xs leading-relaxed text-secondary-text">
						{glance.primaryAction.description}
					</p>
				</div>
				<Button asChild className="min-w-40 rounded-lg">
					<Link href={glance.primaryAction.href}>
						{glance.primaryAction.label}
						<ArrowRight className="h-4 w-4" />
					</Link>
				</Button>
			</div>
		</section>
	);
}
