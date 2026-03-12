import type { NextRequest } from "next/server";
import { getOAuthConnectionByProviderUserId } from "@/lib/integrations/oauth-connections.server";
import {
	enqueueWhoopWebhookSync,
	recordWhoopWebhookEvent,
} from "@/lib/integrations/whoop-sync.server";
import {
	parseWhoopWebhookEnvelope,
	parseWhoopWebhookEvent,
	verifyWhoopWebhookSignature,
	WHOOP_WEBHOOK_SIGNATURE_HEADER,
	WHOOP_WEBHOOK_TIMESTAMP_HEADER,
} from "@/lib/integrations/whoop-webhooks.server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
	const signature = request.headers.get(WHOOP_WEBHOOK_SIGNATURE_HEADER);
	const timestamp = request.headers.get(WHOOP_WEBHOOK_TIMESTAMP_HEADER);
	const rawBody = await request.text();

	if (!signature || !timestamp) {
		await recordWhoopWebhookEvent({
			payload: { raw_body: rawBody },
			signature,
			timestampHeader: timestamp,
			status: "rejected",
			errorText: "Missing WHOOP signature headers.",
		});
		return new Response("Missing WHOOP signature headers", { status: 400 });
	}

	if (!rawBody) {
		await recordWhoopWebhookEvent({
			payload: { raw_body: rawBody },
			signature,
			timestampHeader: timestamp,
			status: "rejected",
			errorText: "Missing WHOOP webhook body.",
		});
		return new Response("Missing WHOOP webhook body", { status: 400 });
	}

	if (
		!verifyWhoopWebhookSignature({
			rawBody,
			signature,
			timestamp,
		})
	) {
		await recordWhoopWebhookEvent({
			payload: { raw_body: rawBody },
			signature,
			timestampHeader: timestamp,
			status: "rejected",
			errorText: "Invalid WHOOP webhook signature.",
		});
		return new Response("Invalid WHOOP signature", { status: 401 });
	}

	let payload: unknown;

	try {
		payload = JSON.parse(rawBody) as unknown;
	} catch {
		await recordWhoopWebhookEvent({
			payload: { raw_body: rawBody },
			signature,
			timestampHeader: timestamp,
			status: "rejected",
			errorText: "Webhook body was not valid JSON.",
		});
		return new Response("Invalid WHOOP webhook payload", { status: 400 });
	}

	const envelope = parseWhoopWebhookEnvelope(payload);
	if (!envelope) {
		await recordWhoopWebhookEvent({
			payload,
			signature,
			timestampHeader: timestamp,
			status: "rejected",
			errorText: "Webhook payload did not match the expected WHOOP schema.",
		});
		return new Response("Invalid WHOOP webhook payload", { status: 400 });
	}

	const event = parseWhoopWebhookEvent(payload);
	if (!event) {
		await recordWhoopWebhookEvent({
			providerUserId: String(envelope.user_id),
			payload,
			signature,
			timestampHeader: timestamp,
			status: "ignored",
			errorText: "Unsupported WHOOP webhook event type.",
		});
		return new Response("Ignored", { status: 202 });
	}

	try {
		const connection = await getOAuthConnectionByProviderUserId({
			provider: "whoop",
			providerUserId: String(event.user_id),
		});

		if (!connection?.user_id) {
			await recordWhoopWebhookEvent({
				providerUserId: String(event.user_id),
				payload: event,
				signature,
				timestampHeader: timestamp,
				status: "ignored",
				errorText: "No local WHOOP connection matched this provider user.",
			});
			return new Response("Ignored", { status: 202 });
		}

		await enqueueWhoopWebhookSync({
			userId: connection.user_id,
			payload: event,
		});

		await recordWhoopWebhookEvent({
			userId: connection.user_id,
			providerUserId: String(event.user_id),
			payload: event,
			signature,
			timestampHeader: timestamp,
			status: "queued",
		});

		return new Response("OK", { status: 200 });
	} catch (error) {
		console.error("Failed to process Whoop webhook", error);
		await recordWhoopWebhookEvent({
			providerUserId: String(envelope.user_id),
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
