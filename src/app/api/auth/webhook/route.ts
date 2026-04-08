import { headers } from "next/headers";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models";

/**
 * POST /api/auth/webhook
 *
 * Receives Clerk webhook events and syncs user data into MongoDB.
 * Secured via svix signature verification — rejects any unverified request.
 */
export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // Verify the webhook signature
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(webhookSecret);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  await connectDB();

  switch (event.type) {
    case "user.created": {
      const { id, email_addresses, username, first_name, last_name, image_url } = event.data;
      await User.create({
        clerkId: id,
        email: email_addresses[0]?.email_address ?? "",
        username: username ?? id,
        firstName: first_name ?? "",
        lastName: last_name ?? "",
        imageUrl: image_url ?? "",
      });
      break;
    }

    case "user.updated": {
      const { id, email_addresses, username, first_name, last_name, image_url } = event.data;
      await User.findOneAndUpdate(
        { clerkId: id },
        {
          email: email_addresses[0]?.email_address ?? "",
          username: username ?? id,
          firstName: first_name ?? "",
          lastName: last_name ?? "",
          imageUrl: image_url ?? "",
        }
      );
      break;
    }

    case "user.deleted": {
      await User.findOneAndDelete({ clerkId: event.data.id });
      break;
    }
  }

  return new Response("OK", { status: 200 });
}
