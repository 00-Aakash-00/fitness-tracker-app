"use client";

import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface FitnessDevice {
	id: string;
	type: "whoop" | "oura";
	deviceName: string;
	status: "connected" | "syncing" | "offline";
	image: string;
}

interface FitnessCarouselProps {
	devices?: FitnessDevice[];
	onAddDevice?: () => void;
	onDisconnect?: () => void;
}

const defaultDevices: FitnessDevice[] = [
	{
		id: "1",
		type: "whoop",
		deviceName: "WHOOP 4.0",
		status: "connected",
		image: "/whoop.png",
	},
	{
		id: "2",
		type: "oura",
		deviceName: "Oura Ring Gen 3",
		status: "connected",
		image: "/oura.png",
	},
];

export function FitnessDeviceCarousel({
	devices = defaultDevices,
	onAddDevice,
	onDisconnect,
}: FitnessCarouselProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const router = useRouter();
	const handleAddDevice =
		onAddDevice ?? (() => router.push("/dashboard/devices"));
	const handleDisconnect =
		onDisconnect ?? (() => router.push("/dashboard/devices"));

	if (devices.length === 0) {
		return (
			<div className="w-full space-y-4 rounded-xl border border-border/40 bg-primary-surface p-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg tracking-tight font-semibold text-primary-text">
						Connected{" "}
						<span className="font-accent italic text-brand-cool">Devices</span>
					</h2>
				</div>
				<p className="rounded-lg border border-border/40 bg-secondary-surface/40 p-3 text-sm text-secondary-text">
					WHOOP and Oura integrations are coming soon.
				</p>
			</div>
		);
	}

	const handlePrevious = () => {
		setCurrentIndex((prev) => (prev > 0 ? prev - 1 : devices.length - 1));
	};

	const handleNext = () => {
		setCurrentIndex((prev) => (prev < devices.length - 1 ? prev + 1 : 0));
	};

	const safeIndex = currentIndex % devices.length;
	const currentDevice = devices[safeIndex];

	return (
		<div className="w-full rounded-xl border border-border/40 bg-primary-surface p-4 space-y-4">
			{/* Header Row - Title + Navigation */}
			<div className="flex items-center justify-between">
				<h2 className="text-lg tracking-tight font-semibold text-primary-text">
					Connected{" "}
					<span className="font-accent italic text-brand-cool">Devices</span>
				</h2>

				{/* Navigation Arrows */}
				<div className="flex items-center gap-1.5">
					<button
						type="button"
						className="flex items-center justify-center rounded-full border border-border/40 bg-primary-surface h-7 w-7 transition-all duration-200 hover:border-border/60 hover:bg-secondary-surface disabled:opacity-40"
						onClick={handlePrevious}
						disabled={devices.length <= 1}
					>
						<ChevronLeft className="h-4 w-4 text-secondary-text" />
					</button>
					<button
						type="button"
						className="flex items-center justify-center rounded-full border border-border/40 bg-primary-surface h-7 w-7 transition-all duration-200 hover:border-border/60 hover:bg-secondary-surface disabled:opacity-40"
						onClick={handleNext}
						disabled={devices.length <= 1}
					>
						<ChevronRight className="h-4 w-4 text-secondary-text" />
					</button>
				</div>
			</div>

			{/* Device Image - Fixed to Oura aspect ratio (1280x853) */}
			<div className="relative rounded-lg overflow-hidden bg-secondary-surface aspect-[1280/853]">
				<Image
					src={currentDevice.image}
					alt={currentDevice.deviceName}
					fill
					className="object-cover"
					priority
				/>
				{/* Device Name Overlay */}
				<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
					<p className="font-geist text-sm font-medium text-white">
						{currentDevice.deviceName}
					</p>
					<p className="text-xs text-white/70 capitalize">
						{currentDevice.status}
					</p>
				</div>
			</div>

			{/* Footer Row - Actions + Pagination */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				{/* Action Buttons */}
				<div className="flex items-center gap-2">
					<button
						type="button"
						className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/40 bg-primary-surface/80 px-3 py-1.5 text-xs text-secondary-text/90 transition-all duration-200 hover:border-border/60 hover:bg-primary-surface hover:text-primary-text"
						onClick={handleAddDevice}
					>
						<Plus className="h-3 w-3" />
						<span className="font-geist">Connect</span>
					</button>
					<button
						type="button"
						className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-warm px-3 py-1.5 text-xs text-white transition-all duration-200 hover:opacity-90"
						onClick={handleDisconnect}
					>
						<Trash2 className="h-3 w-3" />
						<span className="font-geist">Disconnect</span>
					</button>
				</div>

				{/* Pagination */}
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1.5">
						{devices.map((_, index) => (
							<button
								key={devices[index].id}
								type="button"
								onClick={() => setCurrentIndex(index)}
								className={`rounded-full transition-all duration-200 ${
									index === safeIndex
										? "w-5 h-1.5 bg-brand-cool"
										: "w-1.5 h-1.5 bg-border hover:bg-secondary-text/40"
								}`}
								aria-label={`Go to device ${index + 1}`}
							/>
						))}
					</div>
					<span className="font-geist text-xs text-secondary-text">
						<span className="font-medium text-primary-text">
							{safeIndex + 1}
						</span>
						/
						<span className="font-medium text-primary-text">
							{devices.length}
						</span>
					</span>
				</div>
			</div>
		</div>
	);
}
