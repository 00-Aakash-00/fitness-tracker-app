"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import type {
	DashboardStatusMessage,
	InsightCard,
	InsightDetailSection,
	InsightMetric,
} from "@/lib/dashboard/wearable-dashboard.types";
import { cn } from "@/lib/utils";
import { DashboardIconGlyph } from "./dashboard-icon";

const toneStyles = {
	boost: {
		pill: "border-brand-cool/20 bg-brand-cool/10 text-brand-cool",
		icon: "bg-brand-cool/10 text-brand-cool",
		accent: "bg-brand-cool",
	},
	steady: {
		pill: "border-border/60 bg-secondary-surface/70 text-secondary-text",
		icon: "bg-secondary-surface text-secondary-text",
		accent: "bg-brand-soft",
	},
	recover: {
		pill: "border-brand-warm/20 bg-brand-warm/10 text-brand-warm",
		icon: "bg-brand-warm/10 text-brand-warm",
		accent: "bg-brand-warm",
	},
	neutral: {
		pill: "border-border/60 bg-secondary-surface/70 text-secondary-text",
		icon: "bg-secondary-surface text-secondary-text",
		accent: "bg-border",
	},
	warning: {
		pill: "border-brand-warm/20 bg-brand-warm/10 text-brand-warm",
		icon: "bg-brand-warm/10 text-brand-warm",
		accent: "bg-brand-warm",
	},
} as const;

const metricToneStyles = {
	good: "text-brand-cool",
	caution: "text-brand-warm",
	neutral: "text-primary-text",
} as const;

const focusableSelector = [
	"a[href]",
	"button:not([disabled])",
	"textarea:not([disabled])",
	"input:not([disabled])",
	"select:not([disabled])",
	"[tabindex]:not([tabindex='-1'])",
].join(", ");

function DetailSection({ section }: { section: InsightDetailSection }) {
	return (
		<section className="space-y-3">
			<div className="space-y-1">
				<h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-text">
					{section.title}
				</h4>
				{section.description ? (
					<p className="text-xs leading-relaxed text-secondary-text">
						{section.description}
					</p>
				) : null}
			</div>
			<div className="space-y-2.5">
				{section.metrics.map((metric) => (
					<DetailMetric
						key={`${section.title}-${metric.label}-${metric.value}`}
						metric={metric}
					/>
				))}
			</div>
		</section>
	);
}

function DetailMetric({ metric }: { metric: InsightMetric }) {
	return (
		<div className="flex items-start justify-between gap-4 rounded-lg border border-border/40 bg-secondary-surface/40 px-3 py-2.5">
			<span className="text-xs text-secondary-text">{metric.label}</span>
			<span
				className={cn(
					"text-right text-sm font-medium",
					metricToneStyles[metric.tone ?? "neutral"]
				)}
			>
				{metric.value}
			</span>
		</div>
	);
}

function cardModeLabel(mode: InsightCard["mode"]) {
	if (mode === "preview") return "preview";
	if (mode === "setup") return "setup";
	return null;
}

function cardValueClass(mode: InsightCard["mode"]) {
	if (mode === "preview") {
		return "text-2xl leading-tight sm:text-[2rem]";
	}

	if (mode === "setup") {
		return "text-[1.7rem] leading-tight sm:text-[2.1rem]";
	}

	return "text-3xl sm:text-4xl";
}

export function FitnessOverview({
	providerLabel,
	lastSyncedLabel,
	status,
	cards,
}: {
	providerLabel: string;
	lastSyncedLabel: string;
	status: DashboardStatusMessage;
	cards: InsightCard[];
}) {
	const [active, setActive] = useState<InsightCard | null>(null);
	const ref = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const activeTriggerRef = useRef<HTMLButtonElement | null>(null);
	const id = useId();
	const prefersReducedMotion = useReducedMotion();
	const modalTransition = prefersReducedMotion
		? { duration: 0 }
		: { type: "spring" as const, stiffness: 280, damping: 28 };

	const closeModal = useCallback(() => {
		setActive(null);
	}, []);

	useEffect(() => {
		if (!active) {
			document.body.style.overflow = "auto";
			if (activeTriggerRef.current) {
				requestAnimationFrame(() => {
					activeTriggerRef.current?.focus();
				});
			}
			return;
		}

		document.body.style.overflow = "hidden";
		requestAnimationFrame(() => {
			closeButtonRef.current?.focus();
		});

		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				event.preventDefault();
				closeModal();
				return;
			}

			if (event.key !== "Tab" || !ref.current) {
				return;
			}

			const focusable = Array.from(
				ref.current.querySelectorAll<HTMLElement>(focusableSelector)
			);
			if (focusable.length === 0) {
				event.preventDefault();
				return;
			}

			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			const activeElement = document.activeElement;

			if (event.shiftKey && activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}

		window.addEventListener("keydown", onKeyDown);
		return () => {
			document.body.style.overflow = "auto";
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [active, closeModal]);

	useOutsideClick(ref, closeModal);

	return (
		<div className="w-full space-y-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h2 className="text-lg sm:text-xl tracking-tight font-semibold text-primary-text">
						{providerLabel}{" "}
						<span className="font-accent italic text-brand-cool">
							Insight Snapshot
						</span>
					</h2>
					<p className="mt-1 text-xs text-secondary-text">
						Recovery, sleep, load, and physiology translated into a cleaner
						operating view.
					</p>
				</div>
				<p className="text-xs font-light text-secondary-text">
					{lastSyncedLabel}
				</p>
			</div>

			<div
				className={cn(
					"rounded-xl border px-4 py-4 sm:px-5",
					toneStyles[status.tone].pill
				)}
			>
				<div className="flex items-start gap-3">
					<div
						className={cn(
							"flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
							toneStyles[status.tone].pill
						)}
					>
						<DashboardIconGlyph
							icon={status.tone === "recover" ? "shield" : "spark"}
							className="h-4 w-4"
						/>
					</div>
					<div className="space-y-1">
						<p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary-text">
							{status.eyebrow}
						</p>
						<h3 className="text-sm font-semibold text-primary-text">
							{status.title}
						</h3>
						<p className="text-xs leading-relaxed text-secondary-text">
							{status.description}
						</p>
					</div>
				</div>
			</div>

			<AnimatePresence>
				{active ? (
					<motion.button
						type="button"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={modalTransition}
						className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
						onClick={closeModal}
						aria-label="Close insight detail"
					/>
				) : null}
			</AnimatePresence>

			{active ? (
				<div className="fixed inset-0 z-50 grid place-items-center p-4">
					<motion.div
						layoutId={`card-${active.id}-${id}`}
						ref={ref}
						transition={modalTransition}
						role="dialog"
						aria-modal="true"
						aria-labelledby={`insight-title-${active.id}-${id}`}
						className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border/40 bg-primary-surface shadow-xl"
					>
						<div className="border-b border-border/30 px-4 py-4 sm:px-6 sm:py-5">
							<div className="flex items-start justify-between gap-4">
								<div className="space-y-3">
									<div className="flex flex-wrap items-center gap-2">
										<span
											className={cn(
												"inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
												toneStyles[active.tone].pill
											)}
										>
											{active.statusLabel}
										</span>
										{cardModeLabel(active.mode) ? (
											<span className="inline-flex items-center rounded-full border border-border/50 bg-secondary-surface/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-text">
												{cardModeLabel(active.mode)}
											</span>
										) : null}
										<span className="text-[10px] uppercase tracking-[0.18em] text-secondary-text">
											{active.title}
										</span>
									</div>
									<div>
										<h3
											id={`insight-title-${active.id}-${id}`}
											className={cn(
												"font-medium tracking-tight text-primary-text",
												cardValueClass(active.mode),
												active.mode === "live" ? "text-2xl sm:text-3xl" : ""
											)}
										>
											{active.value}
											{active.unit ? (
												<span className="ml-2 text-sm font-normal text-secondary-text">
													{active.unit}
												</span>
											) : null}
										</h3>
										{active.supportingValue ? (
											<p className="mt-1 text-sm text-secondary-text">
												{active.supportingValue}
											</p>
										) : null}
									</div>
									<p className="max-w-xl text-sm leading-relaxed text-secondary-text">
										{active.summary}
									</p>
								</div>

								<div className="flex items-start gap-3">
									<div
										className={cn(
											"hidden h-12 w-12 shrink-0 items-center justify-center rounded-full md:flex",
											toneStyles[active.tone].icon
										)}
									>
										<DashboardIconGlyph
											icon={active.icon}
											className="h-5 w-5"
										/>
									</div>
									<button
										ref={closeButtonRef}
										type="button"
										className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-primary-surface text-primary-text transition-colors hover:bg-secondary-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cool focus-visible:ring-offset-2"
										onClick={closeModal}
										aria-label="Close insight detail"
									>
										<X className="h-4 w-4" />
									</button>
								</div>
							</div>
						</div>

						<div className="max-h-[60vh] space-y-6 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
							{active.detailSections.map((section) => (
								<DetailSection
									key={`${active.id}-${section.title}`}
									section={section}
								/>
							))}
						</div>
					</motion.div>
				</div>
			) : null}

			<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
				{cards.map((card) => {
					const tone = toneStyles[card.tone];
					return (
						<motion.button
							key={card.id}
							type="button"
							layoutId={`card-${card.id}-${id}`}
							onClick={(event) => {
								activeTriggerRef.current = event.currentTarget;
								setActive(card);
							}}
							transition={modalTransition}
							className="group relative overflow-hidden rounded-xl border border-border/40 bg-primary-surface p-4 text-left shadow-sm transition-shadow duration-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cool focus-visible:ring-offset-2"
						>
							<div
								className={cn(
									"absolute inset-x-0 top-0 h-0.5 opacity-90",
									tone.accent
								)}
							/>
							<div className="space-y-4">
								<div className="flex items-start justify-between gap-3">
									<div className="space-y-2">
										<div className="flex flex-wrap items-center gap-2">
											<span
												className={cn(
													"inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
													tone.pill
												)}
											>
												{card.statusLabel}
											</span>
											{cardModeLabel(card.mode) ? (
												<span className="inline-flex items-center rounded-full border border-border/50 bg-secondary-surface/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-text">
													{cardModeLabel(card.mode)}
												</span>
											) : null}
										</div>
										<p className="text-sm font-medium tracking-tight text-secondary-text">
											{card.title}
										</p>
									</div>
									<div
										className={cn(
											"flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110",
											tone.icon
										)}
									>
										<DashboardIconGlyph icon={card.icon} className="h-4 w-4" />
									</div>
								</div>

								<div>
									<p
										className={cn(
											"font-geist font-normal tracking-tighter text-primary-text",
											cardValueClass(card.mode)
										)}
									>
										{card.value}
										{card.unit ? (
											<span className="ml-1.5 text-xs font-light text-secondary-text">
												{card.unit}
											</span>
										) : null}
									</p>
									{card.supportingValue ? (
										<p className="mt-1 text-sm text-secondary-text">
											{card.supportingValue}
										</p>
									) : null}
								</div>

								<div className="space-y-2">
									<p className="min-h-[3rem] text-xs leading-relaxed text-secondary-text">
										{card.summary}
									</p>
									<p className="text-[11px] text-secondary-text/80">
										{card.caption}
									</p>
								</div>
							</div>
						</motion.button>
					);
				})}
			</div>
		</div>
	);
}
