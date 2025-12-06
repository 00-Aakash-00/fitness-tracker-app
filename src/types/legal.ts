import type { ReactNode } from "react";

export interface LegalSection {
	id: string;
	number: string;
	title: string;
	level: 2 | 3 | 4;
	content: ReactNode;
	subsections?: LegalSection[];
}

export interface LegalDocument {
	title: string;
	effectiveDate: string;
	lastUpdated: string;
	sections: LegalSection[];
	acknowledgment?: ReactNode;
}

export interface LegalNavItem {
	href: "/terms" | "/privacy";
	label: string;
	icon: React.ComponentType<{ className?: string }>;
}

export type LegalPath = "/terms" | "/privacy";
