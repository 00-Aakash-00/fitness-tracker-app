"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
	const { resolvedTheme, setTheme } = useTheme();
	const [hasMounted, setHasMounted] = useState(false);

	useEffect(() => {
		setHasMounted(true);
	}, []);

	if (!hasMounted) {
		return (
			<div
				className={cn(
					"size-9 rounded-lg border border-border bg-primary-surface",
					className,
				)}
			/>
		);
	}

	const isDarkMode = resolvedTheme === "dark";

	return (
		<button
			type="button"
			onClick={() => setTheme(isDarkMode ? "light" : "dark")}
			className={cn(
				"inline-flex size-9 items-center justify-center rounded-lg border border-border bg-primary-surface text-secondary-text transition-colors duration-200 hover:bg-secondary-surface hover:text-primary-text",
				className,
			)}
			aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
		>
			{isDarkMode ? (
				<Sun className="size-4" />
			) : (
				<Moon className="size-4" />
			)}
		</button>
	);
}
