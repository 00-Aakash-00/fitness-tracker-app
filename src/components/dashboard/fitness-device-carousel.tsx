"use client";

import { ChevronLeft, ChevronRight, Link2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export interface FitnessDeviceConnection {
	id: "whoop" | "oura";
	type: "whoop" | "oura";
	deviceName: string;
	status: "connected" | "not_connected" | "unavailable";
	image: string;
}

interface FitnessCarouselProps {
	devices: FitnessDeviceConnection[];
}

const statusLabel: Record<FitnessDeviceConnection["status"], string> = {
	connected: "Connected",
	not_connected: "Not connected",
	unavailable: "Coming soon",
};

const statusDescription: Record<FitnessDeviceConnection["status"], string> = {
	connected: "Your account is connected and ready to sync.",
	not_connected: "Connect this provider to start syncing data.",
	unavailable: "This provider is not configured in this environment yet.",
};

export function FitnessDeviceCarousel({ devices }: FitnessCarouselProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const hasDevices = devices.length > 0;

	const handlePrevious = () => {
		setCurrentIndex((prev) => (prev > 0 ? prev - 1 : devices.length - 1));
	};

	const handleNext = () => {
		setCurrentIndex((prev) => (prev < devices.length - 1 ? prev + 1 : 0));
	};

	const safeIndex = hasDevices ? currentIndex % devices.length : 0;
	const currentDevice = hasDevices ? devices[safeIndex] : null;
	const connectHref = currentDevice
		? `/api/integrations/${currentDevice.type}/authorize?returnTo=/dashboard`
		: "/dashboard/devices";
	const disconnectHref = currentDevice
		? `/api/integrations/${currentDevice.type}/disconnect?returnTo=/dashboard`
		: "/dashboard/devices";

	return (
		<div className="w-full rounded-xl border border-border/40 bg-primary-surface p-4 space-y-4">
			{/* Header Row - Title + Navigation */}
			<div className="flex items-center justify-between">
				<h2 className="text-lg tracking-tight font-semibold text-primary-text">
					Device{" "}
					<span className="font-accent italic text-brand-cool">
						Connections
					</span>
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
				{currentDevice ? (
					<>
						<Image
							src={currentDevice.image}
							alt={currentDevice.deviceName}
							fill
							className="object-cover"
							priority
						/>
						<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
							<p className="font-geist text-sm font-medium text-white">
								{currentDevice.deviceName}
							</p>
							<p className="text-xs text-white/70">
								{statusLabel[currentDevice.status]}
							</p>
						</div>
					</>
				) : (
					<div className="flex h-full items-center justify-center px-6 text-center text-sm text-secondary-text">
						Provider connections will appear here when integrations are
						available.
					</div>
				)}
			</div>

			<p className="rounded-lg border border-border/40 bg-secondary-surface/40 p-3 text-sm text-secondary-text">
				{currentDevice
					? statusDescription[currentDevice.status]
					: "Provider connections will appear here when integrations are available."}
			</p>

			{/* Footer Row - Actions + Pagination */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-2">
					{currentDevice?.status === "connected" ? (
						<form action={disconnectHref} method="post">
							<button
								type="submit"
								className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-warm px-3 py-1.5 text-xs text-white transition-all duration-200 hover:opacity-90"
							>
								<Trash2 className="h-3 w-3" />
								<span className="font-geist">
									Disconnect {currentDevice.deviceName}
								</span>
							</button>
						</form>
					) : currentDevice?.status === "not_connected" ? (
						<a
							href={connectHref}
							className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/40 bg-primary-surface/80 px-3 py-1.5 text-xs text-secondary-text/90 transition-all duration-200 hover:border-border/60 hover:bg-primary-surface hover:text-primary-text"
						>
							<Link2 className="h-3 w-3" />
							<span className="font-geist">
								Connect {currentDevice.deviceName}
							</span>
						</a>
					) : (
						<button
							type="button"
							disabled
							className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/40 bg-primary-surface/60 px-3 py-1.5 text-xs text-secondary-text/70 opacity-70"
						>
							<Link2 className="h-3 w-3" />
							<span className="font-geist">Coming soon</span>
						</button>
					)}
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
							{hasDevices ? safeIndex + 1 : 0}
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
