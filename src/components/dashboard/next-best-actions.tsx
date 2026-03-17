import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { NextBestAction } from "@/lib/progress/progress.types";
import { cn } from "@/lib/utils";

export function NextBestActions({ action }: { action: NextBestAction }) {
	return (
		<section className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-lg tracking-tight font-semibold text-primary-text">
					Next Best Action
				</h2>
				<span className="text-[11px] text-secondary-text">
					Ranked by leverage
				</span>
			</div>
			<p className="text-xs leading-relaxed text-secondary-text">
				One focused recommendation based on the latest recovery, activity,
				nutrition, and setup picture.
			</p>

			<article className="rounded-xl border border-border/40 bg-primary-surface/85 p-3.5 shadow-sm">
				<div className="flex items-start gap-3">
					<div
						className={cn(
							"mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
							action.tone === "primary"
								? "border-brand-cool/30 bg-brand-cool/5 text-brand-cool"
								: "border-border/60 bg-primary-surface text-secondary-text"
						)}
					>
						<ArrowRight className="h-4 w-4" />
					</div>
					<div className="min-w-0 flex-1 space-y-3">
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-text">
									Action 1
								</span>
								<span className="h-1 w-1 rounded-full bg-border" />
								<span className="text-[10px] uppercase tracking-[0.18em] text-secondary-text">
									{action.tone === "primary" ? "focus" : "support"}
								</span>
							</div>
							<h3 className="text-sm font-medium text-primary-text">
								{action.title}
							</h3>
							<p className="text-xs leading-relaxed text-secondary-text">
								{action.description}
							</p>
						</div>
						<Button
							asChild
							variant={action.tone === "primary" ? "default" : "outline"}
							className="h-10 justify-between rounded-xl px-4"
						>
							<Link href={action.href}>
								<span>{action.label}</span>
								<ArrowRight className="h-4 w-4" />
							</Link>
						</Button>
					</div>
				</div>
			</article>
		</section>
	);
}
