import type { LegalDocument } from "@/types/legal";

export const privacyContent: LegalDocument = {
	title: "Privacy Policy",
	effectiveDate: "2025-01-01",
	lastUpdated: "2025-12-01",
	sections: [
		{
			id: "introduction",
			number: "1",
			title: "Introduction and Commitment to Privacy",
			level: 2,
			content: (
				<>
					<p>
						FitnessTracker ("Company," "we," "us," or "our") is committed to
						protecting your privacy and ensuring the security of your personal
						information. This Privacy Policy explains how we collect, use,
						disclose, and safeguard your information when you use our fitness
						tracking platform, mobile applications, and related services
						(collectively, the "Service").
					</p>
					<p>
						We understand that your health and fitness data is particularly
						sensitive, and we take our responsibility to protect it seriously.
						By using our Service, you agree to the collection and use of
						information in accordance with this Privacy Policy.
					</p>
				</>
			),
			subsections: [
				{
					id: "scope",
					number: "1.1",
					title: "Scope of This Policy",
					level: 3,
					content: (
						<p>
							This Privacy Policy applies to all information collected through
							our Service, including our website, mobile applications, and any
							related services, sales, marketing, or events. It does not apply
							to information collected by third parties, including any
							third-party websites, services, or applications that may be
							accessible through links on our Service.
						</p>
					),
				},
				{
					id: "data-controller",
					number: "1.2",
					title: "Data Controller",
					level: 3,
					content: (
						<p>
							FitnessTracker is the data controller responsible for your
							personal information. If you have questions or concerns about how
							we handle your data, please contact us using the information
							provided at the end of this policy.
						</p>
					),
				},
			],
		},
		{
			id: "information-collected",
			number: "2",
			title: "Information We Collect",
			level: 2,
			content: (
				<p>
					We collect various types of information to provide and improve our
					Service. This section explains what information we collect and how we
					collect it.
				</p>
			),
			subsections: [
				{
					id: "account-info",
					number: "2.1",
					title: "Account Information",
					level: 3,
					content: (
						<>
							<p>
								When you create an account, we collect personal information
								including:
							</p>
							<ul>
								<li>Email address</li>
								<li>Name (first and last)</li>
								<li>Password (stored in encrypted form)</li>
								<li>Profile photo (optional)</li>
								<li>
									Basic demographic information (age, gender, height, weight)
								</li>
							</ul>
						</>
					),
				},
				{
					id: "health-fitness-data",
					number: "2.2",
					title: "Health and Fitness Data",
					level: 3,
					content: (
						<>
							<p>
								Through our integration with wearable devices such as Whoop and
								Oura Ring, we collect health and fitness data including:
							</p>
							<ul>
								<li>Heart rate and heart rate variability (HRV)</li>
								<li>Sleep duration, stages, and quality metrics</li>
								<li>Activity levels and step counts</li>
								<li>Calories burned and energy expenditure</li>
								<li>Recovery scores and readiness indicators</li>
								<li>Respiratory rate and blood oxygen levels</li>
								<li>Strain scores and workout intensity metrics</li>
								<li>Body temperature variations</li>
							</ul>
							<p>
								This data is synchronized from your connected devices with your
								explicit authorization.
							</p>
						</>
					),
				},
				{
					id: "meal-data",
					number: "2.3",
					title: "Meal and Nutrition Data",
					level: 3,
					content: (
						<>
							<p>
								When you use our meal tracking features, we collect information
								about:
							</p>
							<ul>
								<li>Foods and beverages consumed</li>
								<li>Meal times and eating patterns</li>
								<li>Caloric intake and macronutrient information</li>
								<li>Dietary preferences and restrictions</li>
								<li>Custom recipes and food entries</li>
							</ul>
						</>
					),
				},
				{
					id: "workout-data",
					number: "2.4",
					title: "Workout Data",
					level: 3,
					content: (
						<>
							<p>We collect workout and exercise data including:</p>
							<ul>
								<li>Exercise type and duration</li>
								<li>Workout intensity and heart rate zones</li>
								<li>Repetitions, sets, and weights (for strength training)</li>
								<li>Distance and pace (for cardio activities)</li>
								<li>Personal records and performance metrics</li>
								<li>Workout notes and custom entries</li>
							</ul>
						</>
					),
				},
				{
					id: "goals-data",
					number: "2.5",
					title: "Goals and Preferences",
					level: 3,
					content: (
						<>
							<p>We collect information about your fitness goals including:</p>
							<ul>
								<li>Weight and body composition goals</li>
								<li>Activity and exercise targets</li>
								<li>Nutritional and dietary objectives</li>
								<li>Sleep and recovery goals</li>
								<li>Custom milestones and achievements</li>
							</ul>
						</>
					),
				},
				{
					id: "auto-collected",
					number: "2.6",
					title: "Automatically Collected Information",
					level: 3,
					content: (
						<>
							<p>
								When you access our Service, we automatically collect certain
								information:
							</p>
							<ul>
								<li>Device information (type, operating system, unique IDs)</li>
								<li>IP address and approximate location</li>
								<li>Browser type and version</li>
								<li>Usage patterns and feature interactions</li>
								<li>App crashes and performance data</li>
								<li>Cookies and similar tracking technologies</li>
							</ul>
						</>
					),
				},
				{
					id: "trainer-shared",
					number: "2.7",
					title: "Trainer-Shared Information",
					level: 3,
					content: (
						<p>
							If you choose to share your data with a personal trainer or coach,
							we facilitate the sharing of your selected data categories. We
							also collect records of which trainers have access to your data
							and the permissions you have granted.
						</p>
					),
				},
			],
		},
		{
			id: "how-we-use",
			number: "3",
			title: "How We Use Your Information",
			level: 2,
			content: (
				<p>
					We use the information we collect for various purposes related to
					providing, maintaining, and improving our Service.
				</p>
			),
			subsections: [
				{
					id: "provide-service",
					number: "3.1",
					title: "To Provide the Service",
					level: 3,
					content: (
						<>
							<p>We use your information to:</p>
							<ul>
								<li>Create and manage your account</li>
								<li>Display your health and fitness data</li>
								<li>Track your meals, workouts, and goals</li>
								<li>Generate insights and personalized recommendations</li>
								<li>Enable data sharing with authorized trainers</li>
								<li>Sync data across your devices</li>
							</ul>
						</>
					),
				},
				{
					id: "improve-service",
					number: "3.2",
					title: "To Improve the Service",
					level: 3,
					content: (
						<>
							<p>We analyze usage data to:</p>
							<ul>
								<li>Identify and fix technical issues</li>
								<li>Develop new features and functionality</li>
								<li>Understand user preferences and behavior</li>
								<li>Optimize performance and user experience</li>
								<li>Conduct research and analytics</li>
							</ul>
						</>
					),
				},
				{
					id: "communications",
					number: "3.3",
					title: "Communications",
					level: 3,
					content: (
						<>
							<p>We may use your contact information to:</p>
							<ul>
								<li>Send service-related notifications and updates</li>
								<li>Respond to your inquiries and support requests</li>
								<li>
									Send promotional communications (with your consent, where
									required)
								</li>
								<li>Notify you of changes to our policies or services</li>
							</ul>
						</>
					),
				},
				{
					id: "safety-legal",
					number: "3.4",
					title: "Safety and Legal",
					level: 3,
					content: (
						<>
							<p>We may use your information to:</p>
							<ul>
								<li>Detect and prevent fraud and abuse</li>
								<li>Enforce our Terms of Service</li>
								<li>Comply with legal obligations</li>
								<li>Protect the rights and safety of our users</li>
							</ul>
						</>
					),
				},
				{
					id: "legal-basis",
					number: "3.5",
					title: "Legal Basis for Processing (GDPR)",
					level: 3,
					content: (
						<>
							<p>
								If you are located in the European Economic Area (EEA), our
								legal bases for processing your personal data include:
							</p>
							<ul>
								<li>
									<strong>Contract:</strong> Processing necessary to perform our
									contract with you
								</li>
								<li>
									<strong>Consent:</strong> Processing based on your explicit
									consent, particularly for health data
								</li>
								<li>
									<strong>Legitimate Interests:</strong> Processing for our
									legitimate business interests that do not override your rights
								</li>
								<li>
									<strong>Legal Obligation:</strong> Processing required by
									applicable law
								</li>
							</ul>
						</>
					),
				},
			],
		},
		{
			id: "data-sharing",
			number: "4",
			title: "Data Sharing and Disclosure",
			level: 2,
			content: (
				<p>
					We are committed to protecting your privacy and only share your
					information in the following circumstances:
				</p>
			),
			subsections: [
				{
					id: "trainer-sharing",
					number: "4.1",
					title: "Sharing with Trainers",
					level: 3,
					content: (
						<>
							<p>
								When you authorize sharing with a personal trainer or coach:
							</p>
							<ul>
								<li>
									Only the data categories you specifically authorize will be
									shared
								</li>
								<li>You can revoke access at any time</li>
								<li>
									Trainers are bound by confidentiality requirements in their
									agreements with us
								</li>
								<li>
									We maintain logs of data access by trainers for your review
								</li>
							</ul>
						</>
					),
				},
				{
					id: "third-party-services",
					number: "4.2",
					title: "Third-Party Service Integrations",
					level: 3,
					content: (
						<>
							<p>We share data with integrated third-party services:</p>
							<ul>
								<li>
									<strong>Whoop:</strong> We receive health metrics from Whoop
									via their API with your authorization
								</li>
								<li>
									<strong>Oura:</strong> We receive sleep and activity data from
									Oura with your authorization
								</li>
							</ul>
							<p>
								Your use of these third-party services is governed by their
								respective privacy policies.
							</p>
						</>
					),
				},
				{
					id: "service-providers",
					number: "4.3",
					title: "Service Providers",
					level: 3,
					content: (
						<p>
							We may share your information with trusted service providers who
							assist us in operating the Service, such as cloud hosting
							providers, analytics services, and customer support platforms.
							These providers are contractually bound to protect your
							information and use it only for the purposes we specify.
						</p>
					),
				},
				{
					id: "no-selling",
					number: "4.4",
					title: "We Do Not Sell Your Data",
					level: 3,
					content: (
						<p>
							<strong>
								We do not sell, rent, or trade your personal information to
								third parties for their marketing purposes.
							</strong>{" "}
							Your health and fitness data is never sold or used for advertising
							targeting.
						</p>
					),
				},
				{
					id: "legal-requirements",
					number: "4.5",
					title: "Legal Requirements",
					level: 3,
					content: (
						<p>
							We may disclose your information if required to do so by law or in
							response to valid requests by public authorities (e.g., a court or
							government agency). We will notify you of such disclosure when
							legally permitted.
						</p>
					),
				},
				{
					id: "business-transfers",
					number: "4.6",
					title: "Business Transfers",
					level: 3,
					content: (
						<p>
							If FitnessTracker is involved in a merger, acquisition, or sale of
							assets, your information may be transferred as part of that
							transaction. We will notify you of any such change and any choices
							you may have regarding your information.
						</p>
					),
				},
				{
					id: "aggregated-data",
					number: "4.7",
					title: "Aggregated and Anonymized Data",
					level: 3,
					content: (
						<p>
							We may share aggregated, anonymized data that cannot be used to
							identify you for research, analytics, and business purposes. This
							data helps us understand trends in fitness and health without
							compromising individual privacy.
						</p>
					),
				},
			],
		},
		{
			id: "data-security",
			number: "5",
			title: "Data Storage and Security",
			level: 2,
			content: (
				<p>
					We implement robust security measures to protect your personal
					information from unauthorized access, disclosure, alteration, and
					destruction.
				</p>
			),
			subsections: [
				{
					id: "security-measures",
					number: "5.1",
					title: "Security Measures",
					level: 3,
					content: (
						<>
							<p>Our security practices include:</p>
							<ul>
								<li>Encryption of data in transit (TLS/SSL) and at rest</li>
								<li>Regular security audits and vulnerability assessments</li>
								<li>Access controls and authentication requirements</li>
								<li>Employee security training and awareness programs</li>
								<li>Incident response and breach notification procedures</li>
								<li>Regular backups and disaster recovery planning</li>
							</ul>
						</>
					),
				},
				{
					id: "data-location",
					number: "5.2",
					title: "Data Location",
					level: 3,
					content: (
						<p>
							Your data is primarily stored on secure servers located in the
							United States. If we transfer data internationally, we ensure
							appropriate safeguards are in place as described in Section 10.
						</p>
					),
				},
				{
					id: "security-limitations",
					number: "5.3",
					title: "Limitations",
					level: 3,
					content: (
						<p>
							While we implement industry-standard security measures, no method
							of transmission over the Internet or electronic storage is 100%
							secure. We cannot guarantee absolute security but will notify you
							of any breach affecting your personal information as required by
							law.
						</p>
					),
				},
			],
		},
		{
			id: "your-rights",
			number: "6",
			title: "Your Privacy Rights",
			level: 2,
			content: (
				<p>
					Depending on your location, you may have certain rights regarding your
					personal information. We are committed to honoring these rights.
				</p>
			),
			subsections: [
				{
					id: "access",
					number: "6.1",
					title: "Right to Access",
					level: 3,
					content: (
						<p>
							You have the right to request a copy of the personal information
							we hold about you. You can access most of your data directly
							through your account settings, or you can contact us for a
							comprehensive data export.
						</p>
					),
				},
				{
					id: "rectification",
					number: "6.2",
					title: "Right to Rectification",
					level: 3,
					content: (
						<p>
							You have the right to correct any inaccurate or incomplete
							personal information. You can update most information through your
							account settings, or contact us for assistance.
						</p>
					),
				},
				{
					id: "deletion",
					number: "6.3",
					title: "Right to Deletion",
					level: 3,
					content: (
						<p>
							You have the right to request deletion of your personal
							information. You can delete your account through your settings, or
							contact us. Note that we may retain certain information as
							required by law or for legitimate business purposes.
						</p>
					),
				},
				{
					id: "portability",
					number: "6.4",
					title: "Right to Data Portability",
					level: 3,
					content: (
						<p>
							You have the right to receive your personal data in a structured,
							commonly used, and machine-readable format. We provide data export
							functionality in your account settings.
						</p>
					),
				},
				{
					id: "restriction",
					number: "6.5",
					title: "Right to Restrict Processing",
					level: 3,
					content: (
						<p>
							In certain circumstances, you have the right to request that we
							restrict the processing of your personal information. Contact us
							to exercise this right.
						</p>
					),
				},
				{
					id: "objection",
					number: "6.6",
					title: "Right to Object",
					level: 3,
					content: (
						<p>
							You have the right to object to certain types of processing,
							including processing for direct marketing purposes. You can manage
							your communication preferences in your account settings.
						</p>
					),
				},
				{
					id: "gdpr-rights",
					number: "6.7",
					title: "Additional Rights for EEA Residents",
					level: 3,
					content: (
						<p>
							If you are located in the European Economic Area, you have
							additional rights under GDPR, including the right to withdraw
							consent at any time and the right to lodge a complaint with your
							local data protection authority.
						</p>
					),
				},
				{
					id: "ccpa-rights",
					number: "6.8",
					title: "Additional Rights for California Residents",
					level: 3,
					content: (
						<>
							<p>
								California residents have additional rights under the California
								Consumer Privacy Act (CCPA) and California Privacy Rights Act
								(CPRA):
							</p>
							<ul>
								<li>Right to know what personal information is collected</li>
								<li>Right to know whether personal information is sold</li>
								<li>Right to opt out of the sale of personal information</li>
								<li>
									Right to non-discrimination for exercising privacy rights
								</li>
								<li>Right to correct inaccurate personal information</li>
								<li>Right to limit use of sensitive personal information</li>
							</ul>
							<p>As stated above, we do not sell your personal information.</p>
						</>
					),
				},
			],
		},
		{
			id: "children",
			number: "7",
			title: "Children's Privacy",
			level: 2,
			content: <></>,
			subsections: [
				{
					id: "age-restrictions",
					number: "7.1",
					title: "Age Restrictions",
					level: 3,
					content: (
						<p>
							Our Service is not intended for children under 13 years of age. We
							do not knowingly collect personal information from children under
							13. If you are a parent or guardian and believe your child has
							provided us with personal information, please contact us
							immediately.
						</p>
					),
				},
				{
					id: "coppa",
					number: "7.2",
					title: "COPPA Compliance",
					level: 3,
					content: (
						<p>
							We comply with the Children's Online Privacy Protection Act
							(COPPA). If we discover that we have collected personal
							information from a child under 13, we will delete that information
							as quickly as possible.
						</p>
					),
				},
				{
					id: "parental-rights",
					number: "7.3",
					title: "Parental Rights",
					level: 3,
					content: (
						<p>
							Parents or guardians may contact us to review, delete, or stop the
							collection of their child's personal information. We will verify
							the identity of the requester before taking action.
						</p>
					),
				},
			],
		},
		{
			id: "third-party-links",
			number: "8",
			title: "Third-Party Links and Services",
			level: 2,
			content: (
				<p>
					Our Service may contain links to third-party websites, applications,
					or services that are not operated by us. We are not responsible for
					the privacy practices of these third parties. We encourage you to
					review the privacy policies of any third-party services you access
					through our Service.
				</p>
			),
		},
		{
			id: "data-retention",
			number: "9",
			title: "Data Retention",
			level: 2,
			content: <></>,
			subsections: [
				{
					id: "retention-periods",
					number: "9.1",
					title: "Retention Periods",
					level: 3,
					content: (
						<>
							<p>
								We retain your personal information for as long as necessary to:
							</p>
							<ul>
								<li>Provide the Service to you</li>
								<li>Comply with legal obligations</li>
								<li>Resolve disputes and enforce agreements</li>
								<li>Support business operations</li>
							</ul>
							<p>
								Your health and fitness data is retained for the duration of
								your account and for a reasonable period afterward to allow for
								account reactivation or data export.
							</p>
						</>
					),
				},
				{
					id: "deletion-process",
					number: "9.2",
					title: "Deletion Process",
					level: 3,
					content: (
						<p>
							When you delete your account, we will delete or anonymize your
							personal information within 30 days, except where retention is
							required by law or for legitimate business purposes. Backup copies
							may take additional time to be fully purged from our systems.
						</p>
					),
				},
			],
		},
		{
			id: "international-transfers",
			number: "10",
			title: "International Data Transfers",
			level: 2,
			content: <></>,
			subsections: [
				{
					id: "transfer-mechanisms",
					number: "10.1",
					title: "Transfer Mechanisms",
					level: 3,
					content: (
						<p>
							If we transfer your personal data outside of your country of
							residence, we will ensure appropriate safeguards are in place,
							such as Standard Contractual Clauses approved by the European
							Commission, or other legally recognized transfer mechanisms.
						</p>
					),
				},
				{
					id: "safeguards",
					number: "10.2",
					title: "Safeguards",
					level: 3,
					content: (
						<p>
							Regardless of where your data is processed, we apply the same
							protections described in this Privacy Policy. We require our
							service providers to maintain equivalent levels of data protection
							through contractual obligations.
						</p>
					),
				},
			],
		},
		{
			id: "cookies",
			number: "11",
			title: "Cookies and Tracking Technologies",
			level: 2,
			content: <></>,
			subsections: [
				{
					id: "cookie-types",
					number: "11.1",
					title: "Types of Cookies We Use",
					level: 3,
					content: (
						<>
							<p>We use the following types of cookies:</p>
							<ul>
								<li>
									<strong>Essential Cookies:</strong> Required for the Service
									to function properly
								</li>
								<li>
									<strong>Functional Cookies:</strong> Remember your preferences
									and settings
								</li>
								<li>
									<strong>Analytics Cookies:</strong> Help us understand how you
									use the Service
								</li>
								<li>
									<strong>Performance Cookies:</strong> Monitor and improve
									Service performance
								</li>
							</ul>
						</>
					),
				},
				{
					id: "cookie-management",
					number: "11.2",
					title: "Managing Cookies",
					level: 3,
					content: (
						<p>
							Most web browsers allow you to control cookies through their
							settings. You can typically set your browser to block or delete
							cookies. However, disabling certain cookies may affect the
							functionality of our Service.
						</p>
					),
				},
				{
					id: "dnt",
					number: "11.3",
					title: "Do Not Track",
					level: 3,
					content: (
						<p>
							We currently do not respond to "Do Not Track" browser signals, as
							there is no industry-standard interpretation of this signal.
							However, you can manage your tracking preferences through your
							browser settings and our cookie preferences.
						</p>
					),
				},
			],
		},
		{
			id: "changes",
			number: "12",
			title: "Changes to This Privacy Policy",
			level: 2,
			content: (
				<p>
					We may update this Privacy Policy from time to time to reflect changes
					in our practices or for legal, operational, or regulatory reasons. We
					will notify you of any material changes by posting the updated policy
					on our Service with a new "Last Updated" date. For significant
					changes, we may also notify you via email or through an in-app
					notification. We encourage you to review this Privacy Policy
					periodically.
				</p>
			),
		},
		{
			id: "contact",
			number: "13",
			title: "Contact Information",
			level: 2,
			content: (
				<>
					<p>
						If you have any questions, concerns, or requests regarding this
						Privacy Policy or our data practices, please contact us:
					</p>
					<ul>
						<li>
							<strong>Email:</strong> privacy@fitnesstracker.com
						</li>
						<li>
							<strong>Data Protection Inquiries:</strong> dpo@fitnesstracker.com
						</li>
						<li>
							<strong>Website:</strong> www.fitnesstracker.com/privacy
						</li>
					</ul>
					<p>
						We will respond to your request within a reasonable timeframe and in
						accordance with applicable data protection laws.
					</p>
				</>
			),
		},
		{
			id: "additional",
			number: "14",
			title: "Additional Disclosures",
			level: 2,
			content: <></>,
			subsections: [
				{
					id: "sensitive-data",
					number: "14.1",
					title: "Sensitive Personal Data",
					level: 3,
					content: (
						<p>
							Our Service processes health and fitness data, which is considered
							sensitive personal data under many privacy laws. We only collect
							and process this data with your explicit consent and implement
							additional safeguards to protect it, including enhanced
							encryption, access controls, and audit logging.
						</p>
					),
				},
				{
					id: "california-specific",
					number: "14.2",
					title: "California-Specific Disclosures",
					level: 3,
					content: (
						<>
							<p>
								For California residents, the following categories of personal
								information may be collected:
							</p>
							<ul>
								<li>Identifiers (name, email, IP address)</li>
								<li>
									Personal information categories (physical characteristics)
								</li>
								<li>Internet or network activity information</li>
								<li>Geolocation data (approximate)</li>
								<li>Inferences drawn from the above to create a profile</li>
							</ul>
							<p>
								We do not sell personal information, and we do not share
								personal information for cross-context behavioral advertising.
							</p>
						</>
					),
				},
				{
					id: "hipaa-notice",
					number: "14.3",
					title: "HIPAA Notice",
					level: 3,
					content: (
						<p>
							FitnessTracker is not a covered entity under the Health Insurance
							Portability and Accountability Act (HIPAA). While we implement
							strong security measures to protect your health information, HIPAA
							regulations do not apply to our Service. If you have specific
							healthcare-related privacy concerns, please consult with your
							healthcare provider.
						</p>
					),
				},
			],
		},
	],
	acknowledgment: (
		<>
			<p>
				<strong>By using FitnessTracker, you acknowledge that:</strong>
			</p>
			<ul>
				<li>You have read and understood this Privacy Policy</li>
				<li>
					You consent to the collection and use of your information as described
				</li>
				<li>You understand your rights regarding your personal data</li>
				<li>
					You can contact us at any time with questions or concerns about your
					privacy
				</li>
			</ul>
		</>
	),
};
