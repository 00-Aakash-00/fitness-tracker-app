"use client";

import {
	SignedIn,
	SignedOut,
	SignInButton,
	SignUpButton,
	UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppLogo } from "@/components/layout/app-logo";
import { Button } from "@/components/ui/button";

export function Header() {
	const pathname = usePathname();

	const shouldHideHeader =
		pathname.startsWith("/dashboard") ||
		pathname.startsWith("/sign-in") ||
		pathname.startsWith("/sign-up");

	// Hide header on dashboard pages (sidebar handles navigation there)
	if (shouldHideHeader) {
		return null;
	}

	return (
		<header className="flex items-center justify-between border-b border-border bg-primary-surface px-4 py-3 md:px-6 md:py-4">
			<AppLogo href="/" priority />
			<nav className="flex items-center gap-2 md:gap-4">
				<SignedOut>
					<SignInButton mode="redirect">
						<Button type="button" variant="outline" size="default">
							Sign In
						</Button>
					</SignInButton>
					<SignUpButton mode="redirect">
						<Button type="button" size="default">
							Sign Up
						</Button>
					</SignUpButton>
				</SignedOut>
				<SignedIn>
					<Link
						href="/dashboard"
						className="font-primary text-sm font-medium text-secondary-text transition-colors hover:text-primary-text"
					>
						Dashboard
					</Link>
					<UserButton
						appearance={{
							elements: {
								avatarBox: "w-10 h-10",
							},
						}}
					/>
				</SignedIn>
			</nav>
		</header>
	);
}
