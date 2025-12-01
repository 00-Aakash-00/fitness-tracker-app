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

export function Header() {
	const pathname = usePathname();

	// Hide header on dashboard pages (sidebar handles navigation there)
	if (pathname.startsWith("/dashboard")) {
		return null;
	}

	return (
		<header className="flex items-center justify-between border-b border-border bg-primary-surface px-4 py-3 md:px-6 md:py-4">
			<Link
				href="/"
				className="font-primary text-xl font-bold text-primary-text"
			>
				Fitness Tracker
			</Link>
			<nav className="flex items-center gap-2 md:gap-4">
				<SignedOut>
					<SignInButton mode="modal">
						<button
							type="button"
							className="rounded-lg border border-border bg-primary-surface px-4 py-2 font-primary text-sm font-medium text-primary-text transition-colors hover:bg-secondary-surface"
						>
							Sign In
						</button>
					</SignInButton>
					<SignUpButton mode="modal">
						<button
							type="button"
							className="rounded-lg bg-brand-cool px-4 py-2 font-primary text-sm font-medium text-white transition-colors hover:bg-brand-deep"
						>
							Sign Up
						</button>
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
