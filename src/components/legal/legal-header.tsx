import { cn } from "@/lib/utils";

interface LegalHeaderProps {
	title: string;
	effectiveDate: string;
	lastUpdated: string;
	className?: string;
}

function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export function LegalHeader({
	title,
	effectiveDate,
	lastUpdated,
	className,
}: LegalHeaderProps) {
	return (
		<header className={cn("mb-8 pb-8 border-b border-border", className)}>
			<h1 className="font-primary text-3xl md:text-4xl font-bold text-primary-text mb-4">
				{title}
			</h1>
			<div className="flex flex-col gap-1 sm:flex-row sm:gap-6 text-sm text-secondary-text font-secondary">
				<div>
					<span className="font-medium">Effective Date:</span>{" "}
					{formatDate(effectiveDate)}
				</div>
				<div>
					<span className="font-medium">Last Updated:</span>{" "}
					{formatDate(lastUpdated)}
				</div>
			</div>
		</header>
	);
}
