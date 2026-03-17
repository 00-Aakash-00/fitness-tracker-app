"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

export function TimezoneSync({
	currentTimezone,
}: {
	currentTimezone: string | null;
}) {
	const attemptedRef = useRef(false);
	const router = useRouter();
	const [, startTransition] = useTransition();

	useEffect(() => {
		if (attemptedRef.current) {
			return;
		}

		if (currentTimezone) {
			return;
		}

		const browserTimezone =
			Intl.DateTimeFormat().resolvedOptions().timeZone?.trim() ?? "";
		if (!browserTimezone || browserTimezone === currentTimezone) {
			return;
		}

		attemptedRef.current = true;
		void fetch("/api/user/timezone", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ timezone: browserTimezone }),
		}).then((response) => {
			if (!response.ok) {
				return;
			}

			startTransition(() => {
				router.refresh();
			});
		});
	}, [currentTimezone, router]);

	return null;
}
