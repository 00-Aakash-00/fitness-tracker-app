import type { Metadata } from "next";

import { LegalCallout } from "@/components/legal/legal-callout";
import { LegalHeader } from "@/components/legal/legal-header";
import { LegalLayout } from "@/components/legal/legal-layout";
import { LegalSection } from "@/components/legal/legal-section";
import { privacyContent } from "@/data/privacy-content";

export const metadata: Metadata = {
	title: "Privacy Policy | FitnessTracker",
	description:
		"Learn how FitnessTracker collects, uses, and protects your personal information and health data.",
};

export default function PrivacyPage() {
	return (
		<LegalLayout document={privacyContent} currentPath="/privacy">
			<LegalHeader
				title={privacyContent.title}
				effectiveDate={privacyContent.effectiveDate}
				lastUpdated={privacyContent.lastUpdated}
			/>

			{privacyContent.sections.map((section) => (
				<LegalSection key={section.id} section={section} />
			))}

			{privacyContent.acknowledgment && (
				<LegalCallout variant="important" title="Your Consent">
					{privacyContent.acknowledgment}
				</LegalCallout>
			)}

			<div className="mt-12 pt-8 border-t border-border">
				<p className="text-xs text-secondary-text font-secondary">
					This document was last updated on{" "}
					{new Date(privacyContent.lastUpdated).toLocaleDateString("en-US", {
						year: "numeric",
						month: "long",
						day: "numeric",
					})}
					. If you have any questions about this Privacy Policy, please contact
					us at{" "}
					<a
						href="mailto:privacy@fitnesstracker.com"
						className="text-brand-cool hover:underline"
					>
						privacy@fitnesstracker.com
					</a>
					.
				</p>
			</div>
		</LegalLayout>
	);
}
