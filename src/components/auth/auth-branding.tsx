import { Sparkles } from "lucide-react";

import { AppLogo } from "@/components/layout/app-logo";

export function AuthBranding() {
	return (
		<div className="flex flex-col items-center gap-4">
			<AppLogo href="/" className="h-16 w-24" sizes="96px" priority />
			<div className="flex items-center gap-2 rounded-full border border-border bg-primary-surface px-4 py-2 shadow-sm">
				<Sparkles className="h-4 w-4 text-brand-cool" />
				<span className="font-primary text-sm font-medium text-primary-text">
					Your AI-Powered Fitness Assistant
				</span>
			</div>
		</div>
	);
}
