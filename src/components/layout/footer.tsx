import Link from "next/link";

export function Footer() {
	return (
		<footer className="w-full pt-4 pb-8">
			<div className="container mx-auto px-4">
				<div className="flex flex-col gap-4 text-center md:flex-row md:justify-between md:items-center md:text-left">
					<span className="text-xs text-secondary-text">
						© {new Date().getFullYear()} FitnessTracker. All rights reserved.
					</span>
					<div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs text-secondary-text md:justify-start">
						<Link
							href="/blog"
							className="hover:text-primary-text transition-colors"
						>
							Blog
						</Link>
						<Link
							href="/privacy"
							className="hover:text-primary-text transition-colors"
						>
							Privacy Policy
						</Link>
						<Link
							href="/terms"
							className="hover:text-primary-text transition-colors"
						>
							Terms of Service
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
