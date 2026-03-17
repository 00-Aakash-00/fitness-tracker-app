import { Target } from "lucide-react";

export function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-primary-surface px-6 py-16 text-center">
			<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-cool/10">
				<Target className="h-7 w-7 text-brand-cool" />
			</div>
			<h3 className="font-primary text-lg font-semibold text-primary-text">
				No challenges yet
			</h3>
			<p className="mt-1 max-w-sm font-secondary text-sm text-secondary-text">
				Create your first challenge to start building streaks and tracking daily
				habits.
			</p>
		</div>
	);
}
