import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	getOAuthConnection,
	getSupabaseUserIdByClerkId,
} from "@/lib/integrations/oauth-connections.server";
import { isOuraConfigured } from "@/lib/integrations/oura.server";
import { isWhoopConfigured } from "@/lib/integrations/whoop.server";
import { parseStepGoal, STEP_GOAL_COOKIE } from "@/lib/preferences";
import { getProgressSnapshot } from "@/lib/progress/progress.server";
import type {
	ActiveWearableProvider,
	SyncFreshness,
} from "@/lib/progress/progress.types";

type ConnectedProvider = Exclude<ActiveWearableProvider, null>;

export const metadata: Metadata = {
	title: "Devices | FitnessTracker",
};

function formatDate(value: string | null | undefined): string | null {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	return new Intl.DateTimeFormat(undefined, {
		year: "numeric",
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

function getConnectedDeviceStatus(params: {
	activeProvider: ActiveWearableProvider;
	syncFreshness: SyncFreshness;
	provider: ConnectedProvider;
}) {
	if (params.syncFreshness === "blocked") {
		return {
			label: "Blocked by Active Device",
			copy: "More than one wearable is connected right now. Disconnect the other provider before relying on today’s guidance.",
			tone: "text-brand-warm",
		};
	}

	if (params.activeProvider !== params.provider) {
		return {
			label: "Connected",
			copy: "Connected and available. The latest sync state will show here once this device becomes the active wearable.",
			tone: "text-brand-cool",
		};
	}

	switch (params.syncFreshness) {
		case "syncing":
			return {
				label: "Syncing",
				copy: "The first sync is still running. Initial sleep and activity data should start appearing shortly.",
				tone: "text-brand-warm",
			};
		case "baseline_forming":
			return {
				label: "Baseline Forming",
				copy: "The device is connected and sending data. A few more days will make recovery guidance more stable.",
				tone: "text-brand-warm",
			};
		case "stale":
			return {
				label: "Stale",
				copy: "The last sync is old enough that today’s guidance may be behind. Reconnect or resync this device.",
				tone: "text-brand-warm",
			};
		case "ready":
			return {
				label: "Ready",
				copy: "This device is the active wearable and the app has enough data to generate useful guidance.",
				tone: "text-brand-cool",
			};
		default:
			return {
				label: "Connected",
				copy: "This wearable is connected and available to sync.",
				tone: "text-brand-cool",
			};
	}
}

function getAvailableDeviceStatus(params: {
	isAvailable: boolean;
	isBlocked: boolean;
	providerLabel: string;
	activeProviderLabel: string;
	connectCopy: string;
}) {
	if (!params.isAvailable) {
		return {
			label: "Coming soon",
			copy: `${params.providerLabel} support will appear here once the provider is enabled.`,
			tone: "text-secondary-text",
		};
	}

	if (params.isBlocked) {
		return {
			label: "Blocked by Active Device",
			copy: `IAM360 uses one active wearable at a time. Disconnect ${params.activeProviderLabel} before switching providers.`,
			tone: "text-brand-warm",
		};
	}

	return {
		label: "Available",
		copy: params.connectCopy,
		tone: "text-secondary-text",
	};
}

export default async function DevicesPage({
	searchParams,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
	const [{ userId }, cookieStore, resolvedSearchParams] = await Promise.all([
		auth(),
		cookies(),
		(searchParams ?? Promise.resolve({})) as Promise<
			Record<string, string | string[] | undefined>
		>,
	]);

	if (!userId) {
		redirect("/sign-in");
	}

	const stepGoal = parseStepGoal(cookieStore.get(STEP_GOAL_COOKIE)?.value);
	let supabaseUserId: string | null = null;
	try {
		supabaseUserId = await getSupabaseUserIdByClerkId(userId);
	} catch {
		supabaseUserId = null;
	}

	const isWhoopAvailable = isWhoopConfigured();
	const isOuraAvailable = isOuraConfigured();
	const [whoopConnection, ouraConnection, progressSnapshot] = await Promise.all(
		[
			supabaseUserId && isWhoopAvailable
				? getOAuthConnection({ userId: supabaseUserId, provider: "whoop" })
				: Promise.resolve(null),
			supabaseUserId && isOuraAvailable
				? getOAuthConnection({ userId: supabaseUserId, provider: "oura" })
				: Promise.resolve(null),
			supabaseUserId
				? getProgressSnapshot({
						supabaseUserId,
						rangeDays: 7,
						stepGoal,
					})
				: Promise.resolve(null),
		]
	);

	const integration =
		typeof resolvedSearchParams.integration === "string"
			? resolvedSearchParams.integration
			: undefined;
	const status =
		typeof resolvedSearchParams.status === "string"
			? resolvedSearchParams.status
			: undefined;
	const message =
		typeof resolvedSearchParams.message === "string"
			? resolvedSearchParams.message
			: undefined;

	const activeProvider = progressSnapshot?.currentState.activeProvider ?? null;
	const syncFreshness =
		progressSnapshot?.currentState.syncFreshness ?? "not_connected";

	const isWhoopBlocked = Boolean(ouraConnection) && !whoopConnection;
	const isOuraBlocked = Boolean(whoopConnection) && !ouraConnection;

	const whoopStatus = whoopConnection
		? getConnectedDeviceStatus({
				activeProvider,
				syncFreshness,
				provider: "whoop",
			})
		: getAvailableDeviceStatus({
				isAvailable: isWhoopAvailable,
				isBlocked: isWhoopBlocked,
				providerLabel: "WHOOP",
				activeProviderLabel: "Oura",
				connectCopy:
					"Connect your WHOOP account to start syncing recovery, sleep, workouts, and strain data.",
			});

	const ouraStatus = ouraConnection
		? getConnectedDeviceStatus({
				activeProvider,
				syncFreshness,
				provider: "oura",
			})
		: getAvailableDeviceStatus({
				isAvailable: isOuraAvailable,
				isBlocked: isOuraBlocked,
				providerLabel: "Oura",
				activeProviderLabel: "WHOOP",
				connectCopy:
					"Connect your Oura account to start syncing readiness, sleep, activity, and heart rate trends.",
			});

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h1 className="font-primary text-2xl font-semibold text-primary-text">
					Devices
				</h1>
				<p className="font-secondary text-sm text-secondary-text">
					Connect one wearable at a time so recovery and activity guidance come
					from a single source of truth.
				</p>
				<p className="font-secondary text-sm text-secondary-text">
					If you want to switch providers, disconnect the current one first.
				</p>
			</div>

			{integration && status ? (
				<Card
					className={
						status === "error" ? "border-red-500/40" : "border-brand-cool/30"
					}
				>
					<CardHeader>
						<CardTitle className="capitalize">
							{integration}{" "}
							{status === "connected"
								? "connected"
								: status === "disconnected"
									? "disconnected"
									: "error"}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-secondary-text">
							{status === "error"
								? message || "Something went wrong. Please try again."
								: status === "connected"
									? "Your account is connected."
									: "Your account is disconnected."}
						</p>
					</CardContent>
				</Card>
			) : null}

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between gap-4">
							<div className="flex items-center gap-3">
								<Image
									src="/whoop.png"
									alt="WHOOP"
									width={40}
									height={40}
									className="rounded-lg"
								/>
								<div>
									<CardTitle>WHOOP</CardTitle>
									<p className="text-sm text-secondary-text">
										Recovery, sleep, workouts, strain
									</p>
								</div>
							</div>
							<span className={`text-xs font-medium ${whoopStatus.tone}`}>
								{whoopStatus.label}
							</span>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm leading-relaxed text-secondary-text">
							{whoopStatus.copy}
						</p>

						{whoopConnection ? (
							<div className="space-y-1 text-sm text-secondary-text">
								<p>
									<span className="text-primary-text">Connected at:</span>{" "}
									{formatDate(whoopConnection.created_at) ?? "—"}
								</p>
								<p>
									<span className="text-primary-text">Active wearable:</span>{" "}
									{activeProvider === "whoop" ? "Yes" : "No"}
								</p>
							</div>
						) : null}

						<div className="flex items-center gap-3">
							{!isWhoopAvailable ? (
								<Button variant="outline" type="button" disabled>
									Coming soon
								</Button>
							) : whoopConnection ? (
								<form action="/api/integrations/whoop/disconnect" method="post">
									<Button variant="destructive" type="submit">
										Disconnect
									</Button>
								</form>
							) : isWhoopBlocked ? (
								<Button variant="outline" type="button" disabled>
									One wearable active
								</Button>
							) : (
								<Button asChild>
									<a href="/api/integrations/whoop/authorize?returnTo=/dashboard/devices">
										Connect
									</a>
								</Button>
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex items-center justify-between gap-4">
							<div className="flex items-center gap-3">
								<Image
									src="/oura.png"
									alt="Oura"
									width={40}
									height={40}
									className="rounded-lg"
								/>
								<div>
									<CardTitle>Oura</CardTitle>
									<p className="text-sm text-secondary-text">
										Readiness, sleep, activity, heart rate
									</p>
								</div>
							</div>
							<span className={`text-xs font-medium ${ouraStatus.tone}`}>
								{ouraStatus.label}
							</span>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm leading-relaxed text-secondary-text">
							{ouraStatus.copy}
						</p>

						{ouraConnection ? (
							<div className="space-y-1 text-sm text-secondary-text">
								<p>
									<span className="text-primary-text">Connected at:</span>{" "}
									{formatDate(ouraConnection.created_at) ?? "—"}
								</p>
								<p>
									<span className="text-primary-text">Active wearable:</span>{" "}
									{activeProvider === "oura" ? "Yes" : "No"}
								</p>
							</div>
						) : null}

						<div className="flex items-center gap-3">
							{!isOuraAvailable ? (
								<Button variant="outline" type="button" disabled>
									Coming soon
								</Button>
							) : ouraConnection ? (
								<form action="/api/integrations/oura/disconnect" method="post">
									<Button variant="destructive" type="submit">
										Disconnect
									</Button>
								</form>
							) : isOuraBlocked ? (
								<Button variant="outline" type="button" disabled>
									One wearable active
								</Button>
							) : (
								<Button asChild>
									<a href="/api/integrations/oura/authorize?returnTo=/dashboard/devices">
										Connect
									</a>
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
