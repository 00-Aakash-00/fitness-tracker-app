"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import {
	ChevronsUpDown,
	Dumbbell,
	LayoutDashboard,
	LogOut,
	Moon,
	PanelLeftIcon,
	Settings,
	Sun,
	Target,
	TrendingUp,
	UserCog,
	Utensils,
	Watch,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { AppLogo } from "@/components/layout/app-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
	{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{ name: "Workouts", href: "/dashboard/workouts", icon: Dumbbell },
	{ name: "Nutrition", href: "/dashboard/nutrition", icon: Utensils },
	{ name: "Devices", href: "/dashboard/devices", icon: Watch },
	{ name: "Progress", href: "/dashboard/progress", icon: TrendingUp },
	{ name: "Goals", href: "/dashboard/goals", icon: Target },
	{ name: "Settings", href: "/dashboard/settings", icon: Settings },
];

function SidebarCollapseToggle() {
	const { toggleSidebar, open } = useSidebar();

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton
					onClick={toggleSidebar}
					tooltip={open ? "Collapse" : "Expand"}
				>
					<PanelLeftIcon />
					<span>{open ? "Collapse" : "Expand"}</span>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

function SidebarUserFooter() {
	const clerk = useClerk();
	const { user, isLoaded } = useUser();
	const { isMobile } = useSidebar();
	const { resolvedTheme, setTheme } = useTheme();
	const [hasMounted, setHasMounted] = useState(false);

	useEffect(() => {
		setHasMounted(true);
	}, []);

	if (!isLoaded || !user) return null;

	const isDarkMode = hasMounted && resolvedTheme === "dark";

	const userInitials =
		`${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`.toUpperCase() ||
		user.emailAddresses[0]?.emailAddress?.charAt(0).toUpperCase() ||
		"U";

	const userDisplayName =
		user.fullName || user.firstName || user.username || "User";

	const userEmail =
		user.primaryEmailAddress?.emailAddress ??
		user.emailAddresses[0]?.emailAddress;

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<SidebarMenuButton
								size="lg"
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							/>
						}
					>
						<Avatar className="size-8 rounded-lg">
							<AvatarImage
								src={user.imageUrl}
								alt={userDisplayName}
							/>
							<AvatarFallback className="rounded-lg bg-brand-cool text-white text-xs">
								{userInitials}
							</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-semibold">
								{userDisplayName}
							</span>
							{userEmail && (
								<span className="truncate text-xs text-sidebar-foreground/60">
									{userEmail}
								</span>
							)}
						</div>
						<ChevronsUpDown className="ml-auto size-4" />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuItem
							onClick={() => clerk.openUserProfile()}
						>
							<UserCog className="size-4" />
							Profile
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() =>
								setTheme(isDarkMode ? "light" : "dark")
							}
						>
							{isDarkMode ? (
								<Sun className="size-4" />
							) : (
								<Moon className="size-4" />
							)}
							{isDarkMode ? "Light mode" : "Dark mode"}
						</DropdownMenuItem>
						<DropdownMenuItem
							variant="destructive"
							onClick={() => clerk.signOut()}
						>
							<LogOut className="size-4" />
							Sign out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

export function AppSidebar() {
	const pathname = usePathname();

	return (
		<Sidebar collapsible="icon" variant="sidebar">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
							<AppLogo
								href="/dashboard"
								sizes="32px"
								className="size-8 w-8"
							/>
							<span className="font-primary text-sm font-semibold">
								iAM360
							</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{navigationItems.map((item) => (
								<SidebarMenuItem key={item.name}>
									<SidebarMenuButton
										render={<Link href={item.href} />}
										isActive={pathname === item.href}
										tooltip={item.name}
									>
										<item.icon />
										<span>{item.name}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<SidebarCollapseToggle />
				<SidebarUserFooter />
			</SidebarFooter>
		</Sidebar>
	);
}
