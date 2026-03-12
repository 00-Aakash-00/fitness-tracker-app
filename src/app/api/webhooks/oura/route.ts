import type { NextRequest } from "next/server";
import { after } from "next/server";
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
import {
	getWearableWebhookConfigMessage,
	jsonNoStore,
	logWearableRouteError,
	textNoStore,
} from "@/lib/integrations/wearable-route-errors.server";

export const runtime = "nodejs";

function queueOuraWebhookEvent(
	params: Parameters<typeof recordOuraWebhookEvent>[0]
) {
	after(() => {
		recordOuraWebhookEvent(params).catch((error) => {
			logWearableRouteError({
				error,
				phase: "record_webhook_event",
				provider: "oura",
				providerUserId: params.providerUserId,
				route: "webhook",
				userId: params.userId,
			});
		});
	});
}

export async function GET(request: NextRequest) {
	const verificationToken =
		request.nextUrl.searchParams.get("verification_token") ?? "";
	const challenge = request.nextUrl.searchParams.get("challenge") ?? "";

	if (!verificationToken || !challenge) {
		return textNoStore("Missing verification parameters", { status: 400 });
	}

	let expectedVerificationToken: string;
	try {
		expectedVerificationToken = getOuraWebhookVerificationToken();
	} catch (error) {
		logWearableRouteError({
			error,
			phase: "load_verification_token",
			provider: "oura",
			route: "webhook",
		});
		return textNoStore(getWearableWebhookConfigMessage("oura"), {
			status: 503,
		});
	}

	if (verificationToken !== expectedVerificationToken) {
		return textNoStore("Invalid verification token", { status: 401 });
	}

	return jsonNoStore({ challenge });
}

export async function POST(request: NextRequest) {
	const signature = request.headers.get(OURA_WEBHOOK_SIGNATURE_HEADER);
	const timestamp = request.headers.get(OURA_WEBHOOK_TIMESTAMP_HEADER);
	const rawBody = await request.text();

	let parsedBody: unknown;
	try {
		parsedBody = rawBody ? (JSON.parse(rawBody) as unknown) : {};
	} catch {
		queueOuraWebhookEvent({
			payload: { raw_body: rawBody },
			signature,
			timestampHeader: timestamp,
			status: "rejected",
			errorText: "Webhook body was not valid JSON.",
		});
		return textNoStore("Invalid JSON body", { status: 400 });
	}

	if (!signature || !timestamp) {
		queueOuraWebhookEvent({
			payload: parsedBody,
			signature,
			timestampHeader: timestamp,
			status: "rejected",
			errorText: "Missing Oura webhook signature headers.",
		});
		return textNoStore("Missing signature headers", { status: 401 });
	}

	let isValidSignature = false;
	try {
		isValidSignature = verifyOuraWebhookSignature({
			rawBody,
			signature,
			timestamp,
		});
	} catch (error) {
		logWearableRouteError({
			error,
			phase: "verify_signature",
			provider: "oura",
			route: "webhook",
		});
		return textNoStore(getWearableWebhookConfigMessage("oura"), {
			status: 503,
		});
	}

	if (!isValidSignature) {
		queueOuraWebhookEvent({
			payload: parsedBody,
			signature,
			timestampHeader: timestamp,
			status: "rejected",
			errorText: "Invalid Oura webhook signature.",
		});
		return textNoStore("Invalid signature", { status: 401 });
	}

	const payload = parseOuraWebhookPayload(parsedBody);
	if (!payload) {
		queueOuraWebhookEvent({
			payload: parsedBody,
			signature,
			timestampHeader: timestamp,
			status: "rejected",
			errorText: "Webhook payload did not match the expected Oura schema.",
		});
		return textNoStore("Invalid payload", { status: 400 });
	}

	try {
		const connection = await getOAuthConnectionByProviderUserId({
			provider: "oura",
			providerUserId: payload.user_id,
		});

		if (!connection?.user_id) {
			queueOuraWebhookEvent({
				providerUserId: payload.user_id,
				payload,
				signature,
				timestampHeader: timestamp,
				status: "ignored",
				errorText: "No local Oura connection matched this provider user.",
			});
			return textNoStore("Ignored", { status: 202 });
		}

		await enqueueOuraWebhookSync({
			userId: connection.user_id,
			payload,
		});

		queueOuraWebhookEvent({
			userId: connection.user_id,
			providerUserId: payload.user_id,
			payload,
			signature,
			timestampHeader: timestamp,
			status: "queued",
		});

		return textNoStore("OK", { status: 200 });
	} catch (error) {
		logWearableRouteError({
			error,
			phase: "process_verified_event",
			provider: "oura",
			providerUserId: payload.user_id,
			route: "webhook",
		});
		queueOuraWebhookEvent({
			providerUserId: payload.user_id,
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
