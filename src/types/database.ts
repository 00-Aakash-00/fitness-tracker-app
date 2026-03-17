export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export interface Database {
	public: {
		Tables: {
			users: {
				Row: {
					id: string;
					clerk_id: string;
					email: string | null;
					first_name: string | null;
					last_name: string | null;
					created_at: string | null;
					updated_at: string | null;
				};
				Insert: {
					id?: string;
					clerk_id: string;
					email?: string | null;
					first_name?: string | null;
					last_name?: string | null;
					created_at?: string | null;
					updated_at?: string | null;
				};
				Update: {
					id?: string;
					clerk_id?: string;
					email?: string | null;
					first_name?: string | null;
					last_name?: string | null;
					created_at?: string | null;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			nutrition_goals: {
				Row: {
					id: string;
					user_id: string;
					daily_calories: number;
					daily_protein: number;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					daily_calories?: number;
					daily_protein?: number;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					daily_calories?: number;
					daily_protein?: number;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "nutrition_goals_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			meals: {
				Row: {
					id: string;
					user_id: string;
					meal_date: string;
					name: string;
					calories: number;
					protein: number;
					source: "ai" | "manual";
					raw_input: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					meal_date: string;
					name: string;
					calories: number;
					protein: number;
					source?: "ai" | "manual";
					raw_input?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					meal_date?: string;
					name?: string;
					calories?: number;
					protein?: number;
					source?: "ai" | "manual";
					raw_input?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "meals_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			challenges: {
				Row: {
					id: string;
					user_id: string;
					name: string;
					description: string | null;
					duration: number;
					start_date: string;
					timezone: string;
					status: "active" | "paused" | "completed" | "abandoned";
					template_id: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					name: string;
					description?: string | null;
					duration: number;
					start_date: string;
					timezone?: string;
					status?: "active" | "paused" | "completed" | "abandoned";
					template_id?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					name?: string;
					description?: string | null;
					duration?: number;
					start_date?: string;
					timezone?: string;
					status?: "active" | "paused" | "completed" | "abandoned";
					template_id?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "challenges_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			challenge_tasks: {
				Row: {
					id: string;
					challenge_id: string;
					label: string;
					sort_order: number;
					created_at: string;
				};
				Insert: {
					id?: string;
					challenge_id: string;
					label: string;
					sort_order?: number;
					created_at?: string;
				};
				Update: {
					id?: string;
					challenge_id?: string;
					label?: string;
					sort_order?: number;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "challenge_tasks_challenge_id_fkey";
						columns: ["challenge_id"];
						isOneToOne: false;
						referencedRelation: "challenges";
						referencedColumns: ["id"];
					},
				];
			};
			daily_completions: {
				Row: {
					id: string;
					challenge_id: string;
					task_id: string;
					completed_date: string;
					completed_at: string;
				};
				Insert: {
					id?: string;
					challenge_id: string;
					task_id: string;
					completed_date: string;
					completed_at?: string;
				};
				Update: {
					id?: string;
					challenge_id?: string;
					task_id?: string;
					completed_date?: string;
					completed_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "daily_completions_challenge_id_fkey";
						columns: ["challenge_id"];
						isOneToOne: false;
						referencedRelation: "challenges";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "daily_completions_task_id_fkey";
						columns: ["task_id"];
						isOneToOne: false;
						referencedRelation: "challenge_tasks";
						referencedColumns: ["id"];
					},
				];
			};
			exercises: {
				Row: {
					id: string;
					user_id: string | null;
					name: string;
					muscle_group: string | null;
					equipment: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					user_id?: string | null;
					name: string;
					muscle_group?: string | null;
					equipment?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string | null;
					name?: string;
					muscle_group?: string | null;
					equipment?: string | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "exercises_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			workout_templates: {
				Row: {
					id: string;
					user_id: string;
					name: string;
					description: string | null;
					color: string | null;
					sort_order: number;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					name: string;
					description?: string | null;
					color?: string | null;
					sort_order?: number;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					name?: string;
					description?: string | null;
					color?: string | null;
					sort_order?: number;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "workout_templates_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			template_exercises: {
				Row: {
					id: string;
					template_id: string;
					exercise_id: string;
					sort_order: number;
					target_sets: number | null;
					target_reps: string | null;
					target_weight: number | null;
					notes: string | null;
					rest_seconds: number | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					template_id: string;
					exercise_id: string;
					sort_order?: number;
					target_sets?: number | null;
					target_reps?: string | null;
					target_weight?: number | null;
					notes?: string | null;
					rest_seconds?: number | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					template_id?: string;
					exercise_id?: string;
					sort_order?: number;
					target_sets?: number | null;
					target_reps?: string | null;
					target_weight?: number | null;
					notes?: string | null;
					rest_seconds?: number | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "template_exercises_template_id_fkey";
						columns: ["template_id"];
						isOneToOne: false;
						referencedRelation: "workout_templates";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "template_exercises_exercise_id_fkey";
						columns: ["exercise_id"];
						isOneToOne: false;
						referencedRelation: "exercises";
						referencedColumns: ["id"];
					},
				];
			};
			workouts: {
				Row: {
					id: string;
					user_id: string;
					template_id: string | null;
					name: string;
					date: string;
					status: "planned" | "in_progress" | "completed" | "skipped";
					started_at: string | null;
					completed_at: string | null;
					notes: string | null;
					duration_minutes: number | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					template_id?: string | null;
					name: string;
					date: string;
					status?: "planned" | "in_progress" | "completed" | "skipped";
					started_at?: string | null;
					completed_at?: string | null;
					notes?: string | null;
					duration_minutes?: number | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					template_id?: string | null;
					name?: string;
					date?: string;
					status?: "planned" | "in_progress" | "completed" | "skipped";
					started_at?: string | null;
					completed_at?: string | null;
					notes?: string | null;
					duration_minutes?: number | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "workouts_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "workouts_template_id_fkey";
						columns: ["template_id"];
						isOneToOne: false;
						referencedRelation: "workout_templates";
						referencedColumns: ["id"];
					},
				];
			};
			workout_exercises: {
				Row: {
					id: string;
					workout_id: string;
					exercise_id: string;
					sort_order: number;
					is_completed: boolean;
					notes: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					workout_id: string;
					exercise_id: string;
					sort_order?: number;
					is_completed?: boolean;
					notes?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					workout_id?: string;
					exercise_id?: string;
					sort_order?: number;
					is_completed?: boolean;
					notes?: string | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "workout_exercises_workout_id_fkey";
						columns: ["workout_id"];
						isOneToOne: false;
						referencedRelation: "workouts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "workout_exercises_exercise_id_fkey";
						columns: ["exercise_id"];
						isOneToOne: false;
						referencedRelation: "exercises";
						referencedColumns: ["id"];
					},
				];
			};
			exercise_sets: {
				Row: {
					id: string;
					workout_exercise_id: string;
					set_number: number;
					set_type: "warmup" | "working" | "dropset" | "failure";
					weight: number | null;
					reps: number | null;
					rpe: number | null;
					is_completed: boolean;
					notes: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					workout_exercise_id: string;
					set_number: number;
					set_type?: "warmup" | "working" | "dropset" | "failure";
					weight?: number | null;
					reps?: number | null;
					rpe?: number | null;
					is_completed?: boolean;
					notes?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					workout_exercise_id?: string;
					set_number?: number;
					set_type?: "warmup" | "working" | "dropset" | "failure";
					weight?: number | null;
					reps?: number | null;
					rpe?: number | null;
					is_completed?: boolean;
					notes?: string | null;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "exercise_sets_workout_exercise_id_fkey";
						columns: ["workout_exercise_id"];
						isOneToOne: false;
						referencedRelation: "workout_exercises";
						referencedColumns: ["id"];
					},
				];
			};
		};
		Views: Record<string, never>;
		Functions: Record<string, never>;
		Enums: Record<string, never>;
		CompositeTypes: Record<string, never>;
	};
}

type PublicSchema = Database["public"];

export type Tables<TableName extends keyof PublicSchema["Tables"]> =
	PublicSchema["Tables"][TableName]["Row"];

export type TablesInsert<TableName extends keyof PublicSchema["Tables"]> =
	PublicSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<TableName extends keyof PublicSchema["Tables"]> =
	PublicSchema["Tables"][TableName]["Update"];
