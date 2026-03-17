export type WorkoutStatus = "planned" | "in_progress" | "completed" | "skipped";

export type SetType = "warmup" | "working" | "dropset" | "failure";

export type Exercise = {
	id: string;
	userId: string | null;
	name: string;
	muscleGroup: string | null;
	equipment: string | null;
};

export type WorkoutTemplate = {
	id: string;
	userId: string;
	name: string;
	description: string | null;
	color: string | null;
	sortOrder: number;
};

export type TemplateExercise = {
	id: string;
	templateId: string;
	exerciseId: string;
	exercise: Exercise;
	sortOrder: number;
	targetSets: number | null;
	targetReps: string | null;
	targetWeight: number | null;
	notes: string | null;
	restSeconds: number | null;
};

export type TemplateWithExercises = WorkoutTemplate & {
	exercises: TemplateExercise[];
};

export type ExerciseSet = {
	id: string;
	workoutExerciseId: string;
	setNumber: number;
	setType: SetType;
	weight: number | null;
	reps: number | null;
	rpe: number | null;
	isCompleted: boolean;
	notes: string | null;
};

export type WorkoutExercise = {
	id: string;
	workoutId: string;
	exerciseId: string;
	exercise: Exercise;
	sortOrder: number;
	isCompleted: boolean;
	notes: string | null;
	sets: ExerciseSet[];
};

export type Workout = {
	id: string;
	userId: string;
	templateId: string | null;
	name: string;
	date: string;
	status: WorkoutStatus;
	startedAt: string | null;
	completedAt: string | null;
	notes: string | null;
	durationMinutes: number | null;
	color: string | null;
};

export type WorkoutWithExercises = Workout & {
	exercises: WorkoutExercise[];
};

export type WorkoutSummary = {
	totalSets: number;
	totalReps: number;
	totalVolume: number;
	exerciseCount: number;
};
