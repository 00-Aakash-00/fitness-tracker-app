import "server-only";

import { createAdminClient } from "@/lib/supabase";
import {
	getAuthenticatedSupabaseContext,
	getUserSupabaseClient,
} from "@/lib/supabase-user.server";
import type { Tables, TablesUpdate } from "@/types/database";

export type NotificationType = Tables<"user_notifications">["type"];

export type NotificationFeedItem = {
	id: string;
	type: NotificationType;
	title: string;
	body: string;
	ctaLabel: string | null;
	ctaHref: string | null;
	isRead: boolean;
	readAt: string | null;
	expiresAt: string | null;
	createdAt: string;
	metadata: Record<string, unknown>;
};

type NotificationRow = Tables<"user_notifications">;

function isDuplicateNotificationInsertError(
	error: { code?: string } | null,
	hasDedupeKey: boolean
) {
	return hasDedupeKey && error?.code === "23505";
}

function mapNotificationRow(row: NotificationRow): NotificationFeedItem {
	const metadata =
		row.metadata &&
		typeof row.metadata === "object" &&
		!Array.isArray(row.metadata)
			? (row.metadata as Record<string, unknown>)
			: {};

	return {
		id: row.id,
		type: row.type,
		title: row.title,
		body: row.body,
		ctaLabel: row.cta_label,
		ctaHref: row.cta_href,
		isRead: row.is_read,
		readAt: row.read_at,
		expiresAt: row.expires_at,
		createdAt: row.created_at,
		metadata,
	};
}

export async function getUserNotifications(
	supabaseUserId: string,
	limit = 12
): Promise<NotificationFeedItem[]> {
	const supabase = await getUserSupabaseClient();
	if (!supabase) {
		throw new Error("Supabase user client unavailable.");
	}

	const nowIso = new Date().toISOString();
	const { data, error } = await supabase
		.from("user_notifications")
		.select("*")
		.eq("user_id", supabaseUserId)
		.or(`expires_at.is.null,expires_at.gt.${nowIso}`)
		.order("created_at", { ascending: false })
		.limit(limit);

	if (error) {
		throw error;
	}

	return ((data ?? []) as NotificationRow[]).map(mapNotificationRow);
}

export async function ensureUserNotification(params: {
	userId: string;
	type: NotificationType;
	title: string;
	body: string;
	ctaLabel?: string | null;
	ctaHref?: string | null;
	dedupeKey?: string | null;
	expiresAt?: string | null;
	metadata?: Record<string, unknown>;
}): Promise<void> {
	const supabase = createAdminClient();

	if (params.dedupeKey) {
		const { data, error } = await supabase
			.from("user_notifications")
			.select("id")
			.eq("user_id", params.userId)
			.eq("dedupe_key", params.dedupeKey)
			.maybeSingle();

		if (error) {
			throw error;
		}

		if (data?.id) {
			return;
		}
	}

	const { error } = await supabase.from("user_notifications").insert({
		user_id: params.userId,
		type: params.type,
		title: params.title,
		body: params.body,
		cta_label: params.ctaLabel ?? null,
		cta_href: params.ctaHref ?? null,
		dedupe_key: params.dedupeKey ?? null,
		expires_at: params.expiresAt ?? null,
		metadata: params.metadata ?? {},
	});

	if (error) {
		if (isDuplicateNotificationInsertError(error, Boolean(params.dedupeKey))) {
			return;
		}
		throw error;
	}
}

export async function markNotificationAsRead(
	notificationId: string
): Promise<void> {
	const context = await getAuthenticatedSupabaseContext();
	if (!context) {
		throw new Error("Not authenticated.");
	}

	const patch: TablesUpdate<"user_notifications"> = {
		is_read: true,
		read_at: new Date().toISOString(),
	};

	const { error } = await context.supabase
		.from("user_notifications")
		.update(patch)
		.eq("id", notificationId)
		.eq("user_id", context.supabaseUserId);

	if (error) {
		throw error;
	}
}

export async function markAllNotificationsAsRead(): Promise<void> {
	const context = await getAuthenticatedSupabaseContext();
	if (!context) {
		throw new Error("Not authenticated.");
	}

	const patch: TablesUpdate<"user_notifications"> = {
		is_read: true,
		read_at: new Date().toISOString(),
	};

	const { error } = await context.supabase
		.from("user_notifications")
		.update(patch)
		.eq("user_id", context.supabaseUserId)
		.eq("is_read", false);

	if (error) {
		throw error;
	}
}

export async function deleteNotification(
	notificationId: string
): Promise<void> {
	const context = await getAuthenticatedSupabaseContext();
	if (!context) {
		throw new Error("Not authenticated.");
	}

	const { error } = await context.supabase
		.from("user_notifications")
		.delete()
		.eq("id", notificationId)
		.eq("user_id", context.supabaseUserId);

	if (error) {
		throw error;
	}
}
