import { Skeleton } from "@/components/ui/skeleton";

export default function WorkoutsLoading() {
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-4 w-48" />
			</div>

			<div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
				{/* Calendar skeleton */}
				<div className="w-full shrink-0 lg:w-72">
					<div className="rounded-xl border border-border bg-primary-surface p-3">
						<div className="mb-3 flex items-center justify-between">
							<Skeleton className="h-8 w-8" />
							<Skeleton className="h-5 w-32" />
							<Skeleton className="h-8 w-8" />
						</div>
						<div className="grid grid-cols-7 gap-1">
							{Array.from({ length: 7 }).map((_, i) => (
								<Skeleton
									// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
									key={`header-${i}`}
									className="h-4 w-full"
								/>
							))}
							{Array.from({ length: 35 }).map((_, i) => (
								<Skeleton
									// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
									key={`day-${i}`}
									className="h-8 w-full rounded-md"
								/>
							))}
						</div>
					</div>
				</div>

				{/* Day detail skeleton */}
				<div className="flex-1 space-y-4">
					<div className="flex items-center justify-between">
						<Skeleton className="h-6 w-40" />
						<Skeleton className="h-8 w-28" />
					</div>

					{/* Template chips skeleton */}
					<div className="flex gap-2">
						<Skeleton className="h-8 w-24 rounded-full" />
						<Skeleton className="h-8 w-28 rounded-full" />
						<Skeleton className="h-8 w-20 rounded-full" />
					</div>

					{/* Workout card skeletons */}
					{Array.from({ length: 2 }).map((_, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
							key={`workout-${i}`}
							className="rounded-xl border border-border bg-primary-surface p-4"
						>
							<div className="mb-3 flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Skeleton className="h-5 w-32" />
									<Skeleton className="h-5 w-16 rounded-full" />
								</div>
								<div className="flex gap-1">
									<Skeleton className="h-7 w-14" />
									<Skeleton className="h-7 w-7" />
								</div>
							</div>
							<div className="grid grid-cols-4 gap-2">
								{Array.from({ length: 4 }).map((_, j) => (
									<Skeleton
										// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
										key={`stat-${j}`}
										className="h-14 rounded-lg"
									/>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
