"use client";

import { UserButton, useClerk } from "@clerk/nextjs";
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
import { usePathname } from "next/navigation";
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
	const pathname = usePathname();
	const [isMobileOpen, setIsMobileOpen] = useState(false);
	const { signOut } = useClerk();

	const handleSignOut = async () => {
		await signOut({ redirectUrl: "/sign-in" });
	};

	const NavItem = ({ item }: { item: (typeof navigation)[0] }) => {
		const isActive = pathname === item.href;

		return (
			<Tooltip delayDuration={0}>
				<TooltipTrigger asChild>
					<Link
						href={item.href}
						className={cn(
							"flex items-center justify-center rounded-lg p-3 transition-colors",
							isActive
								? "bg-brand-cool/10 text-brand-cool"
								: "text-secondary-text hover:bg-secondary-surface hover:text-primary-text"
						)}
						aria-label={item.name}
						onClick={() => setIsMobileOpen(false)}
					>
						<item.icon className="h-5 w-5" />
					</Link>
				</TooltipTrigger>
				<TooltipContent side="right">{item.name}</TooltipContent>
			</Tooltip>
		);
	};

	return (
		<TooltipProvider>
			{/* Mobile menu button */}
			<Button
				variant="outline"
				size="icon"
				className="fixed left-4 top-4 z-50 lg:hidden"
				onClick={() => setIsMobileOpen(!isMobileOpen)}
				aria-label="Toggle sidebar"
			>
				{isMobileOpen ? (
					<X className="h-5 w-5" />
				) : (
					<Menu className="h-5 w-5" />
				)}
			</Button>

			{/* Mobile backdrop */}
			{isMobileOpen && (
				<button
					type="button"
					className="fixed inset-0 z-30 bg-black/50 lg:hidden"
					onClick={() => setIsMobileOpen(false)}
					aria-label="Close sidebar"
				/>
			)}

			{/* Sidebar */}
			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-40 flex w-[72px] flex-col border-r border-border bg-primary-surface transition-transform duration-300 ease-in-out lg:translate-x-0",
					isMobileOpen ? "translate-x-0" : "-translate-x-full"
				)}
			>
				{/* Navigation */}
				<nav className="flex-1 space-y-1 p-2 pt-4">
					{navigation.map((item) => (
						<NavItem key={item.name} item={item} />
					))}
				</nav>

				{/* User profile & Sign out */}
				<div className="border-t border-border p-2 space-y-2">
					{/* User Profile */}
					<div className="flex items-center justify-center py-1">
						<UserButton
							appearance={{
								elements: {
									avatarBox: "w-9 h-9",
								},
							}}
						/>
					</div>

					{/* Sign out */}
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
		</TooltipProvider>
	);
}
