import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
	const user = await currentUser();

	return (
		<div className="min-h-screen p-8">
			<div className="mx-auto max-w-4xl">
				<div className="mb-8">
					<h1 className="font-primary text-3xl font-bold text-primary-text">
						Welcome back
						{user?.firstName ? `, ${user.firstName}` : ""}!
					</h1>
					<p className="mt-2 font-secondary text-secondary-text">
						Track your fitness journey and monitor your progress.
					</p>
				</div>

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					<div className="rounded-xl border border-border bg-primary-surface p-6 shadow-sm">
						<h2 className="font-primary text-lg font-semibold text-primary-text">
							Today&apos;s Activity
						</h2>
						<p className="mt-2 text-3xl font-bold text-brand-cool">0</p>
						<p className="text-sm text-secondary-text">steps taken</p>
					</div>

					<div className="rounded-xl border border-border bg-primary-surface p-6 shadow-sm">
						<h2 className="font-primary text-lg font-semibold text-primary-text">
							Calories Burned
						</h2>
						<p className="mt-2 text-3xl font-bold text-brand-warm">0</p>
						<p className="text-sm text-secondary-text">kcal today</p>
					</div>

					<div className="rounded-xl border border-border bg-primary-surface p-6 shadow-sm">
						<h2 className="font-primary text-lg font-semibold text-primary-text">
							Active Minutes
						</h2>
						<p className="mt-2 text-3xl font-bold text-brand-deep">0</p>
						<p className="text-sm text-secondary-text">minutes today</p>
					</div>
				</div>
			</div>
		</div>
	);
}
