import Link from "next/link";

import { AppLogo } from "@/components/layout/app-logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<>
			<style>
				{'header[data-app-header="true"] { display: none !important; }'}
			</style>
			<main className="flex min-h-screen items-center justify-center bg-secondary-surface p-8">
				<div className="flex w-full max-w-[520px] flex-col items-center gap-6 text-center">
					<AppLogo href="/" className="h-16 w-24" sizes="96px" priority />
					<div className="space-y-2">
						<h1 className="font-primary text-3xl font-bold text-primary-text">
							Page not found
						</h1>
						<p className="font-secondary text-sm text-secondary-text">
							The page you’re looking for doesn’t exist or has moved.
						</p>
					</div>
					<div className="flex flex-col gap-3 sm:flex-row">
						<Button asChild>
							<Link href="/dashboard">Go to dashboard</Link>
						</Button>
						<Button asChild variant="outline">
							<Link href="/sign-in">Sign in</Link>
						</Button>
					</div>
				</div>
			</main>
		</>
	);
}
