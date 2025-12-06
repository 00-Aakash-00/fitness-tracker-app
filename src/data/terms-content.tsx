import type { LegalDocument } from "@/types/legal";

export const termsContent: LegalDocument = {
	title: "Terms of Service",
	effectiveDate: "2025-01-01",
	lastUpdated: "2025-12-01",
	sections: [
		{
			id: "acceptance",
			number: "1",
			title: "Acceptance of Terms",
			level: 2,
			content: (
				<>
					<p>
						Welcome to FitnessTracker. By accessing or using our fitness
						tracking platform, mobile applications, and related services
						(collectively, the "Service"), you agree to be bound by these Terms
						of Service ("Terms"). If you do not agree to these Terms, please do
						not use our Service.
					</p>
					<p>
						These Terms constitute a legally binding agreement between you and
						FitnessTracker ("Company," "we," "us," or "our"). We reserve the
						right to modify these Terms at any time, and such modifications will
						be effective immediately upon posting. Your continued use of the
						Service following any changes constitutes acceptance of those
						changes.
					</p>
				</>
			),
			subsections: [
				{
					id: "eligibility",
					number: "1.1",
					title: "User Eligibility",
					level: 3,
					content: (
						<p>
							You must be at least 13 years of age to use our Service. If you
							are between 13 and 18 years of age, you must have your parent or
							legal guardian's permission to use the Service, and they must
							agree to these Terms on your behalf. By using the Service, you
							represent and warrant that you meet these eligibility
							requirements.
						</p>
					),
				},
				{
					id: "account-registration",
					number: "1.2",
					title: "Account Registration",
					level: 3,
					content: (
						<p>
							To access certain features of the Service, you must register for
							an account. When you register, you agree to provide accurate,
							current, and complete information and to maintain and promptly
							update this information. You are responsible for safeguarding your
							account credentials and for all activities that occur under your
							account.
						</p>
					),
				},
			],
		},
		{
			id: "services",
			number: "2",
			title: "Description of Services",
			level: 2,
			content: (
				<p>
					FitnessTracker provides a comprehensive fitness and health tracking
					platform that enables users to monitor and manage their wellness
					journey. Our Service includes, but is not limited to, the following
					features:
				</p>
			),
			subsections: [
				{
					id: "device-integration",
					number: "2.1",
					title: "Device Integration",
					level: 3,
					content: (
						<>
							<p>
								Our Service integrates with third-party wearable devices,
								including but not limited to Whoop and Oura Ring, to collect and
								display your health and fitness data. This integration allows us
								to retrieve information such as:
							</p>
							<ul>
								<li>Heart rate and heart rate variability (HRV)</li>
								<li>Sleep patterns, stages, and quality metrics</li>
								<li>Activity levels and calorie expenditure</li>
								<li>Recovery scores and readiness indicators</li>
								<li>Respiratory rate and blood oxygen levels</li>
								<li>Strain and workout intensity metrics</li>
							</ul>
							<p>
								The availability and accuracy of this data depend on the
								third-party devices and their respective services. We are not
								responsible for any inaccuracies or interruptions in data from
								these devices.
							</p>
						</>
					),
				},
				{
					id: "meal-tracking",
					number: "2.2",
					title: "Meal and Nutrition Tracking",
					level: 3,
					content: (
						<p>
							Users can log meals, track nutritional intake, and monitor dietary
							patterns. This feature allows you to record food consumption,
							track macronutrients and micronutrients, set nutritional goals,
							and view historical eating patterns. Nutritional information
							provided is for informational purposes only and should not
							substitute professional dietary advice.
						</p>
					),
				},
				{
					id: "workout-tracking",
					number: "2.3",
					title: "Workout Tracking",
					level: 3,
					content: (
						<p>
							Our Service enables you to log, track, and analyze your workouts
							and physical activities. You can record exercise types, duration,
							intensity, and other relevant metrics. The Service may provide
							workout suggestions, progress tracking, and performance analytics
							based on your recorded data.
						</p>
					),
				},
				{
					id: "goals",
					number: "2.4",
					title: "Goal Setting and Monitoring",
					level: 3,
					content: (
						<p>
							Users can set personalized fitness and health goals, track
							progress toward those goals, and receive insights and
							recommendations. Goals may include weight management, activity
							targets, sleep objectives, and other health-related milestones.
						</p>
					),
				},
				{
					id: "trainer-sharing",
					number: "2.5",
					title: "Trainer and Coach Data Sharing",
					level: 3,
					content: (
						<>
							<p>
								Our Service allows you to share your fitness and health data
								with personal trainers, coaches, or other authorized individuals
								("Trainers"). This feature enables collaborative fitness
								planning and personalized guidance. When you choose to share
								data with a Trainer:
							</p>
							<ul>
								<li>
									You explicitly authorize the sharing of specified data
									categories
								</li>
								<li>
									You control which data is shared and can revoke access at any
									time
								</li>
								<li>
									Trainers are bound by confidentiality obligations regarding
									your data
								</li>
								<li>
									We are not responsible for how Trainers use the shared
									information
								</li>
							</ul>
						</>
					),
				},
			],
		},
		{
			id: "user-accounts",
			number: "3",
			title: "User Accounts and Responsibilities",
			level: 2,
			content: (
				<p>
					As a user of FitnessTracker, you have certain responsibilities
					regarding your account and use of the Service.
				</p>
			),
			subsections: [
				{
					id: "account-security",
					number: "3.1",
					title: "Account Security",
					level: 3,
					content: (
						<>
							<p>
								You are responsible for maintaining the confidentiality of your
								account credentials and for all activities that occur under your
								account. You agree to:
							</p>
							<ul>
								<li>
									Create a strong, unique password and not share it with others
								</li>
								<li>
									Notify us immediately of any unauthorized access or security
									breach
								</li>
								<li>Log out of your account after each session</li>
								<li>
									Not transfer your account to any other person without our
									prior written consent
								</li>
							</ul>
						</>
					),
				},
				{
					id: "acceptable-use",
					number: "3.2",
					title: "Acceptable Use",
					level: 3,
					content: (
						<>
							<p>You agree not to:</p>
							<ul>
								<li>
									Use the Service for any unlawful purpose or in violation of
									any applicable laws
								</li>
								<li>
									Attempt to gain unauthorized access to any part of the Service
								</li>
								<li>
									Interfere with or disrupt the Service or servers connected to
									the Service
								</li>
								<li>Transmit any viruses, malware, or other harmful code</li>
								<li>
									Impersonate any person or entity or misrepresent your
									affiliation
								</li>
								<li>
									Collect or store personal information about other users
									without their consent
								</li>
								<li>
									Use the Service to harass, abuse, or harm another person
								</li>
							</ul>
						</>
					),
				},
				{
					id: "data-accuracy",
					number: "3.3",
					title: "Data Accuracy",
					level: 3,
					content: (
						<p>
							You are responsible for the accuracy of information you provide
							and data you enter into the Service. This includes meal logs,
							workout entries, goals, and any other user-generated content. We
							are not liable for decisions made based on inaccurate
							user-provided information.
						</p>
					),
				},
			],
		},
		{
			id: "user-content",
			number: "4",
			title: "User-Generated Content",
			level: 2,
			content: (
				<>
					<p>
						The Service allows you to create, submit, and store various types of
						content, including meal logs, workout notes, goals, comments, and
						other materials ("User Content").
					</p>
				</>
			),
			subsections: [
				{
					id: "content-ownership",
					number: "4.1",
					title: "Ownership and License",
					level: 3,
					content: (
						<p>
							You retain ownership of your User Content. However, by submitting
							User Content to the Service, you grant us a non-exclusive,
							worldwide, royalty-free license to use, store, process, and
							display your User Content solely for the purpose of providing and
							improving the Service. This license terminates when you delete
							your User Content or close your account, except where retention is
							required by law.
						</p>
					),
				},
				{
					id: "content-standards",
					number: "4.2",
					title: "Content Standards",
					level: 3,
					content: (
						<>
							<p>
								You agree that your User Content will not contain material that:
							</p>
							<ul>
								<li>Is defamatory, obscene, or offensive</li>
								<li>Infringes any intellectual property rights</li>
								<li>Contains personal information about third parties</li>
								<li>
									Promotes illegal activities or violates any applicable laws
								</li>
							</ul>
						</>
					),
				},
				{
					id: "backup",
					number: "4.3",
					title: "Data Backup",
					level: 3,
					content: (
						<p>
							While we implement reasonable measures to protect your User
							Content, you are encouraged to maintain your own backups. We are
							not responsible for any loss of User Content due to technical
							failures, account termination, or other circumstances.
						</p>
					),
				},
			],
		},
		{
			id: "third-party",
			number: "5",
			title: "Third-Party Integrations",
			level: 2,
			content: (
				<p>
					Our Service integrates with third-party services and devices to
					enhance your experience. Your use of these integrations is subject to
					additional terms and conditions.
				</p>
			),
			subsections: [
				{
					id: "whoop-oura",
					number: "5.1",
					title: "Whoop and Oura Integration",
					level: 3,
					content: (
						<>
							<p>
								When you connect your Whoop or Oura device to FitnessTracker:
							</p>
							<ul>
								<li>
									You authorize us to access and retrieve your health and
									fitness data from these services
								</li>
								<li>
									Your use of Whoop and Oura is governed by their respective
									terms of service and privacy policies
								</li>
								<li>
									We are not responsible for the availability, accuracy, or
									security of data provided by these third-party services
								</li>
								<li>
									Any issues with device functionality or data collection should
									be directed to the respective device manufacturers
								</li>
							</ul>
						</>
					),
				},
				{
					id: "third-party-terms",
					number: "5.2",
					title: "Third-Party Terms",
					level: 3,
					content: (
						<p>
							Third-party integrations may be subject to their own terms of
							service, privacy policies, and other agreements. By using these
							integrations through our Service, you agree to comply with the
							applicable third-party terms. We encourage you to review these
							terms before connecting your devices.
						</p>
					),
				},
			],
		},
		{
			id: "trainer-data-sharing",
			number: "6",
			title: "Trainer and Coach Data Sharing",
			level: 2,
			content: (
				<p>
					FitnessTracker enables you to share your fitness and health data with
					personal trainers and coaches to receive personalized guidance and
					support.
				</p>
			),
			subsections: [
				{
					id: "consent",
					number: "6.1",
					title: "Consent and Authorization",
					level: 3,
					content: (
						<p>
							Sharing data with Trainers is entirely voluntary and requires your
							explicit consent. Before sharing any data, you will be informed of
							the specific data categories that will be shared and must actively
							authorize the sharing. You may grant or deny access to specific
							data types independently.
						</p>
					),
				},
				{
					id: "data-categories",
					number: "6.2",
					title: "Data Categories",
					level: 3,
					content: (
						<>
							<p>
								You may choose to share the following categories of data with
								Trainers:
							</p>
							<ul>
								<li>Workout history and exercise logs</li>
								<li>Meal and nutrition data</li>
								<li>Sleep and recovery metrics</li>
								<li>Goals and progress tracking</li>
								<li>Device-collected health metrics</li>
							</ul>
						</>
					),
				},
				{
					id: "trainer-obligations",
					number: "6.3",
					title: "Trainer Obligations",
					level: 3,
					content: (
						<p>
							Trainers who access your data through our Service are required to
							maintain confidentiality and use the data solely for providing
							fitness guidance. However, we cannot guarantee Trainer compliance
							and are not liable for any misuse of your data by Trainers.
						</p>
					),
				},
				{
					id: "revoking-access",
					number: "6.4",
					title: "Revoking Access",
					level: 3,
					content: (
						<p>
							You may revoke a Trainer's access to your data at any time through
							your account settings. Upon revocation, the Trainer will no longer
							be able to access your data through our Service. However, any data
							previously accessed by the Trainer may have been downloaded or
							recorded outside our system.
						</p>
					),
				},
			],
		},
		{
			id: "intellectual-property",
			number: "7",
			title: "Intellectual Property",
			level: 2,
			content: (
				<p>
					The Service and its original content, features, and functionality are
					owned by FitnessTracker and are protected by international copyright,
					trademark, patent, trade secret, and other intellectual property laws.
				</p>
			),
			subsections: [
				{
					id: "our-ip",
					number: "7.1",
					title: "Our Intellectual Property",
					level: 3,
					content: (
						<p>
							All trademarks, service marks, logos, and trade names displayed on
							the Service are our property or the property of our licensors. You
							may not use, copy, or distribute any of our intellectual property
							without our prior written consent.
						</p>
					),
				},
				{
					id: "limited-license",
					number: "7.2",
					title: "Limited License",
					level: 3,
					content: (
						<p>
							We grant you a limited, non-exclusive, non-transferable, revocable
							license to access and use the Service for your personal,
							non-commercial use. This license does not include the right to
							modify, distribute, or create derivative works from the Service.
						</p>
					),
				},
				{
					id: "feedback",
					number: "7.3",
					title: "Feedback",
					level: 3,
					content: (
						<p>
							If you provide us with feedback, suggestions, or ideas regarding
							the Service, you grant us an unrestricted, perpetual, irrevocable,
							royalty-free license to use and implement such feedback without
							any obligation to you.
						</p>
					),
				},
			],
		},
		{
			id: "disclaimers",
			number: "8",
			title: "Disclaimers",
			level: 2,
			content: (
				<p>
					Please read the following disclaimers carefully as they contain
					important information about the limitations of our Service.
				</p>
			),
			subsections: [
				{
					id: "not-medical",
					number: "8.1",
					title: "Not Medical Advice",
					level: 3,
					content: (
						<p>
							<strong>
								THE SERVICE IS NOT INTENDED TO PROVIDE MEDICAL ADVICE,
								DIAGNOSIS, OR TREATMENT.
							</strong>{" "}
							All content and features provided through the Service are for
							informational and educational purposes only. Always consult with a
							qualified healthcare provider before starting any fitness program,
							making dietary changes, or making decisions that may affect your
							health.
						</p>
					),
				},
				{
					id: "fitness-guidance",
					number: "8.2",
					title: "Fitness Guidance Disclaimer",
					level: 3,
					content: (
						<p>
							Any fitness recommendations, workout suggestions, or health
							insights provided by the Service are general in nature and may not
							be suitable for your individual circumstances. You assume all
							risks associated with following any fitness or nutrition guidance
							provided through the Service.
						</p>
					),
				},
				{
					id: "service-availability",
					number: "8.3",
					title: "Service Availability",
					level: 3,
					content: (
						<p>
							The Service is provided "as is" and "as available" without
							warranties of any kind. We do not guarantee that the Service will
							be uninterrupted, error-free, or completely secure. We reserve the
							right to modify, suspend, or discontinue any part of the Service
							at any time without notice.
						</p>
					),
				},
				{
					id: "data-disclaimer",
					number: "8.4",
					title: "Data Accuracy Disclaimer",
					level: 3,
					content: (
						<p>
							While we strive to provide accurate data and calculations, we
							cannot guarantee the accuracy, completeness, or reliability of any
							information displayed through the Service. Data from connected
							devices and third-party integrations may contain errors or
							inaccuracies.
						</p>
					),
				},
			],
		},
		{
			id: "limitation",
			number: "9",
			title: "Limitation of Liability",
			level: 2,
			content: (
				<>
					<p>
						TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, FITNESSTRACKER
						AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL
						NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
						OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
					</p>
					<ul>
						<li>Loss of profits, data, or goodwill</li>
						<li>Service interruption or computer damage</li>
						<li>Personal injury or property damage</li>
						<li>
							Unauthorized access to or alteration of your transmissions or data
						</li>
						<li>Statements or conduct of any third party on the Service</li>
					</ul>
					<p>
						IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU EXCEED THE AMOUNT YOU
						HAVE PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR ONE
						HUNDRED DOLLARS ($100), WHICHEVER IS GREATER.
					</p>
				</>
			),
		},
		{
			id: "indemnification",
			number: "10",
			title: "Indemnification",
			level: 2,
			content: (
				<p>
					You agree to indemnify, defend, and hold harmless FitnessTracker and
					its officers, directors, employees, agents, and affiliates from and
					against any claims, liabilities, damages, losses, costs, or expenses
					(including reasonable attorneys' fees) arising out of or in connection
					with: (a) your use of the Service; (b) your violation of these Terms;
					(c) your violation of any rights of another party; or (d) your User
					Content.
				</p>
			),
		},
		{
			id: "termination",
			number: "11",
			title: "Termination",
			level: 2,
			content: <></>,
			subsections: [
				{
					id: "termination-by-you",
					number: "11.1",
					title: "Termination by You",
					level: 3,
					content: (
						<p>
							You may terminate your account and stop using the Service at any
							time by accessing your account settings or contacting our support
							team. Upon termination, your right to use the Service will
							immediately cease.
						</p>
					),
				},
				{
					id: "termination-by-us",
					number: "11.2",
					title: "Termination by Us",
					level: 3,
					content: (
						<p>
							We reserve the right to suspend or terminate your account and
							access to the Service at any time, with or without cause and with
							or without notice, particularly if you violate these Terms or
							engage in activities that may harm the Service or other users.
						</p>
					),
				},
				{
					id: "effect-of-termination",
					number: "11.3",
					title: "Effect of Termination",
					level: 3,
					content: (
						<p>
							Upon termination, all licenses and rights granted to you under
							these Terms will immediately cease. Provisions of these Terms that
							by their nature should survive termination will continue in full
							force and effect, including ownership provisions, warranty
							disclaimers, and limitations of liability.
						</p>
					),
				},
			],
		},
		{
			id: "changes",
			number: "12",
			title: "Changes to Terms",
			level: 2,
			content: (
				<p>
					We reserve the right to modify these Terms at any time. When we make
					changes, we will update the "Last Updated" date at the top of this
					page and, for material changes, we may provide additional notice such
					as an email notification or in-app announcement. Your continued use of
					the Service after any changes indicates your acceptance of the
					modified Terms. If you do not agree to the modified Terms, you should
					discontinue use of the Service.
				</p>
			),
		},
		{
			id: "governing-law",
			number: "13",
			title: "Governing Law and Dispute Resolution",
			level: 2,
			content: <></>,
			subsections: [
				{
					id: "jurisdiction",
					number: "13.1",
					title: "Jurisdiction",
					level: 3,
					content: (
						<p>
							These Terms shall be governed by and construed in accordance with
							the laws of the State of California, United States, without regard
							to its conflict of law provisions. You agree to submit to the
							personal and exclusive jurisdiction of the courts located in San
							Francisco County, California.
						</p>
					),
				},
				{
					id: "informal-resolution",
					number: "13.2",
					title: "Informal Resolution",
					level: 3,
					content: (
						<p>
							Before initiating any legal proceedings, you agree to first
							contact us to attempt to resolve any disputes informally. We will
							attempt to resolve disputes through good-faith negotiation within
							sixty (60) days of receiving your written notice of a dispute.
						</p>
					),
				},
				{
					id: "class-action-waiver",
					number: "13.3",
					title: "Class Action Waiver",
					level: 3,
					content: (
						<p>
							You agree that any dispute resolution proceedings will be
							conducted only on an individual basis and not in a class,
							consolidated, or representative action. You expressly waive your
							right to participate in any class action lawsuit or class-wide
							arbitration.
						</p>
					),
				},
			],
		},
		{
			id: "general",
			number: "14",
			title: "General Provisions",
			level: 2,
			content: <></>,
			subsections: [
				{
					id: "entire-agreement",
					number: "14.1",
					title: "Entire Agreement",
					level: 3,
					content: (
						<p>
							These Terms, together with our Privacy Policy and any other legal
							notices or policies published by us on the Service, constitute the
							entire agreement between you and FitnessTracker regarding the use
							of the Service.
						</p>
					),
				},
				{
					id: "severability",
					number: "14.2",
					title: "Severability",
					level: 3,
					content: (
						<p>
							If any provision of these Terms is found to be unenforceable or
							invalid, that provision shall be limited or eliminated to the
							minimum extent necessary, and the remaining provisions shall
							remain in full force and effect.
						</p>
					),
				},
				{
					id: "waiver",
					number: "14.3",
					title: "Waiver",
					level: 3,
					content: (
						<p>
							Our failure to enforce any right or provision of these Terms shall
							not constitute a waiver of such right or provision. Any waiver
							must be in writing and signed by an authorized representative of
							FitnessTracker.
						</p>
					),
				},
				{
					id: "assignment",
					number: "14.4",
					title: "Assignment",
					level: 3,
					content: (
						<p>
							You may not assign or transfer these Terms or your rights under
							them without our prior written consent. We may assign our rights
							and obligations under these Terms without restriction.
						</p>
					),
				},
			],
		},
		{
			id: "contact",
			number: "15",
			title: "Contact Information",
			level: 2,
			content: (
				<>
					<p>
						If you have any questions, concerns, or feedback regarding these
						Terms of Service, please contact us:
					</p>
					<ul>
						<li>
							<strong>Email:</strong> legal@fitnesstracker.com
						</li>
						<li>
							<strong>Website:</strong> www.fitnesstracker.com/contact
						</li>
					</ul>
					<p>
						We will make every effort to respond to your inquiries within a
						reasonable timeframe.
					</p>
				</>
			),
		},
	],
	acknowledgment: (
		<>
			<p>
				<strong>By using FitnessTracker, you acknowledge that:</strong>
			</p>
			<ul>
				<li>You have read and understood these Terms of Service</li>
				<li>You agree to be bound by these Terms</li>
				<li>
					You understand that the Service is not a substitute for professional
					medical advice
				</li>
				<li>You are responsible for your own health and fitness decisions</li>
			</ul>
		</>
	),
};
