"use client";

import { Menu } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { AppLogo } from "@/components/layout/app-logo";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { getAllSectionIds, useScrollSpy } from "@/hooks/use-scroll-spy";
import { cn } from "@/lib/utils";
import type { LegalDocument, LegalPath } from "@/types/legal";
import { LegalSidebar } from "./legal-sidebar";

interface LegalLayoutProps {
	document: LegalDocument;
	currentPath: LegalPath;
	children: ReactNode;
}

export function LegalLayout({
	document,
	currentPath,
	children,
}: LegalLayoutProps) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const sectionIds = getAllSectionIds(document.sections);
	const activeSection = useScrollSpy(sectionIds);

	const handleSectionClick = useCallback((sectionId: string) => {
		const element = window.document.getElementById(sectionId);
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "start" });
			setIsMobileMenuOpen(false);
		}
	}, []);

	return (
		<div className="min-h-screen bg-secondary-surface">
			{/* Mobile Header */}
			<header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-primary-surface px-4 py-3 md:hidden print:hidden">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setIsMobileMenuOpen(true)}
					aria-label="Open navigation"
				>
					<Menu className="h-5 w-5" />
				</Button>
				<AppLogo href="/" className="h-[35px] w-[52.5px]" sizes="53px" />
				<div className="w-9" /> {/* Spacer for centering */}
			</header>

			{/* Mobile Sheet */}
			<Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
				<SheetContent side="left" className="w-80 p-0">
					<SheetHeader className="sr-only">
						<SheetTitle>Navigation</SheetTitle>
					</SheetHeader>
					<LegalSidebar
						currentPath={currentPath}
						sections={document.sections}
						activeSection={activeSection}
						onSectionClick={handleSectionClick}
					/>
				</SheetContent>
			</Sheet>

			{/* Desktop Layout */}
			<div className="flex">
				{/* Desktop Sidebar */}
				<div className="hidden md:block w-[300px] flex-shrink-0 print:hidden">
					<div className="sticky top-0 h-screen border-r border-border">
						{/* Desktop Logo */}
						<div className="flex items-center h-14 px-4 border-b border-border">
							<AppLogo href="/" className="h-[35px] w-[52.5px]" sizes="53px" />
						</div>
						<div className="h-[calc(100vh-3.5rem)] overflow-hidden">
							<LegalSidebar
								currentPath={currentPath}
								sections={document.sections}
								activeSection={activeSection}
								onSectionClick={handleSectionClick}
							/>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<main className="flex-1 min-w-0">
					<div
						className={cn(
							"mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12",
							"print:max-w-none print:px-0 print:py-0"
						)}
					>
						{children}
					</div>
					<Footer />
				</main>
			</div>
		</div>
	);
}
