import {
	Activity,
	ArrowUpRight,
	HeartPulse,
	MoonStar,
	Shield,
	Sparkles,
	Watch,
	Wind,
} from "lucide-react";
import type { DashboardIcon } from "@/lib/dashboard/wearable-dashboard.types";
import { cn } from "@/lib/utils";

const iconMap = {
	activity: Activity,
	arrow: ArrowUpRight,
	heart: HeartPulse,
	lungs: Wind,
	moon: MoonStar,
	shield: Shield,
	spark: Sparkles,
	watch: Watch,
} satisfies Record<DashboardIcon, typeof Activity>;

export function DashboardIconGlyph({
	icon,
	className,
}: {
	icon: DashboardIcon;
	className?: string;
}) {
	const Icon = iconMap[icon];

	return <Icon className={cn("h-4 w-4", className)} />;
}
