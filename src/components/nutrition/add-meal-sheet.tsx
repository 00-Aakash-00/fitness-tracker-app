"use client";

import { Loader2, Plus, Sparkles, UtensilsCrossed } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import { addMeal } from "@/app/dashboard/nutrition/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface AddMealSheetProps {
	selectedDate: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type Mode = "ai" | "manual";

type AiPreview = {
	name: string;
	calories: number;
	protein: number;
} | null;

export function AddMealSheet({
	selectedDate,
	open,
	onOpenChange,
}: AddMealSheetProps) {
	const [mode, setMode] = useState<Mode>("ai");
	const [isPending, startTransition] = useTransition();

	// AI mode state
	const [aiInput, setAiInput] = useState("");
	const [aiPreview, setAiPreview] = useState<AiPreview>(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [analyzeError, setAnalyzeError] = useState<string | null>(null);

	// Manual mode state
	const [manualName, setManualName] = useState("");
	const [manualCalories, setManualCalories] = useState("");
	const [manualProtein, setManualProtein] = useState("");

	// Shared state
	const [submitError, setSubmitError] = useState<string | null>(null);

	const resetForm = useCallback(() => {
		setAiInput("");
		setAiPreview(null);
		setIsAnalyzing(false);
		setAnalyzeError(null);
		setManualName("");
		setManualCalories("");
		setManualProtein("");
		setSubmitError(null);
		setMode("ai");
	}, []);

	const handleOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (!nextOpen) {
				resetForm();
			}
			onOpenChange(nextOpen);
		},
		[onOpenChange, resetForm]
	);

	const handleAnalyze = async () => {
		if (!aiInput.trim()) return;

		setIsAnalyzing(true);
		setAnalyzeError(null);
		setAiPreview(null);

		try {
			const res = await fetch("/api/nutrition/analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ input: aiInput.trim() }),
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || "Failed to analyze meal.");
			}

			const result = await res.json();
			setAiPreview({
				name: result.name,
				calories: result.calories,
				protein: result.protein,
			});
		} catch (err) {
			setAnalyzeError(
				err instanceof Error ? err.message : "Failed to analyze meal."
			);
		} finally {
			setIsAnalyzing(false);
		}
	};

	const handleLogAiMeal = () => {
		if (!aiPreview) return;

		setSubmitError(null);
		startTransition(async () => {
			const fd = new FormData();
			fd.set("name", aiPreview.name);
			fd.set("calories", String(aiPreview.calories));
			fd.set("protein", String(aiPreview.protein));
			fd.set("source", "ai");
			fd.set("rawInput", aiInput.trim());
			fd.set("mealDate", selectedDate);

			const result = await addMeal(fd);
			if (result.status === "error") {
				setSubmitError(result.message);
			} else {
				handleOpenChange(false);
			}
		});
	};

	const handleLogManualMeal = () => {
		if (!manualName.trim()) return;

		setSubmitError(null);
		startTransition(async () => {
			const fd = new FormData();
			fd.set("name", manualName.trim());
			fd.set("calories", manualCalories || "0");
			fd.set("protein", manualProtein || "0");
			fd.set("source", "manual");
			fd.set("mealDate", selectedDate);

			const result = await addMeal(fd);
			if (result.status === "error") {
				setSubmitError(result.message);
			} else {
				handleOpenChange(false);
			}
		});
	};

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetContent className="flex flex-col overflow-y-auto p-6">
				<SheetHeader>
					<SheetTitle>Add Meal</SheetTitle>
					<SheetDescription>
						Log a meal for{" "}
						{new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", {
							weekday: "long",
							month: "long",
							day: "numeric",
						})}
					</SheetDescription>
				</SheetHeader>

				{/* Mode toggle */}
				<div className="mt-4 flex rounded-lg border border-border bg-secondary-surface p-1">
					<button
						type="button"
						className={cn(
							"flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
							mode === "ai"
								? "bg-primary-surface text-primary-text shadow-sm"
								: "text-secondary-text hover:text-primary-text"
						)}
						onClick={() => setMode("ai")}
					>
						<Sparkles className="h-4 w-4" />
						AI Analyze
					</button>
					<button
						type="button"
						className={cn(
							"flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
							mode === "manual"
								? "bg-primary-surface text-primary-text shadow-sm"
								: "text-secondary-text hover:text-primary-text"
						)}
						onClick={() => setMode("manual")}
					>
						<UtensilsCrossed className="h-4 w-4" />
						Manual
					</button>
				</div>

				{/* AI mode */}
				{mode === "ai" && (
					<div className="mt-4 flex flex-1 flex-col gap-4">
						<div className="space-y-1.5">
							<label
								htmlFor="ai-input"
								className="text-sm font-medium text-primary-text"
							>
								Describe your meal
							</label>
							<p className="text-xs text-secondary-text">
								For example: 2 eggs, toast with butter, and a glass of orange
								juice
							</p>
							<textarea
								id="ai-input"
								className={cn(
									"flex min-h-[100px] w-full rounded-md border border-border bg-input-bg px-3 py-2 text-sm",
									"ring-offset-primary-surface placeholder:text-secondary-text",
									"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cool focus-visible:ring-offset-2",
									"disabled:cursor-not-allowed disabled:opacity-50",
									"resize-none"
								)}
								placeholder="Describe what you ate..."
								value={aiInput}
								onChange={(e) => setAiInput(e.target.value)}
								disabled={isAnalyzing}
							/>
						</div>

						<Button
							onClick={handleAnalyze}
							disabled={!aiInput.trim() || isAnalyzing}
							variant="secondary"
						>
							{isAnalyzing ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Analyzing...
								</>
							) : (
								<>
									<Sparkles className="h-4 w-4" />
									Analyze
								</>
							)}
						</Button>

						{analyzeError && (
							<p className="text-sm text-destructive-text">{analyzeError}</p>
						)}

						{aiPreview && (
							<div className="space-y-3 rounded-lg border border-border bg-secondary-surface/50 p-4">
								<p className="text-sm font-medium text-primary-text">
									AI Estimate
								</p>
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span className="text-secondary-text">Name</span>
										<span className="font-medium text-primary-text">
											{aiPreview.name}
										</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-secondary-text">Calories</span>
										<span className="font-medium text-primary-text tabular-nums">
											{aiPreview.calories.toLocaleString()} cal
										</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-secondary-text">Protein</span>
										<span className="font-medium text-primary-text tabular-nums">
											{aiPreview.protein}g
										</span>
									</div>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Manual mode */}
				{mode === "manual" && (
					<div className="mt-4 flex flex-1 flex-col gap-4">
						<div className="space-y-1.5">
							<label
								htmlFor="manual-name"
								className="text-sm font-medium text-primary-text"
							>
								Meal name
							</label>
							<Input
								id="manual-name"
								placeholder="e.g. Chicken salad"
								value={manualName}
								onChange={(e) => setManualName(e.target.value)}
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<label
									htmlFor="manual-calories"
									className="text-sm font-medium text-primary-text"
								>
									Calories
								</label>
								<Input
									id="manual-calories"
									type="number"
									inputMode="numeric"
									min={0}
									placeholder="0"
									value={manualCalories}
									onChange={(e) => setManualCalories(e.target.value)}
								/>
							</div>
							<div className="space-y-1.5">
								<label
									htmlFor="manual-protein"
									className="text-sm font-medium text-primary-text"
								>
									Protein (g)
								</label>
								<Input
									id="manual-protein"
									type="number"
									inputMode="numeric"
									min={0}
									placeholder="0"
									value={manualProtein}
									onChange={(e) => setManualProtein(e.target.value)}
								/>
							</div>
						</div>
					</div>
				)}

				{submitError && <p className="text-sm text-destructive-text">{submitError}</p>}

				<SheetFooter className="mt-4">
					{mode === "ai" ? (
						<Button
							onClick={handleLogAiMeal}
							disabled={!aiPreview || isPending}
							className="w-full"
						>
							{isPending ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Logging...
								</>
							) : (
								<>
									<Plus className="h-4 w-4" />
									Log Meal
								</>
							)}
						</Button>
					) : (
						<Button
							onClick={handleLogManualMeal}
							disabled={!manualName.trim() || isPending}
							className="w-full"
						>
							{isPending ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Logging...
								</>
							) : (
								<>
									<Plus className="h-4 w-4" />
									Log Meal
								</>
							)}
						</Button>
					)}
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
