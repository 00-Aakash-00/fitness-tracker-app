"use client";

import { useEffect, useState } from "react";

interface UseScrollSpyOptions {
	rootMargin?: string;
	threshold?: number;
}

export function useScrollSpy(
	sectionIds: string[],
	options?: UseScrollSpyOptions
): string | null {
	const [activeId, setActiveId] = useState<string | null>(null);

	useEffect(() => {
		if (sectionIds.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setActiveId(entry.target.id);
					}
				}
			},
			{
				rootMargin: options?.rootMargin ?? "-20% 0px -70% 0px",
				threshold: options?.threshold ?? 0,
			}
		);

		for (const id of sectionIds) {
			const element = document.getElementById(id);
			if (element) {
				observer.observe(element);
			}
		}

		return () => observer.disconnect();
	}, [sectionIds, options?.rootMargin, options?.threshold]);

	return activeId;
}

export function getAllSectionIds(
	sections: {
		id: string;
		subsections?: { id: string; subsections?: { id: string }[] }[];
	}[]
): string[] {
	const ids: string[] = [];

	function collectIds(
		items: {
			id: string;
			subsections?: { id: string; subsections?: { id: string }[] }[];
		}[]
	) {
		for (const item of items) {
			ids.push(item.id);
			if (item.subsections) {
				collectIds(item.subsections);
			}
		}
	}

	collectIds(sections);
	return ids;
}
