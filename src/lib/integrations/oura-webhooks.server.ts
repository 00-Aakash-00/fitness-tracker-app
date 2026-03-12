import "server-only";

import crypto from "node:crypto";
import {
	getOuraClientSecret,
	OURA_WEBHOOK_DATA_TYPES,
	OURA_WEBHOOK_OPERATIONS,
	type OuraWebhookDataType,
	type OuraWebhookOperation,
} from "./oura.server";

export const OURA_WEBHOOK_SIGNATURE_HEADER = "x-oura-signature";
export const OURA_WEBHOOK_TIMESTAMP_HEADER = "x-oura-timestamp";

export type OuraWebhookPayload = {
	event_type: OuraWebhookOperation;
	data_type: OuraWebhookDataType;
	object_id: string;
	event_time?: string | null;
	user_id: string;
};

type OuraWebhookEnvelope = {
	event_type?: unknown;
	data_type?: unknown;
	object_id?: unknown;
	event_time?: unknown;
	user_id?: unknown;
};

export function verifyOuraWebhookSignature(params: {
	rawBody: string;
	signature: string;
	timestamp: string;
}): boolean {
	const expected = crypto
		.createHmac("sha256", getOuraClientSecret())
		.update(`${params.timestamp}${params.rawBody}`, "utf8")
		.digest("hex")
		.toUpperCase();

	const actual = params.signature.trim().toUpperCase();
	const actualBuffer = Buffer.from(actual, "utf8");
	const expectedBuffer = Buffer.from(expected, "utf8");

	if (actualBuffer.length !== expectedBuffer.length) {
		return false;
	}

	return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

export function parseOuraWebhookPayload(
	value: unknown
): OuraWebhookPayload | null {
	if (typeof value !== "object" || value === null) {
		return null;
	}

	const candidate = value as OuraWebhookEnvelope;
	const eventType =
		typeof candidate.event_type === "string" &&
		OURA_WEBHOOK_OPERATIONS.includes(
			candidate.event_type as OuraWebhookOperation
		)
			? (candidate.event_type as OuraWebhookOperation)
			: null;
	const dataType =
		typeof candidate.data_type === "string" &&
		OURA_WEBHOOK_DATA_TYPES.includes(candidate.data_type as OuraWebhookDataType)
			? (candidate.data_type as OuraWebhookDataType)
			: null;
	const objectId =
		typeof candidate.object_id === "string" &&
		candidate.object_id.trim().length > 0
			? candidate.object_id
			: null;
	const userId =
		typeof candidate.user_id === "string" && candidate.user_id.trim().length > 0
			? candidate.user_id
			: null;
	const eventTime =
		typeof candidate.event_time === "string" &&
		candidate.event_time.trim().length > 0
			? candidate.event_time
			: null;

	if (!eventType || !dataType || !objectId || !userId) {
		return null;
	}

	return {
		event_type: eventType,
		data_type: dataType,
		object_id: objectId,
		event_time: eventTime,
		user_id: userId,
	};
}
