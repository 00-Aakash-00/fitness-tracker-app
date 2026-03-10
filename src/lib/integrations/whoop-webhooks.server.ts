import "server-only";

import crypto from "node:crypto";
import { getWhoopClientSecret } from "./whoop.server";

export const WHOOP_WEBHOOK_SIGNATURE_HEADER = "x-whoop-signature";
export const WHOOP_WEBHOOK_TIMESTAMP_HEADER = "x-whoop-signature-timestamp";

export const WHOOP_WEBHOOK_EVENT_TYPES = [
	"recovery.updated",
	"recovery.deleted",
	"sleep.updated",
	"sleep.deleted",
	"workout.updated",
	"workout.deleted",
] as const;

export type WhoopWebhookEventType = (typeof WHOOP_WEBHOOK_EVENT_TYPES)[number];

export type WhoopWebhookEnvelope = {
	user_id: number;
	id: string;
	type: string;
	trace_id: string;
};

export type WhoopWebhookEvent = {
	user_id: number;
	id: string;
	type: WhoopWebhookEventType;
	trace_id: string;
};

export function isWhoopWebhookEventType(
	value: string
): value is WhoopWebhookEventType {
	return WHOOP_WEBHOOK_EVENT_TYPES.includes(value as WhoopWebhookEventType);
}

export function verifyWhoopWebhookSignature(params: {
	rawBody: string;
	signature: string;
	timestamp: string;
}): boolean {
	const expected = crypto
		.createHmac("sha256", getWhoopClientSecret())
		.update(`${params.timestamp}${params.rawBody}`, "utf8")
		.digest("base64");

	const actualBuffer = Buffer.from(params.signature.trim(), "utf8");
	const expectedBuffer = Buffer.from(expected, "utf8");

	if (actualBuffer.length !== expectedBuffer.length) {
		return false;
	}

	return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

export function parseWhoopWebhookEvent(
	value: unknown
): WhoopWebhookEvent | null {
	const event = parseWhoopWebhookEnvelope(value);
	if (!event || !isWhoopWebhookEventType(event.type)) {
		return null;
	}

	return {
		user_id: event.user_id,
		id: event.id,
		type: event.type,
		trace_id: event.trace_id,
	};
}

export function parseWhoopWebhookEnvelope(
	value: unknown
): WhoopWebhookEnvelope | null {
	if (typeof value !== "object" || value === null) {
		return null;
	}

	const candidate = value as Record<string, unknown>;
	const userId =
		typeof candidate.user_id === "number" &&
		Number.isInteger(candidate.user_id) &&
		candidate.user_id > 0
			? candidate.user_id
			: null;
	const id =
		typeof candidate.id === "string" && candidate.id.trim().length > 0
			? candidate.id
			: typeof candidate.id === "number" &&
					Number.isInteger(candidate.id) &&
					candidate.id > 0
				? String(candidate.id)
				: null;
	const type =
		typeof candidate.type === "string" && candidate.type.trim().length > 0
			? candidate.type
			: null;
	const traceId =
		typeof candidate.trace_id === "string" &&
		candidate.trace_id.trim().length > 0
			? candidate.trace_id
			: null;

	if (userId === null || !id || !type || !traceId) {
		return null;
	}

	return {
		user_id: userId,
		id,
		type,
		trace_id: traceId,
	};
}
