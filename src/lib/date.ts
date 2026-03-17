const DATE_STRING_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function formatDateString(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
	return formatDateString(new Date());
}

export function isValidDateString(value: string): boolean {
	const match = DATE_STRING_PATTERN.exec(value);
	if (!match) {
		return false;
	}

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);

	if (
		!Number.isInteger(year) ||
		!Number.isInteger(month) ||
		!Number.isInteger(day)
	) {
		return false;
	}

	const date = new Date(year, month - 1, day);
	return (
		date.getFullYear() === year &&
		date.getMonth() === month - 1 &&
		date.getDate() === day
	);
}

export function normalizeDateString(
	value: string | null | undefined,
	fallback = getTodayDateString()
): string {
	if (typeof value !== "string") {
		return fallback;
	}

	return isValidDateString(value) ? value : fallback;
}

export function getDateParts(value: string): {
	year: number;
	month: number;
	day: number;
} {
	const [year, month, day] = value.split("-").map(Number);
	return { year, month, day };
}
