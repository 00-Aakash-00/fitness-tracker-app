"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, BellDot, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Notification = {
	id: string;
	title: string;
	message: string;
	time: string;
	read: boolean;
};

// Placeholder notifications - in a real app, these would come from an API
const initialNotifications: Notification[] = [
	{
		id: "1",
		title: "Welcome to Fitness Tracker!",
		message: "Get started by connecting your first device.",
		time: "Just now",
		read: false,
	},
	{
		id: "2",
		title: "Daily Goal Reminder",
		message: "You're 2,000 steps away from your daily goal.",
		time: "1h ago",
		read: false,
	},
	{
		id: "3",
		title: "Weekly Summary Ready",
		message: "Your weekly fitness report is now available.",
		time: "Yesterday",
		read: true,
	},
];

export function NotificationPanel() {
	const [open, setOpen] = useState(false);
	const [notifications, setNotifications] =
		useState<Notification[]>(initialNotifications);
	const panelRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	const unreadCount = notifications.filter((n) => !n.read).length;

	const markAsRead = (id: string) => {
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, read: true } : n))
		);
	};

	const markAllAsRead = () => {
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
	};

	const removeNotification = (id: string) => {
		setNotifications((prev) => prev.filter((n) => n.id !== id));
	};

	// Close on click outside
	useEffect(() => {
		if (!open) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (
				panelRef.current &&
				!panelRef.current.contains(e.target as Node) &&
				buttonRef.current &&
				!buttonRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, [open]);

	// Close on escape
	useEffect(() => {
		if (!open) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
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
				onClick={() => setOpen(!open)}
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

			{open && (
				<div
					ref={panelRef}
					className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-border bg-primary-surface shadow-lg animate-in fade-in-0 zoom-in-95"
				>
					<div className="flex items-center justify-between border-b border-border px-4 py-3">
						<h3 className="font-primary text-sm font-semibold text-primary-text">
							Notifications
						</h3>
						{unreadCount > 0 && (
							<Button
								variant="ghost"
								size="sm"
								className="h-auto px-2 py-1 text-xs text-brand-cool hover:text-brand-deep"
								onClick={markAllAsRead}
							>
								Mark all as read
							</Button>
						)}
					</div>

					<div className="max-h-80 overflow-y-auto">
						{notifications.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 text-center">
								<Bell className="h-8 w-8 text-secondary-text/50" />
								<p className="mt-2 text-sm text-secondary-text">
									No notifications yet
								</p>
							</div>
						) : (
							<div className="divide-y divide-border">
								{notifications.map((notification) => (
									<div
										key={notification.id}
										className={cn(
											"group relative px-4 py-3 transition-colors hover:bg-secondary-surface",
											!notification.read &&
												"bg-brand-cool/5"
										)}
									>
										<div className="flex items-start gap-3">
											<div
												className={cn(
													"mt-1 h-2 w-2 shrink-0 rounded-full",
													notification.read
														? "bg-transparent"
														: "bg-brand-cool"
												)}
											/>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium text-primary-text">
													{notification.title}
												</p>
												<p className="mt-0.5 text-xs text-secondary-text line-clamp-2">
													{notification.message}
												</p>
												<p className="mt-1 text-[10px] text-secondary-text/70">
													{notification.time}
												</p>
											</div>
											<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
												{!notification.read && (
													<Button
														variant="ghost"
														size="icon"
														className="h-6 w-6"
														onClick={() =>
															markAsRead(
																notification.id
															)
														}
													>
														<Check className="h-3 w-3" />
													</Button>
												)}
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6 text-secondary-text hover:text-red-500"
													onClick={() =>
														removeNotification(
															notification.id
														)
													}
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
			)}
		</div>
	);
}
