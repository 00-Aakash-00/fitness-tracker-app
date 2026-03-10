import type { NextRequest } from "next/server";
import {
	parseWhoopWebhookEnvelope,
	verifyWhoopWebhookSignature,
	WHOOP_WEBHOOK_SIGNATURE_HEADER,
	WHOOP_WEBHOOK_TIMESTAMP_HEADER,
} from "@/lib/integrations/whoop-webhooks.server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
	const signature = request.headers.get(WHOOP_WEBHOOK_SIGNATURE_HEADER);
	const timestamp = request.headers.get(WHOOP_WEBHOOK_TIMESTAMP_HEADER);

	if (!signature || !timestamp) {
		return new Response("Missing WHOOP signature headers", { status: 400 });
	}

	const rawBody = await request.text();
	if (!rawBody) {
		return new Response("Missing WHOOP webhook body", { status: 400 });
	}

	if (
		!verifyWhoopWebhookSignature({
			rawBody,
			signature,
			timestamp,
		})
	) {
		return new Response("Invalid WHOOP signature", { status: 401 });
	}

	let payload: unknown;

	try {
		payload = JSON.parse(rawBody) as unknown;
	} catch {
		return new Response("Invalid WHOOP webhook payload", { status: 400 });
	}

	if (!parseWhoopWebhookEnvelope(payload)) {
		return new Response("Invalid WHOOP webhook payload", { status: 400 });
	}

	return new Response(null, { status: 204 });
}
