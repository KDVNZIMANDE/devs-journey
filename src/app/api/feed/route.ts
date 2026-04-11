import { auth } from "@clerk/nextjs/server";
import { addConnection, removeConnection } from "@/lib/sse/connections";

/**
 * GET /api/feed
 *
 * Server-Sent Events endpoint. Runs on Edge Runtime for persistent
 * streaming without execution timeout limits.
 *
 * Clients connect once and receive real-time events:
 *  - new_project
 *  - project_updated
 *  - project_completed
 *  - new_milestone
 *  - new_comment
 *
 * The browser auto-reconnects if the connection drops.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorised", { status: 401 });
  }

  let controller: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl;
      addConnection(userId, controller);

      // Send an initial heartbeat so the client knows the connection is live
      const heartbeat = new TextEncoder().encode(": heartbeat\n\n");
      controller.enqueue(heartbeat);
    },
    cancel() {
      removeConnection(userId);
    },
  });

  // Keep-alive ping every 25 seconds to prevent proxies from closing idle connections
  const keepAlive = setInterval(() => {
    try {
      const ping = new TextEncoder().encode(": ping\n\n");
      controller.enqueue(ping);
    } catch {
      clearInterval(keepAlive);
    }
  }, 25_000);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering
    },
  });
}
