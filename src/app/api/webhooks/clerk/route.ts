import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
	try {
		const evt = await verifyWebhook(request, {
			signingSecret: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
		});

		const supabase = createAdminClient();

		switch (evt.type) {
			case "user.created": {
				const { id, email_addresses, first_name, last_name } = evt.data;
				const primaryEmail = email_addresses?.[0]?.email_address;

				const { error } = await supabase.from("users").insert({
					clerk_id: id,
					email: primaryEmail,
					first_name: first_name,
					last_name: last_name,
				});

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
				const primaryEmail = email_addresses?.[0]?.email_address;

				const { error } = await supabase
					.from("users")
					.update({
						email: primaryEmail,
						first_name: first_name,
						last_name: last_name,
					})
					.eq("clerk_id", id);

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
