import type {
	ActionItem,
	DashboardState,
} from "@/lib/dashboard/wearable-dashboard.types";
import { cn } from "@/lib/utils";
import { DashboardIconGlyph } from "./dashboard-icon";

const toneClasses = {
	boost: "border-brand-cool/30 bg-brand-cool/5 text-brand-cool",
	steady: "border-border/60 bg-primary-surface text-primary-text",
	recover: "border-brand-warm/30 bg-brand-warm/10 text-brand-warm",
	neutral: "border-border/60 bg-primary-surface text-secondary-text",
	warning: "border-brand-warm/30 bg-brand-warm/10 text-brand-warm",
} as const;

function getPanelCopy(state: DashboardState) {
	switch (state) {
		case "none":
			return {
				title: "Start Here",
				subtitle:
					"One clear setup path. One wearable. Useful guidance within the first week.",
				rankLabel: "Ordered for setup",
			};
		case "syncing":
			return {
				title: "What To Expect",
				subtitle:
					"The first complete sleep unlocks the first real signals, then the baseline sharpens over the next few days.",
				rankLabel: "Ordered for setup",
			};
		case "conflict":
			return {
				title: "Resolve This First",
				subtitle:
					"The dashboard needs one clean biometric source before it can give trustworthy guidance.",
				rankLabel: "Ordered for resolution",
			};
		default:
			return {
				title: "Next Best Actions",
				subtitle:
					"The highest-leverage moves based on the latest recovery, sleep, load, and physiology picture.",
				rankLabel: "Ranked by leverage",
			};
	}
}

export function NextBestActions({
	actions,
	state,
}: {
	actions: ActionItem[];
	state: DashboardState;
}) {
	const panelCopy = getPanelCopy(state);

	return (
		<section className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="font-primary text-lg font-semibold text-primary-text">
					{panelCopy.title}
				</h2>
				<span className="text-[11px] text-secondary-text">
					{panelCopy.rankLabel}
				</span>
			</div>
			<p className="text-xs leading-relaxed text-secondary-text">
				{panelCopy.subtitle}
			</p>

			<div className="space-y-2.5">
				{actions.map((action, index) => (
					<article
						key={action.id}
						className="rounded-xl border border-border/40 bg-primary-surface/85 p-3.5 shadow-sm"
					>
						<div className="flex items-start gap-3">
							<div
								className={cn(
									"mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
									toneClasses[action.tone]
								)}
							>
								<DashboardIconGlyph icon={action.icon} className="h-4 w-4" />
							</div>
							<div className="min-w-0 flex-1 space-y-1">
								<div className="flex items-center gap-2">
									<span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-text">
										Action {index + 1}
									</span>
									<span className="h-1 w-1 rounded-full bg-border" />
									<span className="text-[10px] uppercase tracking-[0.18em] text-secondary-text">
										{action.tone}
									</span>
								</div>
								<h3 className="text-sm font-medium text-primary-text">
									{action.title}
								</h3>
								<p className="text-xs leading-relaxed text-secondary-text">
									{action.description}
								</p>
							</div>
						</div>
					</article>
				))}
			</div>
		</section>
	);
}
