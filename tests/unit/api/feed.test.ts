/**
 * tests/unit/api/feed.test.ts
 *
 * Tests for src/app/api/feed/route.ts — the SSE streaming endpoint.
 *
 * We verify auth gating, correct response headers, heartbeat emission,
 * and connection lifecycle (add/remove) without actually running timers.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));

const { mockAddConnection, mockRemoveConnection } = vi.hoisted(() => ({
  mockAddConnection: vi.fn(),
  mockRemoveConnection: vi.fn(),
}));

vi.mock("@/lib/sse/connections", () => ({
  addConnection: mockAddConnection,
  removeConnection: mockRemoveConnection,
}));

// Mock setInterval / clearInterval so keep-alive timer doesn't run in tests
vi.stubGlobal("setInterval", vi.fn(() => 999 as unknown as ReturnType<typeof setInterval>));
vi.stubGlobal("clearInterval", vi.fn());

import { GET } from "../../../src/app/api/feed/route";
import { auth } from "@clerk/nextjs/server";

const mockAuth = auth as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("GET /api/feed", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("returns a streaming response with correct SSE headers when authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });

    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("Cache-Control")).toBe("no-cache, no-transform");
    expect(res.headers.get("Connection")).toBe("keep-alive");
    expect(res.headers.get("X-Accel-Buffering")).toBe("no");
  });

  it("returns a ReadableStream body", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });

    const res = await GET();

    expect(res.body).toBeInstanceOf(ReadableStream);
  });

  it("registers the connection via addConnection on stream start", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });

    const res = await GET();

    // Consume one chunk from the stream to trigger the start() callback
    const reader = res.body!.getReader();
    await reader.read();
    reader.releaseLock();

    expect(mockAddConnection).toHaveBeenCalledWith("user-1", expect.any(Object));
  });

  it("sends a heartbeat comment as the first chunk", async () => {
    mockAuth.mockResolvedValue({ userId: "user-2" });

    const res = await GET();

    const reader = res.body!.getReader();
    const { value } = await reader.read();
    reader.releaseLock();

    const text = new TextDecoder().decode(value);
    expect(text).toBe(": heartbeat\n\n");
  });

  it("removes the connection when the stream is cancelled", async () => {
    mockAuth.mockResolvedValue({ userId: "user-3" });

    const res = await GET();

    const reader = res.body!.getReader();
    // Consume the heartbeat first so start() runs
    await reader.read();
    // Cancel the stream to trigger cancel()
    await reader.cancel();

    expect(mockRemoveConnection).toHaveBeenCalledWith("user-3");
  });

  it("sets up the keep-alive interval", async () => {
    mockAuth.mockResolvedValue({ userId: "user-4" });

    await GET();

    expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 60_000);
  });
});