import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthBranding } from "@/components/auth/auth-branding";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";

export default async function SignUpPage() {
	const { userId } = await auth();

	if (userId) {
		redirect("/dashboard");
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-secondary-surface p-8">
			<div className="flex w-full max-w-[420px] flex-col items-center gap-6">
				<AuthBranding />
				<SignUp
					appearance={clerkAuthAppearance}
					path="/sign-up"
					routing="path"
					signInUrl="/sign-in"
					fallbackRedirectUrl="/dashboard"
				/>
			</div>
		</main>
	);
}
