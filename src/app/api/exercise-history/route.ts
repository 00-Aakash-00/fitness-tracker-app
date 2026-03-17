import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSupabaseUserIdByClerkId } from "@/lib/integrations/oauth-connections.server";
import { getExerciseHistory } from "@/lib/workouts/workouts.server";

export async function GET(request: Request) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const exerciseId = searchParams.get("exerciseId");

	if (!exerciseId) {
		return NextResponse.json(
			{ error: "exerciseId is required" },
			{ status: 400 }
		);
	}

	const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
	const history = await getExerciseHistory(exerciseId, supabaseUserId, 10);

	return NextResponse.json({ history });
}
