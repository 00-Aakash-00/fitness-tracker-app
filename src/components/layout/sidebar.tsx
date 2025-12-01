"use client";

import { UserButton, useClerk, useUser } from "@clerk/nextjs";
import {
	Dumbbell,
	LayoutDashboard,
	LogOut,
	Menu,
	Settings,
	Target,
	TrendingUp,
	Utensils,
	Watch,
	X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const navigation = [
	{
		name: "Dashboard",
		href: "/dashboard",
		icon: LayoutDashboard,
	},
	{
		name: "Workouts",
		href: "/dashboard/workouts",
		icon: Dumbbell,
	},
	{
		name: "Nutrition",
		href: "/dashboard/nutrition",
		icon: Utensils,
	},
	{
		name: "Devices",
		href: "/dashboard/devices",
		icon: Watch,
	},
	{
		name: "Progress",
		href: "/dashboard/progress",
		icon: TrendingUp,
	},
	{
		name: "Goals",
		href: "/dashboard/goals",
		icon: Target,
	},
	{
		name: "Settings",
		href: "/dashboard/settings",
		icon: Settings,
	},
];

export function Sidebar() {
	const [isMobileOpen, setIsMobileOpen] = useState(false);
	const { signOut } = useClerk();
	const { user } = useUser();

	const handleSignOut = async () => {
		await signOut({ redirectUrl: "/sign-in" });
	};

	// Desktop nav item with tooltip
	const DesktopNavItem = ({ item }: { item: (typeof navigation)[0] }) => {
		return (
			<Tooltip delayDuration={0}>
				<TooltipTrigger asChild>
					<Link
						href={item.href}
						className="flex items-center justify-center rounded-lg p-3 transition-colors text-secondary-text hover:bg-secondary-surface hover:text-primary-text"
						aria-label={item.name}
					>
						<item.icon className="h-5 w-5 shrink-0" />
					</Link>
				</TooltipTrigger>
				<TooltipContent side="right">{item.name}</TooltipContent>
			</Tooltip>
		);
	};

	// Mobile nav item without tooltip (text is visible)
	const MobileNavItem = ({ item }: { item: (typeof navigation)[0] }) => {
		return (
			<Link
				href={item.href}
				className="flex items-center gap-4 rounded-xl p-4 transition-colors text-secondary-text hover:bg-secondary-surface hover:text-primary-text active:bg-secondary-surface"
				onClick={() => setIsMobileOpen(false)}
			>
				<item.icon className="h-5 w-5 shrink-0" />
				<span className="text-sm font-medium">{item.name}</span>
			</Link>
		);
	};

	return (
		<TooltipProvider>
			{/* Mobile menu button - hidden when menu is open */}
			{!isMobileOpen && (
				<Button
					variant="outline"
					size="icon"
					className="fixed left-4 top-4 z-50 lg:hidden h-10 w-10 rounded-full shadow-md bg-primary-surface"
					onClick={() => setIsMobileOpen(true)}
					aria-label="Open menu"
				>
					<Menu className="h-5 w-5" />
				</Button>
			)}

			{/* Mobile backdrop */}
			{isMobileOpen && (
				<button
					type="button"
					className="fixed inset-0 z-30 bg-black/50 lg:hidden"
					onClick={() => setIsMobileOpen(false)}
					aria-label="Close sidebar"
				/>
			)}

			{/* Desktop Sidebar - narrow with icons only */}
			<aside className="fixed inset-y-0 left-0 z-40 hidden lg:flex w-[72px] flex-col border-r border-border bg-primary-surface">
				{/* Navigation */}
				<nav className="flex-1 space-y-1 p-2 pt-4">
					{navigation.map((item) => (
						<DesktopNavItem key={item.name} item={item} />
					))}
				</nav>

				{/* User profile & Sign out - Desktop */}
				<div className="border-t border-border p-2 space-y-2">
					<div className="flex items-center justify-center py-1">
						<UserButton
							appearance={{
								elements: {
									avatarBox: "w-9 h-9",
								},
							}}
						/>
					</div>
					<Tooltip delayDuration={0}>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								onClick={handleSignOut}
								className="w-full text-secondary-text hover:bg-secondary-surface hover:text-primary-text"
							>
								<LogOut className="h-5 w-5" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="right">Sign Out</TooltipContent>
					</Tooltip>
				</div>
			</aside>

			{/* Mobile Sidebar - full width overlay */}
			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-40 flex w-full sm:w-80 flex-col bg-primary-surface transition-all duration-300 ease-out lg:hidden",
					isMobileOpen
						? "translate-x-0 opacity-100"
						: "-translate-x-full opacity-0"
				)}
			>
				{/* Mobile Header */}
				<div className="flex items-center justify-between p-4 border-b border-border">
					<span className="font-primary text-lg font-semibold text-primary-text">
						Fitness Tracker
					</span>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setIsMobileOpen(false)}
						className="h-10 w-10 rounded-full"
					>
						<X className="h-5 w-5" />
					</Button>
				</div>

				{/* User Profile Section - Mobile */}
				<div className="p-4 border-b border-border">
					<div className="flex items-center gap-3">
						<UserButton
							appearance={{
								elements: {
									avatarBox: "w-12 h-12",
								},
							}}
						/>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-primary-text truncate">
								{user?.fullName || user?.firstName || "User"}
							</p>
							<p className="text-xs text-secondary-text truncate">
								{user?.primaryEmailAddress?.emailAddress || ""}
							</p>
						</div>
					</div>
				</div>

				{/* Navigation - Mobile */}
				<nav className="flex-1 p-2 space-y-1 overflow-y-auto">
					{navigation.map((item) => (
						<MobileNavItem key={item.name} item={item} />
					))}
				</nav>

				{/* Sign Out - Mobile */}
				<div className="p-4 border-t border-border">
					<Button
						variant="ghost"
						onClick={handleSignOut}
						className="w-full justify-start gap-4 p-4 h-auto text-secondary-text hover:text-primary-text hover:bg-secondary-surface rounded-xl"
					>
						<LogOut className="h-5 w-5 shrink-0" />
						<span className="text-sm font-medium">Sign Out</span>
					</Button>
				</div>
			</aside>
		</TooltipProvider>
	);
}
