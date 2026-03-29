import { ClerkProvider } from "@clerk/nextjs";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import {
	Fraunces,
	Inter,
	JetBrains_Mono,
	Playfair_Display,
	Space_Grotesk, Geist } from "next/font/google";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const spaceGrotesk = Space_Grotesk({
	variable: "--font-space-grotesk",
	subsets: ["latin"],
	display: "swap",
});

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	display: "swap",
});

const fraunces = Fraunces({
	variable: "--font-fraunces",
	subsets: ["latin"],
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
	display: "swap",
});

const playfairDisplay = Playfair_Display({
	variable: "--font-playfair-display",
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "Fitness Tracker",
	description: "Track your fitness journey",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<ClerkProvider
			signInUrl="/sign-in"
			signUpUrl="/sign-up"
			signInFallbackRedirectUrl="/dashboard"
			signUpFallbackRedirectUrl="/dashboard"
			afterSignOutUrl="/sign-in"
		>
			<html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
				<body
					className={`${spaceGrotesk.variable} ${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable} ${GeistSans.variable} antialiased`}
				>
					<ThemeProvider>
						<Header />
						{children}
					</ThemeProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
