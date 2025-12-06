import type { Metadata } from "next";

import { LegalCallout } from "@/components/legal/legal-callout";
import { LegalHeader } from "@/components/legal/legal-header";
import { LegalLayout } from "@/components/legal/legal-layout";
import { LegalSection } from "@/components/legal/legal-section";
import { termsContent } from "@/data/terms-content";

export const metadata: Metadata = {
	title: "Terms of Service | FitnessTracker",
	description:
		"Read the Terms of Service for FitnessTracker, your comprehensive fitness tracking application.",
};

export default function TermsPage() {
	return (
		<LegalLayout document={termsContent} currentPath="/terms">
			<LegalHeader
				title={termsContent.title}
				effectiveDate={termsContent.effectiveDate}
				lastUpdated={termsContent.lastUpdated}
			/>

			{termsContent.sections.map((section) => (
				<LegalSection key={section.id} section={section} />
			))}

			{termsContent.acknowledgment && (
				<LegalCallout variant="important" title="Acknowledgment">
					{termsContent.acknowledgment}
				</LegalCallout>
			)}

			<div className="mt-12 pt-8 border-t border-border">
				<p className="text-xs text-secondary-text font-secondary">
					This document was last updated on{" "}
					{new Date(termsContent.lastUpdated).toLocaleDateString("en-US", {
						year: "numeric",
						month: "long",
						day: "numeric",
					})}
					. If you have any questions about these Terms, please contact us at{" "}
					<a
						href="mailto:legal@fitnesstracker.com"
						className="text-brand-cool hover:underline"
					>
						legal@fitnesstracker.com
					</a>
					.
				</p>
			</div>
		</LegalLayout>
	);
}
