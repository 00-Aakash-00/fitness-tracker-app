"use client";

import { cn } from "@/lib/utils";
import type { LegalSection } from "@/types/legal";

interface LegalTOCProps {
	sections: LegalSection[];
	activeSection: string | null;
	searchQuery: string;
	onSectionClick: (sectionId: string) => void;
}

interface TOCItemProps {
	section: LegalSection;
	activeSection: string | null;
	searchQuery: string;
	onSectionClick: (sectionId: string) => void;
	depth?: number;
}

function matchesSearch(title: string, query: string): boolean {
	if (!query.trim()) return true;
	return title.toLowerCase().includes(query.toLowerCase());
}

function hasMatchingContent(section: LegalSection, query: string): boolean {
	if (matchesSearch(section.title, query)) return true;
	if (section.subsections) {
		return section.subsections.some((sub) => hasMatchingContent(sub, query));
	}
	return false;
}

function TOCItem({
	section,
	activeSection,
	searchQuery,
	onSectionClick,
	depth = 0,
}: TOCItemProps) {
	const isActive = activeSection === section.id;
	const matches = hasMatchingContent(section, searchQuery);

	if (!matches) return null;

	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		onSectionClick(section.id);
	};

	return (
		<li>
			<button
				type="button"
				onClick={handleClick}
				className={cn(
					"w-full text-left py-1.5 px-3 text-sm rounded-md transition-colors font-secondary",
					depth === 0 && "font-medium",
					depth === 1 && "pl-6 text-[13px]",
					depth === 2 && "pl-9 text-xs",
					isActive
						? "bg-brand-cool/10 text-brand-cool border-l-2 border-brand-cool"
						: "text-secondary-text hover:text-primary-text hover:bg-secondary-surface"
				)}
			>
				{section.number}. {section.title}
			</button>
			{section.subsections && section.subsections.length > 0 && (
				<ul className="mt-1">
					{section.subsections.map((sub) => (
						<TOCItem
							key={sub.id}
							section={sub}
							activeSection={activeSection}
							searchQuery={searchQuery}
							onSectionClick={onSectionClick}
							depth={depth + 1}
						/>
					))}
				</ul>
			)}
		</li>
	);
}

export function LegalTOC({
	sections,
	activeSection,
	searchQuery,
	onSectionClick,
}: LegalTOCProps) {
	const hasResults = sections.some((section) =>
		hasMatchingContent(section, searchQuery)
	);

	return (
		<nav aria-label="Table of contents">
			<h3 className="font-primary text-sm font-semibold text-primary-text mb-3 px-3">
				Table of Contents
			</h3>
			{hasResults ? (
				<ul className="space-y-0.5">
					{sections.map((section) => (
						<TOCItem
							key={section.id}
							section={section}
							activeSection={activeSection}
							searchQuery={searchQuery}
							onSectionClick={onSectionClick}
						/>
					))}
				</ul>
			) : (
				<p className="px-3 text-sm text-secondary-text">
					No sections match your search.
				</p>
			)}
		</nav>
	);
}
