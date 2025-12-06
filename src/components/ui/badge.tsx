import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cool focus:ring-offset-2",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-brand-cool text-white hover:bg-brand-deep",
				secondary:
					"border-transparent bg-secondary-surface text-secondary-text hover:bg-secondary-surface/80",
				destructive:
					"border-transparent bg-red-500 text-white hover:bg-red-600",
				outline: "text-primary-text border-border",
				cool: "border-transparent bg-brand-cool/10 text-brand-cool",
				warm: "border-transparent bg-brand-warm/10 text-brand-warm",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	);
}

export { Badge, badgeVariants };
