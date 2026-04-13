/**
 * tests/unit/lib/response.test.ts
 *
 * Tests for src/lib/response/response.ts — ok() and fail() helpers.
 *
 * NextResponse.json is mocked so tests run outside of the Next.js runtime.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock next/server before importing the module under test ──────────────────
vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    })),
  },
}));

import { ok, fail } from "../../../src/lib/response/response";
import { NextResponse } from "next/server";

const mockJson = NextResponse.json as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockJson.mockClear();
});

// ─── ok() ────────────────────────────────────────────────────────────────────

describe("ok()", () => {
  it("calls NextResponse.json with success:true and the data", () => {
    const data = { id: "abc" };
    ok("test action", data);

    expect(mockJson).toHaveBeenCalledOnce();
    const [body, init] = mockJson.mock.calls[0];
    expect(body).toEqual({ success: true, data });
    expect(init.status).toBe(200);
  });

  it("uses the provided status code", () => {
    ok("create action", { id: "1" }, "user-123", 201);

    const [, init] = mockJson.mock.calls[0];
    expect(init.status).toBe(201);
  });

  it("defaults status to 200 when not provided", () => {
    ok("action");

    const [, init] = mockJson.mock.calls[0];
    expect(init.status).toBe(200);
  });

  it("includes undefined data when no data is passed", () => {
    ok("no-data action");

    const [body] = mockJson.mock.calls[0];
    expect(body.success).toBe(true);
    expect(body.data).toBeUndefined();
  });

  it("returns the value from NextResponse.json", () => {
    mockJson.mockReturnValueOnce({ body: { success: true }, status: 200 });
    const result = ok("action", { foo: "bar" });
    expect(result).toEqual({ body: { success: true }, status: 200 });
  });
});

// ─── fail() ──────────────────────────────────────────────────────────────────

describe("fail()", () => {
  it("calls NextResponse.json with success:false and the message", () => {
    fail("Something broke", "test action");

    expect(mockJson).toHaveBeenCalledOnce();
    const [body, init] = mockJson.mock.calls[0];
    expect(body).toEqual({ success: false, message: "Something broke" });
    expect(init.status).toBe(400);
  });

  it("uses the provided HTTP status code", () => {
    fail("Not found", "action", "user-1", 404);

    const [, init] = mockJson.mock.calls[0];
    expect(init.status).toBe(404);
  });

  it("defaults to 400 when status is not provided", () => {
    fail("Bad input", "action");

    const [, init] = mockJson.mock.calls[0];
    expect(init.status).toBe(400);
  });

  it("passes 401 for auth failures", () => {
    fail("Unauthorised", "GET /api/user", undefined, 401);

    const [body, init] = mockJson.mock.calls[0];
    expect(body.success).toBe(false);
    expect(init.status).toBe(401);
  });

  it("passes 403 for forbidden", () => {
    fail("Forbidden", "PATCH /api/projects/[id]", "user-1", 403);

    const [, init] = mockJson.mock.calls[0];
    expect(init.status).toBe(403);
  });

  it("passes 500 for server errors", () => {
    fail("Internal error", "POST /api/projects", undefined, 500);

    const [, init] = mockJson.mock.calls[0];
    expect(init.status).toBe(500);
  });
});
