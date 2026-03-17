"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { deleteSet, upsertSet } from "@/app/dashboard/workouts/actions";
import type { ExerciseSet } from "@/lib/workouts/workouts.types";
import { getLastSetDefaults } from "@/lib/workouts/workouts.utils";

type UseWorkoutFormOptions = {
	workoutExerciseId: string;
	initialSets: ExerciseSet[];
};

export function useWorkoutForm({
	workoutExerciseId,
	initialSets,
}: UseWorkoutFormOptions) {
	const [sets, setSets] = useState<ExerciseSet[]>(initialSets);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const setsRef = useRef(initialSets);
	const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
		{}
	);
	const rollbackSets = useRef<Record<string, ExerciseSet>>({});

	const commitSets = useCallback((nextSets: ExerciseSet[]) => {
		setsRef.current = nextSets;
		setSets(nextSets);
	}, []);

	const buildSetFormData = useCallback(
		(setId: string, set: ExerciseSet) => {
			const fd = new FormData();
			fd.append("setId", setId.startsWith("temp-") ? "" : setId);
			fd.append("workoutExerciseId", workoutExerciseId);
			fd.append("setNumber", String(set.setNumber));
			fd.append("setType", set.setType);
			if (set.weight !== null) fd.append("weight", String(set.weight));
			if (set.reps !== null) fd.append("reps", String(set.reps));
			if (set.rpe !== null) fd.append("rpe", String(set.rpe));
			fd.append("isCompleted", String(set.isCompleted));
			return fd;
		},
		[workoutExerciseId]
	);

	const persistExistingSet = useCallback(
		async (setId: string, set: ExerciseSet) => {
			const result = await upsertSet(buildSetFormData(setId, set));
			if (result.status === "error") {
				setError(result.message);
			}
			return result;
		},
		[buildSetFormData]
	);

	useEffect(
		() => () => {
			for (const timer of Object.values(debounceTimers.current)) {
				clearTimeout(timer);
			}
		},
		[]
	);

	const addSet = useCallback(() => {
		setError(null);

		const currentSets = setsRef.current;
		const defaults = getLastSetDefaults(currentSets);
		const newSetNumber =
			currentSets.length > 0
				? currentSets[currentSets.length - 1].setNumber + 1
				: 1;

		const tempId = `temp-${Date.now()}`;
		const newSet: ExerciseSet = {
			id: tempId,
			workoutExerciseId,
			setNumber: newSetNumber,
			setType: defaults.setType,
			weight: defaults.weight,
			reps: defaults.reps,
			rpe: null,
			isCompleted: false,
			notes: null,
		};

		commitSets([...currentSets, newSet]);

		startTransition(async () => {
			const result = await upsertSet(buildSetFormData(tempId, newSet));
			if (result.status !== "success" || !result.setId) {
				commitSets(setsRef.current.filter((set) => set.id !== tempId));
				setError(result.message);
				return;
			}

			const latestTemp = setsRef.current.find((set) => set.id === tempId);
			if (!latestTemp) {
				const cleanupFd = new FormData();
				cleanupFd.append("setId", result.setId);
				await deleteSet(cleanupFd);
				return;
			}

			const persistedSet = { ...latestTemp, id: result.setId };
			commitSets(
				setsRef.current.map((set) => (set.id === tempId ? persistedSet : set))
			);

			const syncResult = await persistExistingSet(result.setId, persistedSet);
			if (syncResult.status === "error") {
				return;
			}
		});
	}, [buildSetFormData, commitSets, persistExistingSet, workoutExerciseId]);

	const updateSet = useCallback(
		(setId: string, data: Partial<ExerciseSet>) => {
			setError(null);

			const current = setsRef.current.find((set) => set.id === setId);
			if (!current) {
				return;
			}

			const merged = { ...current, ...data };
			commitSets(
				setsRef.current.map((set) => (set.id === setId ? merged : set))
			);

			if (debounceTimers.current[setId]) {
				clearTimeout(debounceTimers.current[setId]);
			}

			if (setId.startsWith("temp-")) {
				return;
			}

			if (!rollbackSets.current[setId]) {
				rollbackSets.current[setId] = current;
			}

			debounceTimers.current[setId] = setTimeout(() => {
				startTransition(async () => {
					const latest = setsRef.current.find((set) => set.id === setId);
					if (!latest) {
						delete rollbackSets.current[setId];
						return;
					}

					const result = await persistExistingSet(setId, latest);
					if (result.status === "success") {
						delete rollbackSets.current[setId];
						return;
					}

					const rollbackSet = rollbackSets.current[setId];
					delete rollbackSets.current[setId];
					if (!rollbackSet) {
						return;
					}

					commitSets(
						setsRef.current.map((set) => (set.id === setId ? rollbackSet : set))
					);
				});
			}, 300);
		},
		[commitSets, persistExistingSet]
	);

	const removeSet = useCallback(
		(setId: string) => {
			setError(null);

			const existingSet = setsRef.current.find((set) => set.id === setId);
			if (!existingSet) {
				return;
			}

			if (debounceTimers.current[setId]) {
				clearTimeout(debounceTimers.current[setId]);
				delete debounceTimers.current[setId];
			}
			delete rollbackSets.current[setId];

			commitSets(setsRef.current.filter((set) => set.id !== setId));

			if (setId.startsWith("temp-")) {
				return;
			}

			const fd = new FormData();
			fd.append("setId", setId);
			startTransition(async () => {
				const result = await deleteSet(fd);
				if (result.status === "success") {
					return;
				}

				const restoredSets = [...setsRef.current, existingSet].sort(
					(a, b) => a.setNumber - b.setNumber
				);
				commitSets(restoredSets);
				setError(result.message);
			});
		},
		[commitSets]
	);

	return {
		sets,
		addSet,
		updateSet,
		removeSet,
		error,
		clearError: () => setError(null),
		isPending,
	};
}
