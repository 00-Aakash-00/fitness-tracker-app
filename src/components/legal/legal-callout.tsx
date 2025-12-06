import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const calloutVariants = cva(
	"my-6 rounded-lg border-l-4 p-4 font-secondary text-sm",
	{
		variants: {
			variant: {
				info: "border-brand-cool bg-brand-cool/5 text-primary-text",
				warning: "border-brand-warm bg-brand-warm/5 text-primary-text",
				important: "border-brand-deep bg-brand-deep/5 text-primary-text",
			},
		},
		defaultVariants: {
			variant: "info",
		},
	}
);

interface LegalCalloutProps extends VariantProps<typeof calloutVariants> {
	title?: string;
	children: ReactNode;
	className?: string;
}

const icons = {
	info: Info,
	warning: AlertTriangle,
	important: AlertCircle,
};

export function LegalCallout({
	variant = "info",
	title,
	children,
	className,
}: LegalCalloutProps) {
	const Icon = icons[variant ?? "info"];

	return (
		<div className={cn(calloutVariants({ variant }), className)}>
			{title && (
				<div className="mb-2 flex items-center gap-2 font-primary font-semibold">
					<Icon className="h-4 w-4" />
					{title}
				</div>
			)}
			<div className="leading-relaxed">{children}</div>
		</div>
	);
}
