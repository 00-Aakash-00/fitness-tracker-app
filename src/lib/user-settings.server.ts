import "server-only";

import { createAdminClient } from "@/lib/supabase";
import { getUserSupabaseClient } from "@/lib/supabase-user.server";
import type { Tables } from "@/types/database";

export type WeeklySummaryDay = Tables<"user_settings">["weekly_summary_day"];

export type UserNotificationPreferences = {
	recovery: boolean;
	goals: boolean;
	nutrition: boolean;
	summaries: boolean;
	devices: boolean;
};

export type UserSettings = {
	timezone: string | null;
	reminderTime: string;
	weeklySummaryDay: WeeklySummaryDay;
	notifications: UserNotificationPreferences;
};

export const WEEKLY_SUMMARY_DAYS: WeeklySummaryDay[] = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
];

export const DEFAULT_USER_SETTINGS: UserSettings = {
	timezone: null,
	reminderTime: "18:00",
	weeklySummaryDay: "monday",
	notifications: {
		recovery: true,
		goals: true,
		nutrition: true,
		summaries: true,
		devices: true,
	},
};

function mapSettingsRow(
	row: Tables<"user_settings"> | null | undefined
): UserSettings {
	if (!row) {
		return DEFAULT_USER_SETTINGS;
	}

	return {
		timezone: normalizeTimezone(row.timezone),
		reminderTime: normalizeReminderTime(row.reminder_time),
		weeklySummaryDay: normalizeWeeklySummaryDay(row.weekly_summary_day),
		notifications: {
			recovery: row.notify_recovery,
			goals: row.notify_goals,
			nutrition: row.notify_nutrition,
			summaries: row.notify_summaries,
			devices: row.notify_devices,
		},
	};
}

export function normalizeTimezone(
	value: string | null | undefined
): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim();
	if (normalized.length === 0 || normalized.length > 120) {
		return null;
	}

	try {
		new Intl.DateTimeFormat("en-US", {
			timeZone: normalized,
		}).format(new Date());
	} catch {
		return null;
	}

	return normalized;
}

export function normalizeReminderTime(
	value: string | null | undefined
): string {
	if (typeof value !== "string") {
		return DEFAULT_USER_SETTINGS.reminderTime;
	}

	const normalized = value.trim();
	return /^\d{2}:\d{2}(:\d{2})?$/.test(normalized)
		? normalized.slice(0, 5)
		: DEFAULT_USER_SETTINGS.reminderTime;
}

export function normalizeWeeklySummaryDay(
	value: string | null | undefined
): WeeklySummaryDay {
	if (typeof value !== "string") {
		return DEFAULT_USER_SETTINGS.weeklySummaryDay;
	}

	return (WEEKLY_SUMMARY_DAYS.find((day) => day === value) ??
		DEFAULT_USER_SETTINGS.weeklySummaryDay) as WeeklySummaryDay;
}

export async function getUserSettings(
	supabaseUserId: string
): Promise<UserSettings> {
	const supabase = await getUserSupabaseClient();
	if (!supabase) {
		throw new Error("Supabase user client unavailable.");
	}

	const { data, error } = await supabase
		.from("user_settings")
		.select("*")
		.eq("user_id", supabaseUserId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return mapSettingsRow((data as Tables<"user_settings"> | null) ?? null);
}

export async function getUserSettingsByUserId(
	supabaseUserId: string
): Promise<UserSettings> {
	const supabase = createAdminClient();
	const { data, error } = await supabase
		.from("user_settings")
		.select("*")
		.eq("user_id", supabaseUserId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return mapSettingsRow((data as Tables<"user_settings"> | null) ?? null);
}

export async function upsertUserSettings(params: {
	userId: string;
	timezone?: string | null;
	reminderTime?: string;
	weeklySummaryDay?: WeeklySummaryDay;
	notifications?: Partial<UserNotificationPreferences>;
}): Promise<UserSettings> {
	const current = await getUserSettingsByUserId(params.userId);
	const supabase = createAdminClient();

	const payload = {
		user_id: params.userId,
		timezone:
			params.timezone !== undefined
				? normalizeTimezone(params.timezone)
				: current.timezone,
		reminder_time:
			params.reminderTime !== undefined
				? normalizeReminderTime(params.reminderTime)
				: current.reminderTime,
		weekly_summary_day:
			params.weeklySummaryDay !== undefined
				? normalizeWeeklySummaryDay(params.weeklySummaryDay)
				: current.weeklySummaryDay,
		notify_recovery:
			params.notifications?.recovery ?? current.notifications.recovery,
		notify_goals: params.notifications?.goals ?? current.notifications.goals,
		notify_nutrition:
			params.notifications?.nutrition ?? current.notifications.nutrition,
		notify_summaries:
			params.notifications?.summaries ?? current.notifications.summaries,
		notify_devices:
			params.notifications?.devices ?? current.notifications.devices,
		updated_at: new Date().toISOString(),
	};

	const { data, error } = await supabase
		.from("user_settings")
		.upsert(payload, { onConflict: "user_id" })
		.select("*")
		.single();

	if (error) {
		throw error;
	}

	return mapSettingsRow(data as Tables<"user_settings">);
}
