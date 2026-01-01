import { Wand2 } from "lucide-react";

import { AppLogo } from "@/components/layout/app-logo";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";

export function AuthBranding() {
	return (
		<div className="flex flex-col items-center gap-4">
			<AppLogo href="/" className="h-20 w-[120px]" sizes="120px" priority />
			<div className="flex items-center gap-2 rounded-full border border-border bg-primary-surface px-4 py-2 shadow-sm">
				<Wand2 className="h-4 w-4 text-brand-cool" />
				<AnimatedShinyText className="mx-0 max-w-none font-primary text-sm font-medium text-primary-text/80">
					Your AI-Powered Fitness Assistant
				</AnimatedShinyText>
			</div>
		</div>
	);
}
