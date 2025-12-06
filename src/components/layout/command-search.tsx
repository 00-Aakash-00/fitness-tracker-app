"use client";

import {
	Apple,
	Command as CommandIcon,
	Dumbbell,
	LayoutDashboard,
	Search,
	Settings,
	Target,
	TrendingUp,
	Watch,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";

type CommandItem = {
	label: string;
	value: string;
	icon: React.ReactNode;
	path: string;
};

const fuzzy = (s: string, q: string) =>
	s.toLowerCase().includes(q.toLowerCase());

const commands: CommandItem[] = [
	{
		label: "Go to Dashboard",
		value: "dashboard",
		icon: <LayoutDashboard className="h-4 w-4" />,
		path: "/dashboard",
	},
	{
		label: "View Workouts",
		value: "workouts",
		icon: <Dumbbell className="h-4 w-4" />,
		path: "/dashboard/workouts",
	},
	{
		label: "Track Nutrition",
		value: "nutrition",
		icon: <Apple className="h-4 w-4" />,
		path: "/dashboard/nutrition",
	},
	{
		label: "Manage Devices",
		value: "devices",
		icon: <Watch className="h-4 w-4" />,
		path: "/dashboard/devices",
	},
	{
		label: "View Progress",
		value: "progress",
		icon: <TrendingUp className="h-4 w-4" />,
		path: "/dashboard/progress",
	},
	{
		label: "Set Goals",
		value: "goals",
		icon: <Target className="h-4 w-4" />,
		path: "/dashboard/goals",
	},
	{
		label: "Settings",
		value: "settings",
		icon: <Settings className="h-4 w-4" />,
		path: "/dashboard/settings",
	},
];

export function CommandSearch() {
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const isMobile = useIsMobile();

	const results = useMemo(() => {
		if (query.trim() === "") return commands;
		return commands.filter((c) => fuzzy(c.label, query));
	}, [query]);

	const handleSelect = useCallback(
		(item: CommandItem) => {
			router.push(item.path);
			setOpen(false);
			setQuery("");
		},
		[router]
	);

	// Keyboard shortcut (Cmd/Ctrl + K)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				inputRef.current?.focus();
				setOpen(true);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	// Close on escape
	useEffect(() => {
		if (!open) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setOpen(false);
				setQuery("");
				inputRef.current?.blur();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open]);

	// Close on click outside
	useEffect(() => {
		if (!open) return;
		const handleClickOutside = (e: MouseEvent | TouchEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node) &&
				inputRef.current &&
				!inputRef.current.contains(e.target as Node)
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

	return (
		<div className="relative w-full max-w-[240px] md:max-w-sm">
			<div className="relative">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-text" />
				<Input
					ref={inputRef}
					type="search"
					placeholder={isMobile ? "Search" : "Search or type a command..."}
					className="h-9 w-full rounded-full bg-input-bg pl-9 pr-12 text-sm placeholder:text-xs"
					value={query}
					onFocus={() => setOpen(true)}
					onChange={(e) => {
						setQuery(e.target.value);
						setOpen(true);
						setHighlightedIndex(0);
					}}
					onKeyDown={(e) => {
						if (e.key === "ArrowDown") {
							e.preventDefault();
							setHighlightedIndex((h) => Math.min(h + 1, results.length - 1));
						} else if (e.key === "ArrowUp") {
							e.preventDefault();
							setHighlightedIndex((h) => Math.max(h - 1, 0));
						} else if (e.key === "Enter") {
							e.preventDefault();
							const item = results[highlightedIndex];
							if (item) {
								handleSelect(item);
							}
						}
					}}
					autoComplete="off"
					aria-autocomplete="list"
					aria-controls="command-palette-dropdown"
				/>
				<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
					<kbd className="hidden h-5 select-none items-center gap-1 rounded border border-border bg-secondary-surface px-1.5 font-mono text-[10px] font-medium text-secondary-text sm:flex">
						<CommandIcon className="h-3 w-3" />K
					</kbd>
				</div>
			</div>

			{open && (
				<div
					ref={dropdownRef}
					id="command-palette-dropdown"
					className="absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-y-auto rounded-lg border border-border bg-primary-surface shadow-lg animate-in fade-in-0 zoom-in-95"
				>
					<div className="p-1">
						{results.length === 0 ? (
							<div className="p-3 text-center text-sm text-secondary-text">
								No results found.
							</div>
						) : (
							results.map((item, i) => (
								<Button
									key={item.value}
									variant="ghost"
									className={cn(
										"flex h-auto w-full items-center justify-start gap-3 px-3 py-2 text-sm rounded-md",
										i === highlightedIndex
											? "bg-brand-cool/10 text-brand-cool"
											: "text-primary-text hover:bg-secondary-surface"
									)}
									onMouseEnter={() => setHighlightedIndex(i)}
									onMouseDown={(e) => {
										e.preventDefault();
										handleSelect(item);
									}}
								>
									<span
										className={cn(
											i === highlightedIndex
												? "text-brand-cool"
												: "text-secondary-text"
										)}
									>
										{item.icon}
									</span>
									<span className="truncate font-normal">{item.label}</span>
								</Button>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
}
