import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Progress | FitnessTracker",
};

export default function ProgressPage() {
	return (
		<div className="space-y-2">
			<h1 className="font-primary text-2xl font-semibold text-primary-text">
				Progress
			</h1>
			<p className="font-secondary text-sm text-secondary-text">Coming soon.</p>
		</div>
	);
}
