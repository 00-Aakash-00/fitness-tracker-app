"use server";

import { revalidatePath } from "next/cache";
import type { Meal, NutritionGoals } from "@/lib/nutrition/utils";
import { refreshUserAppState } from "@/lib/progress/progress.server";
import {
	getAuthenticatedSupabaseContext,
	getUserSupabaseClient,
} from "@/lib/supabase-user.server";

const DEFAULT_GOALS: NutritionGoals = {
	dailyCalories: 2000,
	dailyProtein: 150,
};

async function refreshNutritionProgress(supabaseUserId: string) {
	await refreshUserAppState({
		supabaseUserId,
		days: 90,
	});
	revalidatePath("/dashboard", "layout");
	revalidatePath("/dashboard");
	revalidatePath("/dashboard/progress");
	revalidatePath("/dashboard/nutrition");
	revalidatePath("/dashboard/settings");
}

export async function getNutritionGoals(
	supabaseUserId: string
): Promise<NutritionGoals> {
	const supabase = await getUserSupabaseClient();
	if (!supabase) {
		throw new Error("Supabase user client unavailable.");
	}

	const { data, error } = await supabase
		.from("nutrition_goals")
		.select("daily_calories, daily_protein")
		.eq("user_id", supabaseUserId)
		.maybeSingle();

	if (error) {
		console.error("Error fetching nutrition goals:", error);
		return DEFAULT_GOALS;
	}

	if (!data) return DEFAULT_GOALS;

	return {
		dailyCalories: data.daily_calories ?? DEFAULT_GOALS.dailyCalories,
		dailyProtein: data.daily_protein ?? DEFAULT_GOALS.dailyProtein,
	};
}

export async function updateNutritionGoals(
	formData: FormData
): Promise<{ status: "success" | "error"; message: string }> {
	const context = await getAuthenticatedSupabaseContext();
	if (!context) {
		return { status: "error", message: "Not authenticated." };
	}

	const rawCalories = formData.get("dailyCalories");
	const rawProtein = formData.get("dailyProtein");

	const calories = Number.parseInt(
		typeof rawCalories === "string" ? rawCalories : "",
		10
	);
	const protein = Number.parseInt(
		typeof rawProtein === "string" ? rawProtein : "",
		10
	);

	if (!Number.isFinite(calories) || calories < 500 || calories > 10000) {
		return {
			status: "error",
			message: "Daily calories must be between 500 and 10,000.",
		};
	}

	if (!Number.isFinite(protein) || protein < 10 || protein > 500) {
		return {
			status: "error",
			message: "Daily protein must be between 10 and 500 grams.",
		};
	}

	const { error } = await context.supabase.from("nutrition_goals").upsert(
		{
			user_id: context.supabaseUserId,
			daily_calories: calories,
			daily_protein: protein,
			updated_at: new Date().toISOString(),
		},
		{ onConflict: "user_id" }
	);

	if (error) {
		console.error("Error updating nutrition goals:", error);
		return { status: "error", message: "Failed to save goals." };
	}

	await refreshNutritionProgress(context.supabaseUserId);
	return { status: "success", message: "Nutrition goals saved." };
}

export async function getMealsForMonth(
	supabaseUserId: string,
	year: number,
	month: number
): Promise<Record<string, Meal[]>> {
	const supabase = await getUserSupabaseClient();
	if (!supabase) {
		throw new Error("Supabase user client unavailable.");
	}

	// Build date range for the month
	const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
	const lastDay = new Date(year, month, 0).getDate();
	const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

	const { data, error } = await supabase
		.from("meals")
		.select(
			"id, meal_date, name, calories, protein, source, raw_input, created_at"
		)
		.eq("user_id", supabaseUserId)
		.gte("meal_date", startDate)
		.lte("meal_date", endDate)
		.order("created_at", { ascending: true });

	if (error) {
		console.error("Error fetching meals:", error);
		return {};
	}

	const mealsMap: Record<string, Meal[]> = {};

	for (const row of data ?? []) {
		const dateKey = row.meal_date;
		const meal: Meal = {
			id: row.id,
			name: row.name,
			calories: row.calories,
			protein: row.protein,
			source: row.source,
			rawInput: row.raw_input,
			createdAt: row.created_at,
		};

		if (!mealsMap[dateKey]) {
			mealsMap[dateKey] = [];
		}
		mealsMap[dateKey].push(meal);
	}

	return mealsMap;
}

export async function addMeal(
	formData: FormData
): Promise<{ status: "success" | "error"; message: string }> {
	const context = await getAuthenticatedSupabaseContext();
	if (!context) {
		return { status: "error", message: "Not authenticated." };
	}

	const name = formData.get("name");
	const rawCalories = formData.get("calories");
	const rawProtein = formData.get("protein");
	const source = formData.get("source");
	const rawInput = formData.get("rawInput");
	const mealDate = formData.get("mealDate");

	if (!name || typeof name !== "string" || name.trim().length === 0) {
		return { status: "error", message: "Meal name is required." };
	}

	const calories = Number.parseInt(
		typeof rawCalories === "string" ? rawCalories : "",
		10
	);
	const protein = Number.parseInt(
		typeof rawProtein === "string" ? rawProtein : "",
		10
	);

	if (!Number.isFinite(calories) || calories < 0) {
		return { status: "error", message: "Calories must be a valid number." };
	}

	if (!Number.isFinite(protein) || protein < 0) {
		return { status: "error", message: "Protein must be a valid number." };
	}

	if (
		!mealDate ||
		typeof mealDate !== "string" ||
		!/^\d{4}-\d{2}-\d{2}$/.test(mealDate)
	) {
		return { status: "error", message: "Invalid date." };
	}

	const mealSource = source === "ai" || source === "manual" ? source : "manual";

	const { error } = await context.supabase.from("meals").insert({
		user_id: context.supabaseUserId,
		meal_date: mealDate,
		name: name.trim(),
		calories,
		protein,
		source: mealSource,
		raw_input:
			typeof rawInput === "string" && rawInput.trim().length > 0
				? rawInput.trim()
				: null,
	});

	if (error) {
		console.error("Error adding meal:", error);
		return { status: "error", message: "Failed to add meal." };
	}

	await refreshNutritionProgress(context.supabaseUserId);
	return { status: "success", message: "Meal added." };
}

export async function updateMeal(
	formData: FormData
): Promise<{ status: "success" | "error"; message: string }> {
	const context = await getAuthenticatedSupabaseContext();
	if (!context) {
		return { status: "error", message: "Not authenticated." };
	}

	const mealId = formData.get("mealId");
	const name = formData.get("name");
	const rawCalories = formData.get("calories");
	const rawProtein = formData.get("protein");

	if (!mealId || typeof mealId !== "string") {
		return { status: "error", message: "Meal ID is required." };
	}

	if (!name || typeof name !== "string" || name.trim().length === 0) {
		return { status: "error", message: "Meal name is required." };
	}

	const calories = Number.parseInt(
		typeof rawCalories === "string" ? rawCalories : "",
		10
	);
	const protein = Number.parseInt(
		typeof rawProtein === "string" ? rawProtein : "",
		10
	);

	if (!Number.isFinite(calories) || calories < 0) {
		return { status: "error", message: "Calories must be a valid number." };
	}

	if (!Number.isFinite(protein) || protein < 0) {
		return { status: "error", message: "Protein must be a valid number." };
	}

	// Verify the meal belongs to this user
	const { data: existing } = await context.supabase
		.from("meals")
		.select("id")
		.eq("id", mealId)
		.eq("user_id", context.supabaseUserId)
		.maybeSingle();

	if (!existing) {
		return { status: "error", message: "Meal not found." };
	}

	const { error } = await context.supabase
		.from("meals")
		.update({
			name: name.trim(),
			calories,
			protein,
			updated_at: new Date().toISOString(),
		})
		.eq("id", mealId)
		.eq("user_id", context.supabaseUserId);

	if (error) {
		console.error("Error updating meal:", error);
		return { status: "error", message: "Failed to update meal." };
	}

	await refreshNutritionProgress(context.supabaseUserId);
	return { status: "success", message: "Meal updated." };
}

export async function deleteMeal(
	formData: FormData
): Promise<{ status: "success" | "error"; message: string }> {
	const context = await getAuthenticatedSupabaseContext();
	if (!context) {
		return { status: "error", message: "Not authenticated." };
	}

	const mealId = formData.get("mealId");
	if (!mealId || typeof mealId !== "string") {
		return { status: "error", message: "Meal ID is required." };
	}

	const { error } = await context.supabase
		.from("meals")
		.delete()
		.eq("id", mealId)
		.eq("user_id", context.supabaseUserId);

	if (error) {
		console.error("Error deleting meal:", error);
		return { status: "error", message: "Failed to delete meal." };
	}

	await refreshNutritionProgress(context.supabaseUserId);
	return { status: "success", message: "Meal deleted." };
}
