import { groq } from "@ai-sdk/groq";
import { auth } from "@clerk/nextjs/server";
import { generateObject } from "ai";
import { z } from "zod/v4";

const mealSchema = z.object({
	name: z.string().describe("Short descriptive name for the meal"),
	calories: z.number().int().min(0).describe("Estimated total calories"),
	protein: z.number().int().min(0).describe("Estimated protein in grams"),
});

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

	try {
		const { object } = await generateObject({
			model: groq("llama-3.3-70b-versatile"),
			schema: mealSchema,
			prompt: `Analyze this meal and estimate its nutritional content. Be reasonable with estimates. If the description mentions quantities, use them for estimation. If no quantity is specified, assume a typical single serving. Meal: "${input.trim()}"`,
		});

		return Response.json(object);
	} catch (error) {
		console.error("AI meal analysis error:", error);
		return Response.json(
			{ error: "Failed to analyze meal. Please try again." },
			{ status: 500 }
		);
	}
}
