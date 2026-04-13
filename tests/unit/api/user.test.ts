/**
 * tests/unit/api/user.test.ts
 *
 * Tests for src/app/api/user/route.ts — GET, POST, PATCH handlers.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────────────

const {
  mockUpdateUserMetadata,
  mockGetUser,
  mockUserFindOne,
  mockUserFindOneAndUpdate,
  mockUserCreate,
} = vi.hoisted(() => ({
  mockUpdateUserMetadata: vi.fn(),
  mockGetUser: vi.fn(),
  mockUserFindOne: vi.fn(),
  mockUserFindOneAndUpdate: vi.fn(),
  mockUserCreate: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  clerkClient: vi.fn().mockResolvedValue({
    users: {
      getUser: mockGetUser,
      updateUserMetadata: mockUpdateUserMetadata,
    },
  }),
}));

vi.mock("@/lib/db/mongoose", () => ({ connectDB: vi.fn() }));

vi.mock("@/models", () => ({
  User: {
    findOne: vi.fn(() => ({ lean: mockUserFindOne })),
    findOneAndUpdate: vi.fn(() => ({ lean: mockUserFindOneAndUpdate })),
    create: mockUserCreate,
  },
}));

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    NextResponse: {
      json: vi.fn((body: unknown, init?: { status?: number }) => ({
        _body: body,
        status: init?.status ?? 200,
        json: async () => body,
      })),
    },
  };
});

import { GET, POST, PATCH } from "../../../src/app/api/user/route";
import { auth } from "@clerk/nextjs/server";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

// ── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID = "clerk-user-abc";

const fakeDbUser = {
  _id: "db-user-1",
  clerkId: USER_ID,
  email: "alice@example.com",
  firstName: "Alice",
  lastName: "Dev",
  username: "alice_dev",
  imageUrl: "",
  bio: "",
  techStack: [],
  availableForCollab: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  toObject: function () { return { ...this }; },
};

const fakeClerkUser = {
  primaryEmailAddressId: "email-1",
  emailAddresses: [{ id: "email-1", emailAddress: "alice@example.com" }],
};

const validCreateBody = {
  firstName: "Alice",
  lastName: "Dev",
  username: "alice_dev",
  bio: "Builder.",
  githubUrl: "https://github.com/alice",
  portfolioUrl: "",
  techStack: ["TypeScript"],
  availableForCollab: true,
};

function makeRequest(url: string, options: Omit<RequestInit, "signal"> & { signal?: AbortSignal } = {}) {
  return new NextRequest(url, options as ConstructorParameters<typeof NextRequest>[1]);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue(fakeClerkUser);
  mockUpdateUserMetadata.mockResolvedValue({});
});

// ─── GET /api/user ───────────────────────────────────────────────────────────

describe("GET /api/user", () => {
  it("returns the user profile when authenticated and found", async () => {
    mockAuth.mockResolvedValue({ userId: USER_ID });
    mockUserFindOne.mockResolvedValue(fakeDbUser);

    const res = await GET();

    expect(res.status).toBe(200);
    const body = await (res as { json: () => Promise<{ success: boolean; data: { clerkId: string } }> }).json();
    expect(body.success).toBe(true);
    expect(body.data.clerkId).toBe(USER_ID);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("returns 404 when user is not in MongoDB", async () => {
    mockAuth.mockResolvedValue({ userId: USER_ID });
    mockUserFindOne.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(404);
  });

  it("returns 500 on database error", async () => {
    mockAuth.mockResolvedValue({ userId: USER_ID });
    mockUserFindOne.mockRejectedValue(new Error("DB error"));

    const res = await GET();

    expect(res.status).toBe(500);
  });
});

// ─── POST /api/user ──────────────────────────────────────────────────────────

describe("POST /api/user", () => {
  it("creates a user and returns 201 on first registration", async () => {
    mockAuth.mockResolvedValue({ userId: USER_ID });
    // First findOne (existing check) returns null; second (username conflict) returns null
    mockUserFindOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockUserCreate.mockResolvedValue(fakeDbUser);

    const req = makeRequest("http://localhost/api/user", {
      method: "POST",
      body: JSON.stringify(validCreateBody),
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await (res as { json: () => Promise<{ success: boolean; data: { clerkId: string } }> }).json();
    expect(body.success).toBe(true);
  });

  it("sets onboarded=true in Clerk metadata after creation", async () => {
    mockAuth.mockResolvedValue({ userId: USER_ID });
    mockUserFindOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockUserCreate.mockResolvedValue(fakeDbUser);

    const req = makeRequest("http://localhost/api/user", {
      method: "POST",
      body: JSON.stringify(validCreateBody),
    });
    await POST(req);

    expect(mockUpdateUserMetadata).toHaveBeenCalledWith(USER_ID, {
      publicMetadata: { onboarded: true },
    });
  });

  it("returns 200 (idempotent) when user already exists", async () => {
    mockAuth.mockResolvedValue({ userId: USER_ID });
    mockUserFindOne.mockResolvedValue(fakeDbUser); // already exists

    const req = makeRequest("http://localhost/api/user", {
      method: "POST",
      body: JSON.stringify(validCreateBody),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it("returns 409 when username is already taken", async () => {
    mockAuth.mockResolvedValue({ userId: USER_ID });
    mockUserFindOne
      .mockResolvedValueOnce(null)       // no existing user for this clerkId
      .mockResolvedValueOnce(fakeDbUser); // username conflict

    const req = makeRequest("http://localhost/api/user", {
      method: "POST",
      body: JSON.stringify(validCreateBody),
    });
    const res = await POST(req);

    expect(res.status).toBe(409);
    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const req = makeRequest("http://localhost/api/user", {
      method: "POST",
      body: JSON.stringify(validCreateBody),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid username (uppercase)", async () => {
    mockAuth.mockResolvedValue({ userId: USER_ID });

    const req = makeRequest("http://localhost/api/user", {
      method: "POST",
      body: JSON.stringify({ ...validCreateBody, username: "Alice" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it("returns 400 when required fields are missing", async () => {
    mockAuth.mockResolvedValue({ userId: USER_ID });

    const req = makeRequest("http://localhost/api/user", {
      method: "POST",
      body: JSON.stringify({ firstName: "Alice" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("uses email from Clerk, not from request body", async () => {
    mockAuth.mockResolvedValue({ userId: USER_ID });
    mockUserFindOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockUserCreate.mockResolvedValue(fakeDbUser);

    const req = makeRequest("http://localhost/api/user", {
      method: "POST",
      body: JSON.stringify(validCreateBody),
    });
    await POST(req);

    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({ email: "alice@example.com" })
    );
  });

  it("returns 500 on database error", async () => {
    mockAuth.mockResolvedValue({ userId: USER_ID });
    mockUserFindOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockUserCreate.mockRejectedValue(new Error("Write failed"));

    const req = makeRequest("http://localhost/api/user", {
      method: "POST",
      body: JSON.stringify(validCreateBody),
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
  });
});

// ─── PATCH /api/user ─────────────────────────────────────────────────────────

describe("PATCH /api/user", () => {
  const patchBody = { bio: "Updated bio." };

  it("updates and returns the user when authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: USER_ID });
    mockUserFindOneAndUpdate.mockResolvedValue({ ...fakeDbUser, bio: "Updated bio." });

    const req = makeRequest("http://localhost/api/user", {
      method: "PATCH",
      body: JSON.stringify(patchBody),
    });
    const res = await PATCH(req);

    expect(res.status).toBe(200);
    const body = await (res as { json: () => Promise<{ success: boolean; data: { bio: string } }> }).json();
    expect(body.success).toBe(true);
    expect(body.data.bio).toBe("Updated bio.");
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const req = makeRequest("http://localhost/api/user", {
      method: "PATCH",
      body: JSON.stringify(patchBody),
    });
    const res = await PATCH(req);

    expect(res.status).toBe(401);
  });

  it("returns 404 when user is not found in MongoDB", async () => {
    mockAuth.mockResolvedValue({ userId: USER_ID });
    mockUserFindOneAndUpdate.mockResolvedValue(null);

    const req = makeRequest("http://localhost/api/user", {
      method: "PATCH",
      body: JSON.stringify(patchBody),
    });
    const res = await PATCH(req);

    expect(res.status).toBe(404);
  });

  it("returns 500 on database error", async () => {
    mockAuth.mockResolvedValue({ userId: USER_ID });
    mockUserFindOneAndUpdate.mockRejectedValue(new Error("DB error"));

    const req = makeRequest("http://localhost/api/user", {
      method: "PATCH",
      body: JSON.stringify(patchBody),
    });
    const res = await PATCH(req);

    expect(res.status).toBe(500);
  });
});