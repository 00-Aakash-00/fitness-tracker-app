"use client";

import { useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768; // Aligns with Tailwind md:

export function useIsMobile(): boolean {
	const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

	const isMobile = useSyncExternalStore(
		(onStoreChange) => {
			const mq = window.matchMedia(query);
			const handler = () => onStoreChange();
			mq.addEventListener("change", handler);
			return () => mq.removeEventListener("change", handler);
		},
		() => window.matchMedia(query).matches,
		() => false
	);

	return isMobile;
}
