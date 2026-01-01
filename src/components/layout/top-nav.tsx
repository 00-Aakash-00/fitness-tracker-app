"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { AppLogo } from "@/components/layout/app-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CommandSearch } from "./command-search";
import { NotificationPanel } from "./notification-panel";
import { WhatsNewCarousel } from "./whats-new-carousel";

function UserAvatar() {
	const { user, isLoaded } = useUser();

	if (!isLoaded) {
		return (
			<div className="flex items-center gap-3">
				<Skeleton className="h-8 w-8 rounded-full" />
				<div className="hidden lg:flex flex-col gap-1">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-3 w-16" />
				</div>
			</div>
		);
	}

	if (!user) return null;

	const initials =
		`${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase() ||
		user.emailAddresses[0]?.emailAddress?.charAt(0).toUpperCase() ||
		"U";

	return (
		<div className="flex items-center gap-3">
			<div className="relative">
				<Avatar className="h-8 w-8 ring-2 ring-primary-surface transition-transform duration-200 hover:scale-105">
					<AvatarImage
						src={user.imageUrl}
						alt={user.fullName || "User"}
						className="object-cover"
					/>
					<AvatarFallback className="bg-gradient-cool text-white text-xs">
						{initials}
					</AvatarFallback>
				</Avatar>
				<div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-primary-surface" />
			</div>
			<div className="hidden lg:flex flex-col">
				<span className="text-sm font-medium text-primary-text">
					{user.firstName ? `Hi, ${user.firstName}!` : "Welcome!"}
				</span>
				{user.emailAddresses[0]?.emailAddress && (
					<span className="text-xs text-secondary-text truncate max-w-[120px]">
						{user.emailAddresses[0].emailAddress}
					</span>
				)}
			</div>
		</div>
	);
}

export function TopNav() {
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
				scrolled ? "backdrop-blur-md" : "bg-transparent"
			)}
		>
			<div className="flex h-full items-center justify-between px-4 md:px-6">
				{/* Left section: Logo + What's New */}
				<div className="flex items-center gap-4">
					<AppLogo href="/dashboard" priority />
					<WhatsNewCarousel />
				</div>

				{/* Center section: Command Search */}
				<div className="hidden md:flex flex-1 justify-center px-4">
					<CommandSearch />
				</div>

				{/* Right section: Notifications + User Avatar */}
				<div className="flex items-center gap-4">
					{/* Mobile search button */}
					<div className="md:hidden">
						<CommandSearch />
					</div>
					<NotificationPanel />
					<UserAvatar />
				</div>
			</div>
		</header>
	);
}
