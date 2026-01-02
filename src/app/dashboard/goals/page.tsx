import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Goals | FitnessTracker",
};

export default function GoalsPage() {
	return (
		<div className="space-y-2">
			<h1 className="font-primary text-2xl font-semibold text-primary-text">
				Goals
			</h1>
			<p className="font-secondary text-sm text-secondary-text">Coming soon.</p>
		</div>
	);
}
