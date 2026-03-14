import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type {
	ConnectionDevicePanelState,
	ConnectionPanelState,
} from "@/lib/dashboard/wearable-dashboard.types";
import { cn } from "@/lib/utils";

const statusTone = {
	connected: "border-brand-cool/30 bg-brand-cool/5 text-brand-cool",
	not_connected: "border-border/50 bg-primary-surface text-secondary-text",
	blocked: "border-brand-warm/25 bg-brand-warm/10 text-brand-warm",
	unavailable: "border-border/50 bg-secondary-surface/40 text-secondary-text",
} as const;

function statusLabel(status: ConnectionDevicePanelState["status"]) {
	switch (status) {
		case "connected":
			return "active";
		case "not_connected":
			return "ready to connect";
		case "blocked":
			return "switch first";
		case "unavailable":
			return "not available";
	}
}

export function WearableConnectionPanel({
	panel,
}: {
	panel: ConnectionPanelState;
}) {
	return (
		<section className="w-full space-y-3 rounded-xl border border-border/40 bg-primary-surface p-4 sm:p-5">
			<div className="space-y-1">
				<h2 className="text-lg tracking-tight font-semibold text-primary-text">
					Wearable{" "}
					<span className="font-accent italic text-brand-cool">Connection</span>
				</h2>
				<p className="text-sm font-medium text-primary-text">
					{panel.headline}
				</p>
				<p className="text-xs leading-relaxed text-secondary-text">
					{panel.description}
				</p>
			</div>

			<div className="space-y-3">
				<DeviceConnectionCard device={panel.primary} />
				<DeviceConnectionCard device={panel.secondary} />
			</div>
		</section>
	);
}

function DeviceConnectionCard({
	device,
}: {
	device: ConnectionDevicePanelState;
}) {
	return (
		<article
			className={cn(
				"rounded-xl border border-border/40 p-3.5",
				device.featured
					? "bg-gradient-to-br from-brand-cool/5 via-primary-surface to-brand-soft/10"
					: "bg-secondary-surface/35"
			)}
		>
			<div className="flex items-start gap-3">
				<div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border/40 bg-primary-surface">
					<Image
						src={device.image}
						alt={device.deviceName}
						fill
						className="object-cover"
						sizes="56px"
					/>
				</div>

				<div className="min-w-0 flex-1 space-y-3">
					<div className="flex flex-wrap items-start justify-between gap-2">
						<div className="space-y-1">
							<div className="flex flex-wrap items-center gap-2">
								<h3 className="text-sm font-semibold text-primary-text">
									{device.deviceName}
								</h3>
								<span
									className={cn(
										"inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
										statusTone[device.status]
									)}
								>
									{statusLabel(device.status)}
								</span>
							</div>
							<p className="text-xs leading-relaxed text-secondary-text">
								{device.description}
							</p>
						</div>
					</div>

					<div className="flex flex-wrap items-center justify-between gap-3">
						<p className="text-[11px] text-secondary-text">
							{device.lastSyncedLabel ?? "No recent sync yet"}
						</p>
						<DeviceAction device={device} />
					</div>
				</div>
			</div>
		</article>
	);
}

function DeviceAction({ device }: { device: ConnectionDevicePanelState }) {
	if (
		!device.actionHref ||
		device.status === "blocked" ||
		device.status === "unavailable"
	) {
		return (
			<span
				className={cn(
					"inline-flex min-h-9 items-center rounded-lg border px-3 py-1.5 text-xs font-medium",
					device.status === "blocked"
						? "border-brand-warm/20 bg-brand-warm/10 text-brand-warm"
						: "border-border/50 bg-primary-surface text-secondary-text"
				)}
			>
				{device.actionLabel}
			</span>
		);
	}

	if (device.actionMethod === "post") {
		return (
			<form action={device.actionHref} method="post">
				<Button
					type="submit"
					variant="outline"
					className="min-h-9 rounded-lg border-brand-warm/25 bg-brand-warm/10 text-brand-warm hover:bg-brand-warm/15 hover:text-brand-warm"
				>
					{device.actionLabel}
				</Button>
			</form>
		);
	}

	return (
		<Button
			asChild
			variant={device.featured ? "default" : "outline"}
			className="min-h-9 rounded-lg"
		>
			<Link href={device.actionHref}>{device.actionLabel}</Link>
		</Button>
	);
}
