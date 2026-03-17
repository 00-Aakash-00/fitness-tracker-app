"use client";

import { Bell, BellDot, Check, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
	deleteNotificationAction,
	markAllNotificationsAsReadAction,
	markNotificationAsReadAction,
} from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import type { NotificationFeedItem } from "@/lib/notifications.server";
import { cn } from "@/lib/utils";

function formatRelativeTime(value: string): string {
	const parsed = Date.parse(value);
	if (Number.isNaN(parsed)) {
		return "Just now";
	}

	const diffMs = Date.now() - parsed;
	const diffMinutes = Math.max(1, Math.floor(diffMs / 60_000));

	if (diffMinutes < 60) return `${diffMinutes}m ago`;

	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) return `${diffHours}h ago`;

	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 7) return `${diffDays}d ago`;

	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
	}).format(new Date(parsed));
}

export function NotificationPanel({
	initialNotifications,
}: {
	initialNotifications: NotificationFeedItem[];
}) {
	const [open, setOpen] = useState(false);
	const [notifications, setNotifications] =
		useState<NotificationFeedItem[]>(initialNotifications);
	const [isPending, startTransition] = useTransition();
	const panelRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		setNotifications(initialNotifications);
	}, [initialNotifications]);

	const unreadCount = notifications.filter(
		(notification) => !notification.isRead
	).length;

	const markAsRead = (id: string) => {
		setNotifications((prev) =>
			prev.map((notification) =>
				notification.id === id
					? {
							...notification,
							isRead: true,
							readAt: notification.readAt ?? new Date().toISOString(),
						}
					: notification
			)
		);

		startTransition(() => {
			void markNotificationAsReadAction(id);
		});
	};

	const markAllAsRead = () => {
		const readAt = new Date().toISOString();
		setNotifications((prev) =>
			prev.map((notification) => ({
				...notification,
				isRead: true,
				readAt: notification.readAt ?? readAt,
			}))
		);

		startTransition(() => {
			void markAllNotificationsAsReadAction();
		});
	};

	const removeNotification = (id: string) => {
		setNotifications((prev) =>
			prev.filter((notification) => notification.id !== id)
		);

		startTransition(() => {
			void deleteNotificationAction(id);
		});
	};

	useEffect(() => {
		if (!open) return;

		const handleClickOutside = (event: MouseEvent | TouchEvent) => {
			if (
				panelRef.current &&
				!panelRef.current.contains(event.target as Node) &&
				buttonRef.current &&
				!buttonRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("touchstart", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("touchstart", handleClickOutside);
		};
	}, [open]);

	useEffect(() => {
		if (!open) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setOpen(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open]);

	return (
		<div className="relative">
			<Button
				ref={buttonRef}
				variant="ghost"
				size="icon"
				className="relative h-9 w-9 rounded-full"
				onClick={() => setOpen((current) => !current)}
				aria-label="Notifications"
			>
				{unreadCount > 0 ? (
					<>
						<BellDot className="h-5 w-5 text-secondary-text" />
						<span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-warm text-[10px] font-bold text-white">
							{unreadCount > 9 ? "9+" : unreadCount}
						</span>
					</>
				) : (
					<Bell className="h-5 w-5 text-secondary-text" />
				)}
			</Button>

			{open ? (
				<div
					ref={panelRef}
					className="absolute right-0 z-50 mt-2 w-[calc(100vw-2rem)] max-w-80 rounded-xl border border-border/40 bg-primary-surface shadow-xl animate-in fade-in-0 zoom-in-95 sm:w-80"
				>
					<div className="flex items-center justify-between border-b border-border px-4 py-3">
						<div className="space-y-0.5">
							<h3 className="text-sm font-semibold text-primary-text">
								Notifications
							</h3>
							<p className="text-[10px] uppercase tracking-[0.18em] text-secondary-text">
								Recovery, goals, devices
							</p>
						</div>
						{unreadCount > 0 ? (
							<Button
								variant="ghost"
								size="sm"
								className="h-auto px-2 py-1 text-xs text-brand-cool hover:text-brand-deep"
								onClick={markAllAsRead}
								disabled={isPending}
							>
								Mark all as read
							</Button>
						) : null}
					</div>

					<div className="max-h-96 overflow-y-auto">
						{notifications.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
								<Bell className="h-8 w-8 text-secondary-text/40" />
								<p className="text-sm font-semibold text-primary-text">
									No notifications yet
								</p>
								<p className="text-xs leading-relaxed text-secondary-text">
									Real sync, recovery, nutrition, and goal events will appear
									here once they happen.
								</p>
							</div>
						) : (
							<div className="divide-y divide-border">
								{notifications.map((notification) => (
									<div
										key={notification.id}
										className={cn(
											"group relative px-4 py-3 transition-colors hover:bg-secondary-surface",
											!notification.isRead && "bg-brand-cool/5"
										)}
									>
										<div className="flex items-start gap-3">
											<div
												className={cn(
													"mt-1 h-2 w-2 shrink-0 rounded-full",
													notification.isRead
														? "bg-transparent"
														: "bg-brand-cool"
												)}
											/>
											<div className="min-w-0 flex-1 space-y-1">
												<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-text">
													{notification.type.replaceAll("_", " ")}
												</p>
												<p className="text-sm font-medium text-primary-text">
													{notification.title}
												</p>
												<p className="text-xs leading-relaxed text-secondary-text">
													{notification.body}
												</p>
												<div className="flex flex-wrap items-center gap-2">
													<p className="text-[10px] text-secondary-text/70">
														{formatRelativeTime(notification.createdAt)}
													</p>
													{notification.ctaHref && notification.ctaLabel ? (
														<Button
															asChild
															variant="ghost"
															size="sm"
															className="h-auto px-0 py-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-cool hover:bg-transparent hover:text-brand-deep"
														>
															<Link href={notification.ctaHref}>
																{notification.ctaLabel}
															</Link>
														</Button>
													) : null}
												</div>
											</div>
											<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
												{!notification.isRead ? (
													<Button
														variant="ghost"
														size="icon"
														className="h-6 w-6"
														onClick={() => markAsRead(notification.id)}
														aria-label={`Mark ${notification.title} as read`}
														disabled={isPending}
													>
														<Check className="h-3 w-3" />
													</Button>
												) : null}
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6 text-secondary-text hover:text-red-500"
													onClick={() => removeNotification(notification.id)}
													aria-label={`Delete ${notification.title}`}
													disabled={isPending}
												>
													<Trash2 className="h-3 w-3" />
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			) : null}
		</div>
	);
}
