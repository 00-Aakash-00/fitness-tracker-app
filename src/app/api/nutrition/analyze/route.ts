import { groq } from "@ai-sdk/groq";
import { auth } from "@clerk/nextjs/server";
import { generateText, Output } from "ai";
import { z } from "zod";

const mealSchema = z.object({
	name: z.string().describe("Short descriptive name for the meal"),
	calories: z.number().int().min(0).describe("Estimated total calories"),
	protein: z.number().int().min(0).describe("Estimated protein in grams"),
});

const MEAL_ANALYSIS_MODEL = "openai/gpt-oss-20b";

export async function POST(request: Request) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	let body: { input?: string };
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Invalid request body" }, { status: 400 });
	}

	const { input } = body;
	if (!input || typeof input !== "string" || input.trim().length === 0) {
		return Response.json({ error: "Input required" }, { status: 400 });
	}

	if (!process.env.GROQ_API_KEY?.trim()) {
		return Response.json(
			{ error: "AI meal analysis is not configured." },
			{ status: 500 }
		);
	}

	try {
		const { output } = await generateText({
			model: groq(MEAL_ANALYSIS_MODEL),
			temperature: 0,
			output: Output.object({
				schema: mealSchema,
				name: "meal_analysis",
				description: "Estimated meal nutrition summary",
			}),
			system:
				"You estimate meal nutrition conservatively and return only the requested structured data.",
			prompt: `Analyze this meal and estimate its nutritional content. Be reasonable with estimates. If the description mentions quantities, use them for estimation. If no quantity is specified, assume a typical single serving.\n\nMeal: "${input.trim()}"`,
		});

		return Response.json(output);
	} catch (error) {
		console.error("AI meal analysis error:", error);
		return Response.json(
			{ error: "Failed to analyze meal. Please try again." },
			{ status: 500 }
		);
	}
}
