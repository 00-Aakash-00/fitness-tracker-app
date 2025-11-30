import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
	return (
		<main className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-secondary-surface p-8">
			<SignUp
				appearance={{
					elements: {
						rootBox: "mx-auto",
						card: "shadow-lg",
						headerTitle: "font-primary",
						headerSubtitle: "font-secondary text-secondary-text",
						formButtonPrimary:
							"bg-brand-cool hover:bg-brand-deep transition-colors",
						footerActionLink: "text-brand-cool hover:text-brand-deep",
					},
				}}
			/>
		</main>
	);
}
