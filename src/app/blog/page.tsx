import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Blog | FitnessTracker",
	robots: {
		index: false,
		follow: false,
	},
};

export default function BlogPage() {
	redirect("https://www.iam360.ai/blog");
}
