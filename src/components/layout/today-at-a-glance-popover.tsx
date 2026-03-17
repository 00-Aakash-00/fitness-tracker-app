"use client";

import { ArrowRight, ListEnd, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { TodayAtAGlance } from "@/lib/progress/progress.types";
import { cn } from "@/lib/utils";

const toneStyles = {
	positive: "border-brand-cool/25 bg-brand-cool/5",
	caution: "border-brand-warm/25 bg-brand-warm/10",
	neutral: "border-border/40 bg-secondary-surface/35",
} as const;

export function TodayAtAGlancePopover({
	glance,
}: {
	glance: TodayAtAGlance | null;
}) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button
				variant="ghost"
				size="sm"
				className="text-xs text-secondary-text hover:text-primary-text"
				onClick={() => setOpen((current) => !current)}
			>
				<ListEnd className="h-4 w-4" />
				<span className="ml-1.5 hidden lg:inline">Today</span>
			</Button>

			{open ? (
				<div className="fixed bottom-4 left-4 right-4 z-50 w-auto animate-in fade-in-0 slide-in-from-bottom-4 sm:left-auto sm:right-4 sm:w-[26rem]">
					<div className="relative">
						<Button
							onClick={() => setOpen(false)}
							variant="ghost"
							size="icon"
							className="absolute -right-1 -top-1 z-10 h-8 w-8 rounded-full bg-primary-surface shadow-md hover:bg-secondary-surface"
						>
							<X className="h-4 w-4" />
						</Button>

						<Card className="border-border/40 shadow-xl">
							<CardContent className="space-y-4 p-5">
								<div className="space-y-1">
									<h3 className="text-lg tracking-tight font-semibold text-primary-text">
										Today{" "}
										<span className="font-accent italic text-brand-cool">
											At A Glance
										</span>
									</h3>
									<p className="text-sm font-medium text-primary-text">
										{glance?.headline ?? "Your day, clarified"}
									</p>
									<p className="text-xs leading-relaxed text-secondary-text">
										{glance?.subtitle ??
											"Real sync, recovery, nutrition, and streak events will show up here once they exist."}
									</p>
								</div>

								<div className="grid gap-2 sm:grid-cols-2">
									{(glance?.items ?? []).map((item) => (
										<div
											key={item.id}
											className={cn(
												"rounded-xl border px-3 py-3.5",
												toneStyles[item.tone]
											)}
										>
											<div className="flex items-center justify-between gap-3">
												<span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-text">
													{item.label}
												</span>
												<span className="text-base font-medium tracking-tight text-primary-text">
													{item.value}
												</span>
											</div>
											<p className="mt-1 text-xs leading-relaxed text-secondary-text">
												{item.detail}
											</p>
										</div>
									))}
								</div>

								{glance ? (
									<div className="rounded-xl border border-border/40 bg-secondary-surface/40 p-3.5">
										<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-text">
											Next best action
										</p>
										<p className="mt-2 text-sm font-semibold text-primary-text">
											{glance.primaryAction.title}
										</p>
										<p className="mt-1 text-xs leading-relaxed text-secondary-text">
											{glance.primaryAction.description}
										</p>
										<Button
											asChild
											className="mt-3 w-full rounded-lg sm:w-auto"
										>
											<Link href={glance.primaryAction.href}>
												{glance.primaryAction.label}
												<ArrowRight className="h-4 w-4" />
											</Link>
										</Button>
									</div>
								) : (
									<div className="rounded-xl border border-dashed border-border/60 bg-secondary-surface/30 p-4 text-sm text-secondary-text">
										No real daily events yet. Once you connect a device or log
										activity, this popover will stop pretending and start
										helping.
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			) : null}
		</>
	);
}
