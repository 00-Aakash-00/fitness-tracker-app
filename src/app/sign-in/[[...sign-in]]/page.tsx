import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";

export default async function SignInPage() {
	const { userId } = await auth();

	if (userId) {
		redirect("/dashboard");
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-secondary-surface p-8">
			<SignIn
				appearance={clerkAuthAppearance}
				signUpUrl="/sign-up"
				fallbackRedirectUrl="/dashboard"
			/>
		</main>
	);
}
