import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";

export default async function SignUpPage() {
	const { userId } = await auth();

	if (userId) {
		redirect("/dashboard");
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-secondary-surface p-8">
			<SignUp
				appearance={clerkAuthAppearance}
				signInUrl="/sign-in"
				fallbackRedirectUrl="/dashboard"
			/>
		</main>
	);
}
