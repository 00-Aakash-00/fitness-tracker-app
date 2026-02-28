import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	getOAuthConnection,
	getSupabaseUserIdByClerkId,
} from "@/lib/integrations/oauth-connections.server";
import { isOuraConfigured } from "@/lib/integrations/oura.server";
import { isWhoopConfigured } from "@/lib/integrations/whoop.server";

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

export default async function DevicesPage({
	searchParams,
}: {
	searchParams?: Record<string, string | string[] | undefined>;
}) {
	const { userId } = await auth();
	if (!userId) {
		redirect("/sign-in");
	}

	let supabaseUserId: string;
	try {
		supabaseUserId = await getSupabaseUserIdByClerkId(userId);
	} catch {
		return (
			<div className="space-y-6">
				<div className="space-y-2">
					<h1 className="font-primary text-2xl font-semibold text-primary-text">
						Devices
					</h1>
					<p className="font-secondary text-sm text-secondary-text">
						Your account is still being set up. Please refresh in a moment.
					</p>
				</div>
				<Card>
					<CardHeader>
						<CardTitle>Account setup in progress</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-secondary-text">
							If this persists, ensure the Clerk → Supabase webhook is
							configured and delivering events.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	const isWhoopAvailable = isWhoopConfigured();
	const isOuraAvailable = isOuraConfigured();
	const [whoopConnection, ouraConnection] = await Promise.all([
		isWhoopAvailable
			? getOAuthConnection({ userId: supabaseUserId, provider: "whoop" })
			: Promise.resolve(null),
		isOuraAvailable
			? getOAuthConnection({ userId: supabaseUserId, provider: "oura" })
			: Promise.resolve(null),
	]);

	const integration =
		typeof searchParams?.integration === "string"
			? searchParams.integration
			: undefined;
	const status =
		typeof searchParams?.status === "string" ? searchParams.status : undefined;
	const message =
		typeof searchParams?.message === "string"
			? searchParams.message
			: undefined;

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h1 className="font-primary text-2xl font-semibold text-primary-text">
					Devices
				</h1>
				<p className="font-secondary text-sm text-secondary-text">
					Connect WHOOP and Oura to sync your fitness data.
				</p>
			</div>

			{integration && status && (
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
			)}

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
							<span
								className={
									!isWhoopAvailable
										? "text-xs text-secondary-text"
										: whoopConnection
											? "text-xs text-brand-cool"
											: "text-xs text-secondary-text"
								}
							>
								{!isWhoopAvailable
									? "Coming soon"
									: whoopConnection
										? "Connected"
										: "Not connected"}
							</span>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						{!isWhoopAvailable ? (
							<p className="text-sm text-secondary-text">
								Coming soon. WHOOP will be available after API keys are
								configured.
							</p>
						) : whoopConnection ? (
							<div className="space-y-1 text-sm text-secondary-text">
								<p>
									<span className="text-primary-text">Connected at:</span>{" "}
									{formatDate(whoopConnection.created_at) ?? "—"}
								</p>
								<p>
									<span className="text-primary-text">Provider user:</span>{" "}
									{whoopConnection.provider_user_id ?? "—"}
								</p>
								<p>
									<span className="text-primary-text">Scopes:</span>{" "}
									{whoopConnection.scope ?? "—"}
								</p>
							</div>
						) : (
							<p className="text-sm text-secondary-text">
								Connect your WHOOP account to start syncing data.
							</p>
						)}

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
							) : (
								<Button asChild>
									<Link href="/api/integrations/whoop/authorize?returnTo=/dashboard/devices">
										Connect
									</Link>
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
							<span
								className={
									!isOuraAvailable
										? "text-xs text-secondary-text"
										: ouraConnection
											? "text-xs text-brand-cool"
											: "text-xs text-secondary-text"
								}
							>
								{!isOuraAvailable
									? "Coming soon"
									: ouraConnection
										? "Connected"
										: "Not connected"}
							</span>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						{!isOuraAvailable ? (
							<p className="text-sm text-secondary-text">
								Coming soon. Oura will be available after API keys are
								configured.
							</p>
						) : ouraConnection ? (
							<div className="space-y-1 text-sm text-secondary-text">
								<p>
									<span className="text-primary-text">Connected at:</span>{" "}
									{formatDate(ouraConnection.created_at) ?? "—"}
								</p>
								<p>
									<span className="text-primary-text">Provider user:</span>{" "}
									{ouraConnection.provider_user_id ?? "—"}
								</p>
								<p>
									<span className="text-primary-text">Scopes:</span>{" "}
									{ouraConnection.scope ?? "—"}
								</p>
							</div>
						) : (
							<p className="text-sm text-secondary-text">
								Connect your Oura account to start syncing data.
							</p>
						)}

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
							) : (
								<Button asChild>
									<Link href="/api/integrations/oura/authorize?returnTo=/dashboard/devices">
										Connect
									</Link>
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
