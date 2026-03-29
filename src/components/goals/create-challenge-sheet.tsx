"use client";

import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { createChallenge } from "@/app/dashboard/goals/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import type { GoalTemplate } from "@/data/goal-templates";
import { TemplatePicker } from "./template-picker";

function getTodayISO(): string {
	const now = new Date();
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, "0");
	const d = String(now.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

export function CreateChallengeSheet() {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [step, setStep] = useState<"template" | "customize">("template");
	const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(
		null
	);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [duration, setDuration] = useState(30);
	const [startDate, setStartDate] = useState(getTodayISO());
	const [tasks, setTasks] = useState<string[]>([]);
	const [newTask, setNewTask] = useState("");
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const resetForm = useCallback(() => {
		setStep("template");
		setSelectedTemplate(null);
		setName("");
		setDescription("");
		setDuration(30);
		setStartDate(getTodayISO());
		setTasks([]);
		setNewTask("");
		setError(null);
	}, []);

	const handleTemplateSelect = useCallback((template: GoalTemplate) => {
		setError(null);
		setSelectedTemplate(template);
		setName(template.name);
		setDescription(template.description);
		setDuration(template.duration);
		setTasks([...template.tasks]);
		setStep("customize");
	}, []);

	const handleAddTask = useCallback(() => {
		const trimmed = newTask.trim();
		if (trimmed.length > 0) {
			setTasks((prev) => [...prev, trimmed]);
			setNewTask("");
		}
	}, [newTask]);

	const handleRemoveTask = useCallback((index: number) => {
		setTasks((prev) => prev.filter((_, i) => i !== index));
	}, []);

	const handleSubmit = useCallback(() => {
		const validTasks = tasks.filter((t) => t.trim().length > 0);
		if (!name.trim() || validTasks.length === 0) return;

		setError(null);
		const formData = new FormData();
		formData.set("name", name.trim());
		formData.set("description", description.trim());
		formData.set("duration", String(duration));
		formData.set("startDate", startDate);
		formData.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
		formData.set("templateId", selectedTemplate?.id ?? "");
		formData.set("tasks", JSON.stringify(validTasks));

		startTransition(async () => {
			const result = await createChallenge(formData);
			if (result.status === "success") {
				setOpen(false);
				resetForm();
				router.refresh();
			} else {
				setError(result.message);
			}
		});
	}, [
		name,
		description,
		duration,
		startDate,
		tasks,
		selectedTemplate,
		resetForm,
		router,
	]);

	const handleOpenChange = useCallback(
		(nextOpen: boolean) => {
			setOpen(nextOpen);
			if (!nextOpen) {
				resetForm();
			}
		},
		[resetForm]
	);

	const canSubmit =
		name.trim().length > 0 &&
		tasks.filter((t) => t.trim().length > 0).length > 0 &&
		duration >= 1 &&
		duration <= 365 &&
		!!startDate;

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetTrigger asChild>
				<Button size="sm">
					<Plus className="h-4 w-4" />
					New Challenge
				</Button>
			</SheetTrigger>
			<SheetContent className="flex flex-col overflow-y-auto">
				<SheetHeader>
					{step === "customize" && (
						<button
							type="button"
							onClick={() => setStep("template")}
							className="mb-1 flex w-fit items-center gap-1 font-secondary text-xs text-secondary-text hover:text-primary-text"
						>
							<ArrowLeft className="h-3 w-3" />
							Templates
						</button>
					)}
					<SheetTitle>
						{step === "template" ? "Choose a Template" : "Customize Challenge"}
					</SheetTitle>
					<SheetDescription>
						{step === "template"
							? "Select a template to get started, or create a custom challenge."
							: "Adjust the details and tasks for your challenge."}
					</SheetDescription>
				</SheetHeader>

				<div className="flex-1 space-y-4 py-4">
					{step === "template" && (
						<TemplatePicker onSelect={handleTemplateSelect} />
					)}

					{step === "customize" && (
						<>
							{/* Name */}
							<div className="space-y-1.5">
								<label
									htmlFor="challenge-name"
									className="font-secondary text-sm font-medium text-primary-text"
								>
									Name
								</label>
								<Input
									id="challenge-name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Challenge name"
									maxLength={100}
								/>
							</div>

							{/* Description */}
							<div className="space-y-1.5">
								<label
									htmlFor="challenge-desc"
									className="font-secondary text-sm font-medium text-primary-text"
								>
									Description
								</label>
								<Input
									id="challenge-desc"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Optional description"
									maxLength={300}
								/>
							</div>

							{/* Duration + Start Date */}
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<label
										htmlFor="challenge-duration"
										className="font-secondary text-sm font-medium text-primary-text"
									>
										Duration (days)
									</label>
									<Input
										id="challenge-duration"
										type="number"
										min={1}
										max={365}
										value={duration}
										onChange={(e) =>
											setDuration(Number.parseInt(e.target.value, 10) || 30)
										}
									/>
								</div>
								<div className="space-y-1.5">
									<label
										htmlFor="challenge-start"
										className="font-secondary text-sm font-medium text-primary-text"
									>
										Start Date
									</label>
									<Input
										id="challenge-start"
										type="date"
										value={startDate}
										onChange={(e) => setStartDate(e.target.value)}
									/>
								</div>
							</div>

							{/* Tasks */}
							<div className="space-y-2">
								<span className="font-secondary text-sm font-medium text-primary-text">
									Daily Tasks
								</span>
								<div className="space-y-1.5">
									{tasks.map((task, index) => (
										<div
											key={`task-${
												// biome-ignore lint/suspicious/noArrayIndexKey: Tasks are reorderable, index is stable during editing
												index
											}`}
											className="flex items-center gap-2"
										>
											<span className="flex-1 rounded-md border border-border bg-input-bg px-3 py-2 font-secondary text-sm text-primary-text">
												{task}
											</span>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => handleRemoveTask(index)}
												aria-label={`Remove task: ${task}`}
											>
												<Trash2 className="h-4 w-4 text-secondary-text" />
											</Button>
										</div>
									))}
								</div>
								<div className="flex gap-2">
									<Input
										value={newTask}
										onChange={(e) => setNewTask(e.target.value)}
										placeholder="Add a task..."
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												handleAddTask();
											}
										}}
										maxLength={200}
									/>
									<Button
										type="button"
										variant="outline"
										size="icon"
										onClick={handleAddTask}
										disabled={newTask.trim().length === 0}
										aria-label="Add task"
									>
										<Plus className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</>
					)}
				</div>

				{step === "customize" && (
					<SheetFooter>
						{error ? (
							<p className="w-full text-sm text-destructive-text">{error}</p>
						) : null}
						<Button
							onClick={handleSubmit}
							disabled={!canSubmit || isPending}
							className="w-full"
						>
							{isPending ? "Creating..." : "Create Challenge"}
						</Button>
					</SheetFooter>
				)}
			</SheetContent>
		</Sheet>
	);
}
