/**
 * tests/unit/lib/sse-connections.test.ts
 *
 * Tests for src/lib/sse/connections.ts
 *
 * The module stores connections on globalThis to survive HMR.
 * We reset global.sseConnections before each test for isolation.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Helper: create a fake SSE controller
function makeController() {
  return {
    enqueue: vi.fn(),
    close: vi.fn(),
    error: vi.fn(),
  } as unknown as ReadableStreamDefaultController<Uint8Array>;
}

// Re-import fresh module each time by busting the module cache via globalThis reset
async function freshModule() {
  // Reset the global store so each test starts clean
  global.sseConnections = undefined;
  // Vitest caches modules; use a cache-bust query to force re-evaluation
  const mod = await import("../../../src/lib/sse/connections?t=" + Date.now());
  return mod;
}

describe("SSE connections", () => {
  let connections: typeof import("../../../src/lib/sse/connections");

  beforeEach(async () => {
    connections = await freshModule();
  });

  // ── addConnection / removeConnection ───────────────────────────────────────

  describe("addConnection & removeConnection", () => {
    it("registers a controller for a userId", () => {
      const ctrl = makeController();
      connections.addConnection("user-1", ctrl);

      // broadcast to confirm the connection is tracked
      connections.broadcast("ping", {});
      expect(ctrl.enqueue).toHaveBeenCalledOnce();
    });

    it("overwrites an existing connection for the same userId", () => {
      const ctrl1 = makeController();
      const ctrl2 = makeController();

      connections.addConnection("user-1", ctrl1);
      connections.addConnection("user-1", ctrl2);

      connections.broadcast("ping", {});
      expect(ctrl1.enqueue).not.toHaveBeenCalled();
      expect(ctrl2.enqueue).toHaveBeenCalledOnce();
    });

    it("removeConnection stops the controller receiving events", () => {
      const ctrl = makeController();
      connections.addConnection("user-1", ctrl);
      connections.removeConnection("user-1");

      connections.broadcast("ping", {});
      expect(ctrl.enqueue).not.toHaveBeenCalled();
    });

    it("removeConnection is a no-op for unknown userId", () => {
      expect(() => connections.removeConnection("nobody")).not.toThrow();
    });
  });

  // ── broadcast ─────────────────────────────────────────────────────────────

  describe("broadcast()", () => {
    it("sends to all connected clients", () => {
      const ctrl1 = makeController();
      const ctrl2 = makeController();
      connections.addConnection("user-1", ctrl1);
      connections.addConnection("user-2", ctrl2);

      connections.broadcast("new_project", { id: "p1" });

      expect(ctrl1.enqueue).toHaveBeenCalledOnce();
      expect(ctrl2.enqueue).toHaveBeenCalledOnce();
    });

    it("encodes the correct SSE event format", () => {
      const ctrl = makeController();
      connections.addConnection("user-1", ctrl);

      connections.broadcast("new_project", { id: "p1" });

      const chunk = (ctrl.enqueue as ReturnType<typeof vi.fn>).mock.calls[0][0] as Uint8Array;
      const text = new TextDecoder().decode(chunk);
      expect(text).toContain("event: new_project");
      expect(text).toContain(`data: ${JSON.stringify({ id: "p1" })}`);
      expect(text).toMatch(/\n\n$/); // SSE double-newline terminator
    });

    it("does nothing when there are no connections", () => {
      expect(() => connections.broadcast("event", {})).not.toThrow();
    });

    it("skips a disconnected controller without throwing", () => {
      const ctrl = makeController();
      (ctrl.enqueue as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("stream closed");
      });
      connections.addConnection("user-1", ctrl);

      expect(() => connections.broadcast("ping", {})).not.toThrow();
    });
  });

  // ── sendToUser ────────────────────────────────────────────────────────────

  describe("sendToUser()", () => {
    it("sends only to the target user", () => {
      const ctrl1 = makeController();
      const ctrl2 = makeController();
      connections.addConnection("user-1", ctrl1);
      connections.addConnection("user-2", ctrl2);

      connections.sendToUser("user-1", "notification", { msg: "hi" });

      expect(ctrl1.enqueue).toHaveBeenCalledOnce();
      expect(ctrl2.enqueue).not.toHaveBeenCalled();
    });

    it("encodes the correct SSE event format", () => {
      const ctrl = makeController();
      connections.addConnection("user-1", ctrl);

      connections.sendToUser("user-1", "notification", { type: "new_comment" });

      const chunk = (ctrl.enqueue as ReturnType<typeof vi.fn>).mock.calls[0][0] as Uint8Array;
      const text = new TextDecoder().decode(chunk);
      expect(text).toContain("event: notification");
      expect(text).toContain(`data: ${JSON.stringify({ type: "new_comment" })}`);
    });

    it("is a no-op when the user has no connection", () => {
      expect(() => connections.sendToUser("nobody", "ping", {})).not.toThrow();
    });

    it("removes the connection when enqueue throws", () => {
      const ctrl = makeController();
      (ctrl.enqueue as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("stream closed");
      });
      connections.addConnection("user-1", ctrl);

      // Should not throw
      connections.sendToUser("user-1", "ping", {});

      // Connection should have been removed — subsequent broadcast won't reach it
      connections.broadcast("event", {});
      expect(ctrl.enqueue).toHaveBeenCalledTimes(1); // only the failed attempt
    });
  });
});
