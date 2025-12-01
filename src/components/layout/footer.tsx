import Link from "next/link";

export function Footer() {
	return (
		<footer className="w-full pt-4 pb-8">
			<div className="container mx-auto px-4">
				<div className="flex justify-between items-center">
					<span className="text-xs text-secondary-text">
						© {new Date().getFullYear()} FitnessTracker. All rights reserved.
					</span>
					<div className="flex items-center space-x-6 text-xs text-secondary-text">
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
						<Link
							href="/cookies"
							className="hover:text-primary-text transition-colors"
						>
							Cookie Policy
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
