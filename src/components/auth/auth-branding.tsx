import { Wand2 } from "lucide-react";

import { AppLogo } from "@/components/layout/app-logo";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";

export function AuthBranding() {
	return (
		<div className="flex flex-col items-center gap-4">
			<AppLogo href="/" className="h-20 w-[120px]" sizes="120px" priority />
			<div className="flex items-center gap-2 rounded-full border border-border bg-primary-surface px-4 py-1.5 shadow-sm">
				<Wand2 className="h-3.5 w-3.5 text-brand-cool" />
				<AnimatedShinyText
					className="font-primary text-[13px] font-medium leading-none text-primary-text/90"
					shimmerWidth={140}
				>
					Your AI-Powered Fitness Assistant
				</AnimatedShinyText>
			</div>
		</div>
	);
}
