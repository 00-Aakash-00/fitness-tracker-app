import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
	getRequestOrigin,
	safeErrorMessage,
} from "@/lib/integrations/oauth.server";
import {
	deleteOAuthConnection,
	getOAuthConnection,
	getSupabaseUserIdByClerkId,
} from "@/lib/integrations/oauth-connections.server";
import { revokeWhoopAccess } from "@/lib/integrations/whoop.server";
import { getValidWhoopAccessToken } from "@/lib/integrations/whoop-connection.server";

export async function POST(request: NextRequest) {
	const origin = getRequestOrigin(request);
	const { userId } = await auth();
	if (!userId) {
		return new Response("Unauthorized", { status: 401 });
	}

	const requestOrigin = request.headers.get("origin");
	if (requestOrigin && requestOrigin !== origin) {
		return new Response("Invalid origin", { status: 403 });
	}

	const redirectUrl = new URL("/dashboard/devices", origin);
	redirectUrl.searchParams.set("integration", "whoop");

	try {
		const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
		const connection = await getOAuthConnection({
			userId: supabaseUserId,
			provider: "whoop",
		});

		if (connection) {
			try {
				const accessToken = await getValidWhoopAccessToken({
					supabaseUserId,
				});
				await revokeWhoopAccess(accessToken);
			} catch {
				// Best-effort revoke; still disconnect locally.
			}

			await deleteOAuthConnection({
				userId: supabaseUserId,
				provider: "whoop",
			});
		}

		redirectUrl.searchParams.set("status", "disconnected");
		return NextResponse.redirect(redirectUrl, { status: 303 });
	} catch (err) {
		redirectUrl.searchParams.set("status", "error");
		redirectUrl.searchParams.set("message", safeErrorMessage(err));
		return NextResponse.redirect(redirectUrl, { status: 303 });
	}
}
