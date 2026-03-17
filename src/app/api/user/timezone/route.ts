import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSupabaseUserIdByClerkId } from "@/lib/integrations/oauth-connections.server";
import { refreshUserAppState } from "@/lib/progress/progress.server";
import {
	normalizeTimezone,
	upsertUserSettings,
} from "@/lib/user-settings.server";

export const runtime = "nodejs";

export async function POST(request: Request) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json(
			{ ok: false, message: "Not authenticated." },
			{ status: 401 }
		);
	}

	const body = (await request.json().catch(() => null)) as {
		timezone?: string;
	} | null;
	const timezone = normalizeTimezone(body?.timezone);
	if (!timezone) {
		return NextResponse.json(
			{ ok: false, message: "A valid timezone is required." },
			{ status: 400 }
		);
	}

	const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
	const settings = await upsertUserSettings({
		userId: supabaseUserId,
		timezone,
	});

	await refreshUserAppState({
		supabaseUserId,
		days: 90,
		timezoneOverride: settings.timezone,
	});

	return NextResponse.json({ ok: true, timezone: settings.timezone });
}
