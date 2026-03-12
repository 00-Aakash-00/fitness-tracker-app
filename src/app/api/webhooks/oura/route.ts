import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getOAuthConnectionByProviderUserId } from "@/lib/integrations/oauth-connections.server";
import { getOuraWebhookVerificationToken } from "@/lib/integrations/oura.server";
import {
	enqueueOuraWebhookSync,
	recordOuraWebhookEvent,
} from "@/lib/integrations/oura-sync.server";
import {
	OURA_WEBHOOK_SIGNATURE_HEADER,
	OURA_WEBHOOK_TIMESTAMP_HEADER,
	parseOuraWebhookPayload,
	verifyOuraWebhookSignature,
} from "@/lib/integrations/oura-webhooks.server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	const verificationToken =
		request.nextUrl.searchParams.get("verification_token") ?? "";
	const challenge = request.nextUrl.searchParams.get("challenge") ?? "";

	if (!verificationToken || !challenge) {
		return new Response("Missing verification parameters", { status: 400 });
	}

	if (verificationToken !== getOuraWebhookVerificationToken()) {
		return new Response("Invalid verification token", { status: 401 });
	}

	return NextResponse.json({ challenge });
}

export async function POST(request: NextRequest) {
	const signature = request.headers.get(OURA_WEBHOOK_SIGNATURE_HEADER);
	const timestamp = request.headers.get(OURA_WEBHOOK_TIMESTAMP_HEADER);
	const rawBody = await request.text();

	let parsedBody: unknown;
	try {
		parsedBody = rawBody ? (JSON.parse(rawBody) as unknown) : {};
	} catch {
		await recordOuraWebhookEvent({
			payload: { raw_body: rawBody },
			signature,
			timestampHeader: timestamp,
			status: "rejected",
			errorText: "Webhook body was not valid JSON.",
		});
		return new Response("Invalid JSON body", { status: 400 });
	}

	if (!signature || !timestamp) {
		await recordOuraWebhookEvent({
			payload: parsedBody,
			signature,
			timestampHeader: timestamp,
			status: "rejected",
			errorText: "Missing Oura webhook signature headers.",
		});
		return new Response("Missing signature headers", { status: 401 });
	}

	if (
		!verifyOuraWebhookSignature({
			rawBody,
			signature,
			timestamp,
		})
	) {
		await recordOuraWebhookEvent({
			payload: parsedBody,
			signature,
			timestampHeader: timestamp,
			status: "rejected",
			errorText: "Invalid Oura webhook signature.",
		});
		return new Response("Invalid signature", { status: 401 });
	}

	const payload = parseOuraWebhookPayload(parsedBody);
	if (!payload) {
		await recordOuraWebhookEvent({
			payload: parsedBody,
			signature,
			timestampHeader: timestamp,
			status: "rejected",
			errorText: "Webhook payload did not match the expected Oura schema.",
		});
		return new Response("Invalid payload", { status: 400 });
	}

	try {
		const connection = await getOAuthConnectionByProviderUserId({
			provider: "oura",
			providerUserId: payload.user_id,
		});

		if (!connection?.user_id) {
			await recordOuraWebhookEvent({
				providerUserId: payload.user_id,
				payload,
				signature,
				timestampHeader: timestamp,
				status: "ignored",
				errorText: "No local Oura connection matched this provider user.",
			});
			return new Response("Ignored", { status: 202 });
		}

		await enqueueOuraWebhookSync({
			userId: connection.user_id,
			payload,
		});

		await recordOuraWebhookEvent({
			userId: connection.user_id,
			providerUserId: payload.user_id,
			payload,
			signature,
			timestampHeader: timestamp,
			status: "queued",
		});

		return new Response("OK", { status: 200 });
	} catch (error) {
		console.error("Failed to process Oura webhook", error);
		await recordOuraWebhookEvent({
			providerUserId: payload.user_id,
			payload,
			signature,
			timestampHeader: timestamp,
			status: "failed",
			errorText:
				error instanceof Error ? error.message : "Unexpected webhook failure",
		});
		return new Response("Webhook processing failed", { status: 500 });
	}
}
