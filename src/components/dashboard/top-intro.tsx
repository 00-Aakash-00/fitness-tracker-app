import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { DashboardActionLink } from "@/lib/dashboard/wearable-dashboard.types";
import { DashboardIconGlyph } from "./dashboard-icon";

export function TopIntro({
	headline,
	highlight,
	description,
	providerLabel,
	actions,
}: {
	headline: string;
	highlight: string;
	description: string;
	providerLabel: string;
	actions: DashboardActionLink[];
}) {
	return (
		<div className="space-y-5">
			<div className="font-geist text-[28px] sm:text-[36px] md:text-[48px] font-medium leading-tight tracking-[-0.1rem] md:tracking-[-0.2rem] flex flex-col text-primary-text">
				<span>{headline}</span>
				<span className="inline font-geist font-semibold text-[32px] sm:text-[44px] md:text-[60px] animate-gradient bg-gradient-to-r from-brand-cool via-brand-soft to-brand-cool bg-clip-text text-transparent">
					{highlight}
				</span>
			</div>
			<p className="font-geist text-[12px] text-secondary-text leading-relaxed max-w-md">
				{description}
			</p>
			<div className="inline-flex items-center rounded-full border border-border/50 bg-primary-surface/80 px-3 py-1 text-[11px] font-medium text-secondary-text">
				<span className="font-geist uppercase tracking-[0.16em] text-[10px] text-brand-cool">
					Source
				</span>
				<span className="mx-2 h-1 w-1 rounded-full bg-border" />
				<span>{providerLabel}</span>
			</div>
			{actions.length > 0 ? (
				<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
					{actions.map((action) => (
						<Button
							key={action.id}
							asChild
							variant={action.tone === "primary" ? "default" : "outline"}
							className="h-10 justify-between rounded-xl px-4"
						>
							{action.navigationKind === "document" ? (
								<a href={action.href}>
									<span>{action.label}</span>
									{action.icon ? (
										<DashboardIconGlyph
											icon={action.icon}
											className="h-4 w-4"
										/>
									) : null}
								</a>
							) : (
								<Link href={action.href}>
									<span>{action.label}</span>
									{action.icon ? (
										<DashboardIconGlyph
											icon={action.icon}
											className="h-4 w-4"
										/>
									) : null}
								</Link>
							)}
						</Button>
					))}
				</div>
			) : null}
		</div>
	);
}
