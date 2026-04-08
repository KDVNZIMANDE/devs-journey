/**
 * SSE connection registry.
 * Maps a userId to their active ReadableStream controller so we can
 * push events to specific users or broadcast to all connected clients.
 */
type SSEController = ReadableStreamDefaultController<Uint8Array>;

const connections = new Map<string, SSEController>();

/**
 * Registers a new SSE connection for a user.
 */
export function addConnection(userId: string, controller: SSEController) {
  connections.set(userId, controller);
}

/**
 * Removes an SSE connection when the client disconnects.
 */
export function removeConnection(userId: string) {
  connections.delete(userId);
}

/**
 * Formats a payload as an SSE event string.
 */
function formatEvent(event: string, data: unknown): Uint8Array {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  return new TextEncoder().encode(payload);
}

/**
 * Broadcasts an event to all connected clients.
 */
export function broadcast(event: string, data: unknown) {
  const chunk = formatEvent(event, data);
  for (const controller of connections.values()) {
    try {
      controller.enqueue(chunk);
    } catch {
      // Client disconnected mid-broadcast — safe to ignore
    }
  }
}

/**
 * Sends an event to a specific user by userId.
 */
export function sendToUser(userId: string, event: string, data: unknown) {
  const controller = connections.get(userId);
  if (!controller) return;
  try {
    controller.enqueue(formatEvent(event, data));
  } catch {
    removeConnection(userId);
  }
}
