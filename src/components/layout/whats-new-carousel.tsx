"use client";

import { useState } from "react";
import { ListEnd, X, Activity, Target, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";

const whatsNewData = [
	{
		id: 1,
		icon: <Activity className="h-12 w-12 text-brand-cool" />,
		title: "Track Your Fitness Journey",
		description:
			"Connect your fitness devices and start tracking workouts, calories, and progress in real-time.",
		highlight: "Connect devices",
		highlightColor: "text-brand-cool",
	},
	{
		id: 2,
		icon: <Target className="h-12 w-12 text-brand-deep" />,
		title: "Set Personal Goals",
		description:
			"Create custom fitness goals and track your progress with detailed analytics and insights.",
		highlight: "Personal goals",
		highlightColor: "text-brand-deep",
	},
	{
		id: 3,
		icon: <Apple className="h-12 w-12 text-brand-warm" />,
		title: "Nutrition Tracking",
		description:
			"Log meals and monitor your nutritional intake to complement your fitness routine.",
		highlight: "Balanced nutrition",
		highlightColor: "text-brand-warm",
	},
];

export function WhatsNewCarousel() {
	const [showWhatsNew, setShowWhatsNew] = useState(false);

	return (
		<>
			<Button
				variant="ghost"
				size="sm"
				className="text-xs text-secondary-text hover:text-primary-text"
				onClick={() => setShowWhatsNew((prev) => !prev)}
			>
				<ListEnd className="h-4 w-4" />
				<span className="ml-1.5 hidden lg:inline">What&apos;s new?</span>
			</Button>

			{showWhatsNew && (
				<div className="fixed bottom-4 right-4 z-50 w-80 animate-in fade-in-0 slide-in-from-bottom-4">
					<div className="relative">
						<Button
							onClick={() => setShowWhatsNew(false)}
							variant="ghost"
							size="icon"
							className="absolute -right-2 -top-2 z-10 h-7 w-7 rounded-full bg-primary-surface shadow-md hover:bg-secondary-surface"
						>
							<X className="h-4 w-4" />
						</Button>

						<Carousel className="w-full">
							<CarouselContent>
								{whatsNewData.map((item) => (
									<CarouselItem key={item.id}>
										<Card className="border-border shadow-lg">
											<CardContent className="flex flex-col items-center p-6 text-center">
												<div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary-surface">
													{item.icon}
												</div>
												<h3 className="font-primary text-base font-semibold text-primary-text">
													{item.title}
												</h3>
												<p className="mt-2 text-xs text-secondary-text leading-relaxed">
													{item.description}
												</p>
												<p className="mt-3 text-[10px] text-secondary-text/70">
													Highlight:{" "}
													<span
														className={`font-semibold ${item.highlightColor}`}
													>
														{item.highlight}
													</span>
												</p>
											</CardContent>
										</Card>
									</CarouselItem>
								))}
							</CarouselContent>
							<CarouselPrevious className="left-2 h-7 w-7" />
							<CarouselNext className="right-2 h-7 w-7" />
						</Carousel>
					</div>
				</div>
			)}
		</>
	);
}
