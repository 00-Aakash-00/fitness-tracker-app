import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Blog | FitnessTracker",
	description: "Updates and insights from FitnessTracker.",
};

export default function BlogPage() {
	return (
		<main className="container mx-auto px-4 py-10">
			<div className="mx-auto max-w-3xl space-y-2">
				<h1 className="font-primary text-3xl font-bold text-primary-text">
					Blog
				</h1>
				<p className="font-secondary text-sm text-secondary-text">
					Coming soon.
				</p>
			</div>
		</main>
	);
}
