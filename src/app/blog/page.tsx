import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Blog | FitnessTracker",
	robots: {
		index: false,
		follow: false,
	},
};

export default function BlogPage() {
	return (
		<main className="min-h-screen bg-secondary-surface px-6 py-16">
			<div className="mx-auto max-w-3xl rounded-2xl border border-border/40 bg-primary-surface p-8 shadow-sm">
				<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-cool">
					Blog
				</p>
				<h1 className="mt-3 font-primary text-3xl font-semibold text-primary-text">
					Wellness writing is on the way
				</h1>
				<p className="mt-4 max-w-2xl text-sm leading-relaxed text-secondary-text">
					This section will hold longer-form guidance on recovery, sleep,
					training load, and better daily decision-making. It is not populated
					yet.
				</p>
			</div>
		</main>
	);
}
