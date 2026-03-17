export type GoalTemplate = {
	id: string;
	name: string;
	description: string;
	duration: number;
	tasks: string[];
	icon: string;
};

export const goalTemplates: GoalTemplate[] = [
	{
		id: "75-hard",
		name: "75 Hard",
		description: "The ultimate mental toughness challenge",
		duration: 75,
		tasks: [
			"Two 45-min workouts (one outdoor)",
			"Follow a diet with no cheat meals",
			"Drink 1 gallon of water",
			"Read 10 pages of non-fiction",
			"Take a progress photo",
			"No alcohol",
		],
		icon: "Flame",
	},
	{
		id: "30-day-fitness",
		name: "30 Day Fitness",
		description: "Build a consistent workout habit",
		duration: 30,
		tasks: [
			"Complete a workout",
			"Stretch for 10 minutes",
			"Drink 8 glasses of water",
		],
		icon: "Dumbbell",
	},
	{
		id: "21-day-mindfulness",
		name: "21 Day Mindfulness",
		description: "Cultivate daily mindfulness practices",
		duration: 21,
		tasks: [
			"Meditate for 10 minutes",
			"Write 3 gratitudes",
			"Digital detox for 1 hour",
		],
		icon: "Brain",
	},
	{
		id: "custom",
		name: "Custom Challenge",
		description: "Design your own challenge",
		duration: 30,
		tasks: [],
		icon: "Pencil",
	},
];
