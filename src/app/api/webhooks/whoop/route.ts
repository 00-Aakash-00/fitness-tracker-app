import type { NextRequest } from "next/server";
import { after } from "next/server";
import { getOAuthConnectionByProviderUserId } from "@/lib/integrations/oauth-connections.server";
import {
	getWearableWebhookConfigMessage,
	logWearableRouteError,
	textNoStore,
} from "@/lib/integrations/wearable-route-errors.server";
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

function queueWhoopWebhookEvent(
	params: Parameters<typeof recordWhoopWebhookEvent>[0]
) {
	after(() => {
		recordWhoopWebhookEvent(params).catch((error) => {
			logWearableRouteError({
				error,
				phase: "record_webhook_event",
				provider: "whoop",
				providerUserId: params.providerUserId,
				route: "webhook",
				userId: params.userId,
			});
		});
	});
}

export async function POST(request: NextRequest) {
	const signature = request.headers.get(WHOOP_WEBHOOK_SIGNATURE_HEADER);
	const timestamp = request.headers.get(WHOOP_WEBHOOK_TIMESTAMP_HEADER);
	const rawBody = await request.text();

	if (!signature || !timestamp) {
		queueWhoopWebhookEvent({
			payload: { raw_body: rawBody },
			signature,
			timestampHeader: timestamp,
			status: "rejected",
			errorText: "Missing WHOOP signature headers.",
		});
		return textNoStore("Missing WHOOP signature headers", { status: 400 });
	}

	if (!rawBody) {
		queueWhoopWebhookEvent({
			payload: { raw_body: rawBody },
			signature,
			timestampHeader: timestamp,
			status: "rejected",
			errorText: "Missing WHOOP webhook body.",
		});
		return textNoStore("Missing WHOOP webhook body", { status: 400 });
	}

	let isValidSignature = false;
	try {
		isValidSignature = verifyWhoopWebhookSignature({
			rawBody,
			signature,
			timestamp,
		});
	} catch (error) {
		logWearableRouteError({
			error,
			phase: "verify_signature",
			provider: "whoop",
			route: "webhook",
		});
		return textNoStore(getWearableWebhookConfigMessage("whoop"), {
			status: 503,
		});
	}

	if (!isValidSignature) {
		queueWhoopWebhookEvent({
			payload: { raw_body: rawBody },
			signature,
			timestampHeader: timestamp,
			status: "rejected",
			errorText: "Invalid WHOOP webhook signature.",
		});
		return textNoStore("Invalid WHOOP signature", { status: 401 });
	}

	let payload: unknown;
	try {
		payload = JSON.parse(rawBody) as unknown;
	} catch {
		queueWhoopWebhookEvent({
			payload: { raw_body: rawBody },
			signature,
			timestampHeader: timestamp,
			status: "rejected",
			errorText: "Webhook body was not valid JSON.",
		});
		return textNoStore("Invalid WHOOP webhook payload", { status: 400 });
	}

	const envelope = parseWhoopWebhookEnvelope(payload);
	if (!envelope) {
		queueWhoopWebhookEvent({
			payload,
			signature,
			timestampHeader: timestamp,
			status: "rejected",
			errorText: "Webhook payload did not match the expected WHOOP schema.",
		});
		return textNoStore("Invalid WHOOP webhook payload", { status: 400 });
	}

	const event = parseWhoopWebhookEvent(payload);
	if (!event) {
		queueWhoopWebhookEvent({
			providerUserId: String(envelope.user_id),
			payload,
			signature,
			timestampHeader: timestamp,
			status: "ignored",
			errorText: "Unsupported WHOOP webhook event type.",
		});
		return textNoStore("Ignored", { status: 202 });
	}

	try {
		const connection = await getOAuthConnectionByProviderUserId({
			provider: "whoop",
			providerUserId: String(event.user_id),
		});

		if (!connection?.user_id) {
			queueWhoopWebhookEvent({
				providerUserId: String(event.user_id),
				payload: event,
				signature,
				timestampHeader: timestamp,
				status: "ignored",
				errorText: "No local WHOOP connection matched this provider user.",
			});
			return textNoStore("Ignored", { status: 202 });
		}

		await enqueueWhoopWebhookSync({
			userId: connection.user_id,
			payload: event,
		});

		queueWhoopWebhookEvent({
			userId: connection.user_id,
			providerUserId: String(event.user_id),
			payload: event,
			signature,
			timestampHeader: timestamp,
			status: "queued",
		});

		return textNoStore("OK", { status: 200 });
	} catch (error) {
		logWearableRouteError({
			error,
			phase: "process_verified_event",
			provider: "whoop",
			providerUserId: String(event.user_id),
			route: "webhook",
		});
		queueWhoopWebhookEvent({
			providerUserId: String(envelope.user_id),
			payload,
			signature,
			timestampHeader: timestamp,
			status: "failed",
			errorText:
				error instanceof Error ? error.message : "Unexpected webhook failure",
		});
		return textNoStore("Webhook processing failed", { status: 500 });
	}
}
