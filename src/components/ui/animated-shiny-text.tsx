import type { ComponentPropsWithoutRef, CSSProperties, FC } from "react";

import { cn } from "@/lib/utils";

export interface AnimatedShinyTextProps
	extends ComponentPropsWithoutRef<"span"> {
	shimmerWidth?: number;
}

export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
	children,
	className,
	shimmerWidth = 100,
	style,
	...props
}) => {
	return (
		<span
			style={
				{
					...style,
					"--shiny-width": `${shimmerWidth}px`,
				} as CSSProperties
			}
			className={cn("relative inline-block", className)}
			{...props}
		>
			<span className="relative z-10">{children}</span>
			<span
				aria-hidden="true"
				className={cn(
					"pointer-events-none absolute inset-0 z-20",
					"text-transparent [-webkit-text-fill-color:transparent] bg-clip-text",
					"animate-shiny-text [background-size:var(--shiny-width)_100%] [background-position:0_0] bg-no-repeat",
					"bg-gradient-to-r from-transparent via-white/80 via-50% to-transparent dark:via-white/80"
				)}
			>
				{children}
			</span>
		</span>
	);
};
