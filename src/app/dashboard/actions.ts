"use server";

import { revalidatePath } from "next/cache";
import {
	deleteNotification,
	markAllNotificationsAsRead,
	markNotificationAsRead,
} from "@/lib/notifications.server";

export async function markNotificationAsReadAction(notificationId: string) {
	await markNotificationAsRead(notificationId);
	revalidatePath("/dashboard", "layout");
}

export async function markAllNotificationsAsReadAction() {
	await markAllNotificationsAsRead();
	revalidatePath("/dashboard", "layout");
}

export async function deleteNotificationAction(notificationId: string) {
	await deleteNotification(notificationId);
	revalidatePath("/dashboard", "layout");
}
