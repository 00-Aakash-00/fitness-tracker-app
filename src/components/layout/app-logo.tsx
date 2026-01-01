import Image from "next/image";
import Link from "next/link";
import type { MouseEventHandler } from "react";

import { cn } from "@/lib/utils";

interface AppLogoProps {
	href?: string;
	className?: string;
	imageClassName?: string;
	priority?: boolean;
	onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export function AppLogo({
	href = "/",
	className,
	imageClassName,
	priority = false,
	onClick,
}: AppLogoProps) {
	return (
		<Link
			href={href}
			aria-label="Home"
			onClick={onClick}
			className={cn(
				"relative inline-flex h-8 w-12 shrink-0 items-center justify-center",
				"transition-opacity hover:opacity-90",
				className
			)}
		>
			<Image
				src="/logo.png"
				alt="Fitness Tracker"
				fill
				sizes="48px"
				className={cn("object-contain", imageClassName)}
				priority={priority}
			/>
		</Link>
	);
}
