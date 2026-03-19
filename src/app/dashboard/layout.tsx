import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Sidebar } from "@/components/layout/sidebar";
import { TimezoneSync } from "@/components/layout/timezone-sync";
import { TopNav } from "@/components/layout/top-nav";
import { getDashboardShellData } from "@/lib/app-shell.server";
import { getSupabaseUserIdByClerkId } from "@/lib/integrations/oauth-connections.server";
import { parseStepGoal, STEP_GOAL_COOKIE } from "@/lib/preferences";

export default async function DashboardLayout({
	children,
}: LayoutProps<"/dashboard">) {
	const [{ userId }, cookieStore] = await Promise.all([auth(), cookies()]);
	if (!userId) {
		redirect("/sign-in");
	}

	const stepGoal = parseStepGoal(cookieStore.get(STEP_GOAL_COOKIE)?.value);

	let shellData: Awaited<ReturnType<typeof getDashboardShellData>> | null =
		null;

	try {
		const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
		shellData = await getDashboardShellData({ supabaseUserId, stepGoal });
	} catch (error) {
		console.error("Failed to load dashboard shell data:", error);
	}

	return (
		<div className="flex min-h-screen">
			<Sidebar />
			<div className="flex flex-1 flex-col bg-secondary-surface lg:ml-[72px]">
				<TopNav
					todayAtAGlance={shellData?.todayAtAGlance ?? null}
					notifications={shellData?.notifications ?? []}
				/>
				<TimezoneSync currentTimezone={shellData?.timezone ?? null} />
				<main className="flex-1 p-4 md:p-6">{children}</main>
				<Footer />
			</div>
		</div>
	);
}
