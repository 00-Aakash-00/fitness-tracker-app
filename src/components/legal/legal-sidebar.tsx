"use client";

import { FileText, Printer, Search, Shield } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { LegalPath, LegalSection } from "@/types/legal";

import { LegalTOC } from "./legal-toc";

interface LegalSidebarProps {
	currentPath: LegalPath;
	sections: LegalSection[];
	activeSection: string | null;
	onSectionClick: (sectionId: string) => void;
	className?: string;
}

const legalNavItems = [
	{
		href: "/terms" as const,
		label: "Terms of Service",
		icon: FileText,
	},
	{
		href: "/privacy" as const,
		label: "Privacy Policy",
		icon: Shield,
	},
];

export function LegalSidebar({
	currentPath,
	sections,
	activeSection,
	onSectionClick,
	className,
}: LegalSidebarProps) {
	const [searchQuery, setSearchQuery] = useState("");

	const handlePrint = () => {
		window.print();
	};

	return (
		<aside
			className={cn(
				"flex flex-col h-full overflow-y-auto bg-primary-surface",
				className
			)}
		>
			{/* Legal Documents Navigation */}
			<div className="p-4 border-b border-border">
				<h2 className="font-primary text-sm font-semibold text-primary-text mb-3">
					Legal Documents
				</h2>
				<nav className="space-y-1">
					{legalNavItems.map((item) => {
						const Icon = item.icon;
						const isCurrent = currentPath === item.href;

						return (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									"flex items-center gap-2 px-3 py-2 rounded-md text-sm font-secondary transition-colors",
									isCurrent
										? "bg-brand-cool/10 text-brand-cool"
										: "text-secondary-text hover:bg-secondary-surface hover:text-primary-text"
								)}
							>
								<Icon className="h-4 w-4 flex-shrink-0" />
								<span className="flex-1">{item.label}</span>
								{isCurrent && (
									<Badge variant="outline" className="text-xs">
										Current
									</Badge>
								)}
							</Link>
						);
					})}
				</nav>
			</div>

			{/* Search Box */}
			<div className="p-4 border-b border-border">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text" />
					<Input
						type="text"
						placeholder="Search sections..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
			</div>

			{/* Print Button */}
			<div className="p-4 border-b border-border print:hidden">
				<Button
					variant="outline"
					className="w-full justify-center gap-2"
					onClick={handlePrint}
				>
					<Printer className="h-4 w-4" />
					Print Document
				</Button>
			</div>

			{/* Table of Contents */}
			<div className="flex-1 p-4 overflow-y-auto">
				<LegalTOC
					sections={sections}
					activeSection={activeSection}
					searchQuery={searchQuery}
					onSectionClick={onSectionClick}
				/>
			</div>
		</aside>
	);
}
