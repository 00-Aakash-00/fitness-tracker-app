import { Skeleton } from "@/components/ui/skeleton";

export default function GoalsLoading() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-4 w-64" />
				</div>
				<Skeleton className="h-8 w-32 rounded-lg" />
			</div>

			{/* Challenge grid */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={`skeleton-card-${
							// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
							i
						}`}
						className="rounded-xl border border-border bg-primary-surface p-4 md:p-6"
					>
						<div className="mb-3 flex items-start justify-between">
							<Skeleton className="h-5 w-40" />
							<Skeleton className="h-5 w-16 rounded-full" />
						</div>
						<div className="space-y-3">
							<Skeleton className="h-4 w-28" />
							<div className="space-y-1">
								<div className="flex justify-between">
									<Skeleton className="h-3 w-20" />
									<Skeleton className="h-3 w-8" />
								</div>
								<Skeleton className="h-2 w-full rounded-full" />
							</div>
							<Skeleton className="h-3 w-32" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
