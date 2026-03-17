import "server-only";

import { getUserNotifications } from "@/lib/notifications.server";
import { getProgressSnapshot } from "@/lib/progress/progress.server";

export async function getDashboardShellData(params: {
	supabaseUserId: string;
	stepGoal: number;
}) {
	const [snapshot, notifications] = await Promise.all([
		getProgressSnapshot({
			supabaseUserId: params.supabaseUserId,
			rangeDays: 7,
			stepGoal: params.stepGoal,
		}),
		getUserNotifications(params.supabaseUserId),
	]);

	return {
		todayAtAGlance: snapshot.todayAtAGlance,
		nextBestAction: snapshot.nextBestAction,
		setupChecklist: snapshot.setupChecklist,
		currentState: snapshot.currentState,
		timezone: snapshot.timezone,
		notifications,
	};
}
