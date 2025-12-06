import { cn } from "@/lib/utils";
import type { LegalSection as LegalSectionType } from "@/types/legal";

interface LegalSectionProps {
	section: LegalSectionType;
	className?: string;
}

const headingStyles = {
	2: "font-primary text-xl md:text-2xl font-bold text-primary-text mb-4 mt-10 first:mt-0",
	3: "font-primary text-lg md:text-xl font-semibold text-primary-text mb-3 mt-8",
	4: "font-primary text-base md:text-lg font-medium text-primary-text mb-2 mt-6",
};

export function LegalSection({ section, className }: LegalSectionProps) {
	const HeadingTag = `h${section.level}` as "h2" | "h3" | "h4";

	return (
		<section id={section.id} className={cn("scroll-mt-24", className)}>
			<HeadingTag className={headingStyles[section.level]}>
				{section.number}. {section.title}
			</HeadingTag>
			<div className="font-secondary text-secondary-text leading-relaxed space-y-4 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-2 [&_strong]:font-semibold [&_strong]:text-primary-text">
				{section.content}
			</div>
			{section.subsections?.map((subsection) => (
				<LegalSection key={subsection.id} section={subsection} />
			))}
		</section>
	);
}
