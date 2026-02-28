import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
	try {
		const signingSecret =
			process.env.CLERK_WEBHOOK_SIGNING_SECRET ??
			process.env.CLERK_WEBHOOK_SECRET;
		if (!signingSecret) {
			console.error(
				"Missing Clerk webhook secret (CLERK_WEBHOOK_SIGNING_SECRET or CLERK_WEBHOOK_SECRET)."
			);
			return new Response("Missing webhook signing secret", { status: 500 });
		}

		const evt = await verifyWebhook(request, {
			signingSecret,
		});

		const supabase = createAdminClient();

		switch (evt.type) {
			case "user.created": {
				const { id, email_addresses, first_name, last_name } = evt.data;
				const primaryEmailId = evt.data.primary_email_address_id;
				const primaryEmail =
					primaryEmailId && email_addresses
						? email_addresses.find((entry) => entry.id === primaryEmailId)
								?.email_address
						: email_addresses?.[0]?.email_address;

				const { error } = await supabase.from("users").upsert(
					{
						clerk_id: id,
						email: primaryEmail ?? null,
						first_name: first_name ?? null,
						last_name: last_name ?? null,
					},
					{ onConflict: "clerk_id" }
				);

				if (error) {
					console.error("Error creating user in Supabase:", error);
					return new Response(`Error creating user: ${error.message}`, {
						status: 500,
					});
				}

				console.log(`User created in Supabase: ${id}`);
				break;
			}

			case "user.updated": {
				const { id, email_addresses, first_name, last_name } = evt.data;
				const primaryEmailId = evt.data.primary_email_address_id;
				const primaryEmail =
					primaryEmailId && email_addresses
						? email_addresses.find((entry) => entry.id === primaryEmailId)
								?.email_address
						: email_addresses?.[0]?.email_address;

				const { error } = await supabase.from("users").upsert(
					{
						clerk_id: id,
						email: primaryEmail ?? null,
						first_name: first_name ?? null,
						last_name: last_name ?? null,
					},
					{ onConflict: "clerk_id" }
				);

				if (error) {
					console.error("Error updating user in Supabase:", error);
					return new Response(`Error updating user: ${error.message}`, {
						status: 500,
					});
				}

				console.log(`User updated in Supabase: ${id}`);
				break;
			}

			case "user.deleted": {
				const { id } = evt.data;

				if (!id) {
					console.error("No user ID in deleted event");
					return new Response("No user ID provided", { status: 400 });
				}

				const { error } = await supabase
					.from("users")
					.delete()
					.eq("clerk_id", id);

				if (error) {
					console.error("Error deleting user in Supabase:", error);
					return new Response(`Error deleting user: ${error.message}`, {
						status: 500,
					});
				}

				console.log(`User deleted from Supabase: ${id}`);
				break;
			}

			default:
				console.log(`Unhandled webhook event type: ${evt.type}`);
		}

		return new Response("Webhook processed successfully", { status: 200 });
	} catch (err) {
		console.error("Webhook verification failed:", err);
		return new Response("Webhook verification failed", { status: 400 });
	}
}
