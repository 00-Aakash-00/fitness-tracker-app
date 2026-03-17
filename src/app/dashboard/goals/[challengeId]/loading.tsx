import { Skeleton } from "@/components/ui/skeleton";

export default function ChallengeDetailLoading() {
	return (
		<div className="space-y-6">
			{/* Back link + title */}
			<div className="space-y-3">
				<Skeleton className="h-4 w-20" />
				<div className="flex items-start justify-between">
					<div className="space-y-1.5">
						<Skeleton className="h-7 w-48" />
						<Skeleton className="h-4 w-64" />
					</div>
					<Skeleton className="h-5 w-16 rounded-full" />
				</div>
			</div>

			{/* Actions */}
			<div className="flex gap-2">
				<Skeleton className="h-8 w-20 rounded-lg" />
				<Skeleton className="h-8 w-24 rounded-lg" />
				<Skeleton className="h-8 w-20 rounded-lg" />
			</div>

			{/* Streak + Stats */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Skeleton className="h-24 rounded-xl" />
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:col-span-1">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton
							key={`stat-skeleton-${
								// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
								i
							}`}
							className="h-20 rounded-xl"
						/>
					))}
				</div>
			</div>

			{/* Checklist */}
			<div className="space-y-3">
				<Skeleton className="h-5 w-28" />
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton
						key={`task-skeleton-${
							// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
							i
						}`}
						className="h-11 w-full rounded-lg"
					/>
				))}
			</div>

			{/* Calendar grid */}
			<div className="space-y-2">
				<Skeleton className="h-5 w-28" />
				<Skeleton className="h-48 w-full rounded-lg" />
			</div>
		</div>
	);
}
