"use client";

import { useEffect, useState } from "react";
import type { NotificationFeedItem } from "@/lib/notifications.server";
import type { TodayAtAGlance } from "@/lib/progress/progress.types";
import { cn } from "@/lib/utils";
import { CommandSearch } from "./command-search";
import { NotificationPanel } from "./notification-panel";
import { TodayAtAGlancePopover } from "./today-at-a-glance-popover";

export function TopNav({
	todayAtAGlance,
	notifications,
}: {
	todayAtAGlance: TodayAtAGlance | null;
	notifications: NotificationFeedItem[];
}) {
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 10);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<header
			className={cn(
				"sticky top-0 z-30 h-16 transition-all duration-200",
				scrolled ? "backdrop-blur-md" : "bg-transparent",
			)}
		>
			<div className="flex h-full items-center justify-between px-4 md:px-6">
				{/* Left section: What's New */}
				<div className="flex items-center gap-4">
					<TodayAtAGlancePopover glance={todayAtAGlance} />
				</div>

				{/* Center section: Command Search */}
				<div className="hidden md:flex flex-1 justify-center px-4">
					<CommandSearch />
				</div>

				{/* Right section: Notifications */}
				<div className="flex items-center gap-4">
					{/* Mobile search button */}
					<div className="md:hidden">
						<CommandSearch />
					</div>
					<NotificationPanel
						key={notifications
							.map((notification) => notification.id)
							.join(":")}
						initialNotifications={notifications}
					/>
				</div>
			</div>
		</header>
	);
}
