// src/lib/sse/connections.ts

type SSEController = ReadableStreamDefaultController<Uint8Array>;

declare global {
  var sseConnections: Map<string, SSEController> | undefined;
}

// Reuse the same Map across all module instances
const connections: Map<string, SSEController> =
  global.sseConnections ?? (global.sseConnections = new Map());

export function addConnection(userId: string, controller: SSEController) {
  connections.set(userId, controller);
}

export function removeConnection(userId: string) {
  connections.delete(userId);
}

function formatEvent(event: string, data: unknown): Uint8Array {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  return new TextEncoder().encode(payload);
}

export function broadcast(event: string, data: unknown) {
  const chunk = formatEvent(event, data);
  for (const controller of connections.values()) {
    try {
      controller.enqueue(chunk);
    } catch {
      // ignore disconnected clients
    }
  }
}

export function sendToUser(userId: string, event: string, data: unknown) {
  const controller = connections.get(userId);
  if (!controller) return;
  try {
    controller.enqueue(formatEvent(event, data));
  } catch {
    removeConnection(userId);
  }
}