/**
 * tests/unit/api/projects-id.test.ts
 *
 * Tests for src/app/api/projects/[id]/route.ts — GET, PATCH, DELETE handlers.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/mongoose", () => ({ connectDB: vi.fn() }));

const {
  mockFindByIdAndUpdate,
  mockFindById,
  mockUserFindOne,
  mockBroadcast,
} = vi.hoisted(() => ({
  mockFindByIdAndUpdate: vi.fn(),
  mockFindById: vi.fn(),
  mockUserFindOne: vi.fn(),
  mockBroadcast: vi.fn(),
}));

vi.mock("@/models", () => ({
  Project: {
    findByIdAndUpdate: mockFindByIdAndUpdate,
    findById: mockFindById,
  },
  User: {
    findOne: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      lean: mockUserFindOne,
    })),
  },
}));

vi.mock("@/lib/sse/connections", () => ({ broadcast: mockBroadcast }));

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

import { GET, PATCH, DELETE } from "../../../src/app/api/projects/[id]/route";
import { auth } from "@clerk/nextjs/server";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

// ── Fixtures ─────────────────────────────────────────────────────────────────

const PROJECT_ID = "64f1a2b3c4d5e6f7a8b9c0d1";
const AUTHOR_ID  = "clerk-user-abc";

const fakeProjectLean = {
  _id: PROJECT_ID,
  authorId: AUTHOR_ID,
  title: "Test Project",
  description: "Long enough description.",
  stage: "building",
  supportNeeded: ["code-review"],
  techStack: [],
  isCompleted: false,
  completedAt: null as Date | null,
  viewCount: 5,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mongoose document mock (has .save(), .toObject())
function makeProjectDoc(overrides = {}) {
  const doc = {
    ...fakeProjectLean,
    ...overrides,
    save: vi.fn().mockResolvedValue(undefined),
    toObject: function () { return { ...this }; },
  };
  return doc;
}

const fakeAuthor = {
  clerkId: AUTHOR_ID,
  firstName: "Alice",
  lastName: "Dev",
  imageUrl: "",
  username: "alice",
};

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(url: string, options: Omit<RequestInit, "signal"> & { signal?: AbortSignal } = {}) {
  return new NextRequest(url, options as ConstructorParameters<typeof NextRequest>[1]);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUserFindOne.mockResolvedValue(fakeAuthor);
});

// ─── GET /api/projects/[id] ──────────────────────────────────────────────────

describe("GET /api/projects/[id]", () => {
  it("returns the project with author populated", async () => {
    mockFindByIdAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue(fakeProjectLean),
    });

    const res = await GET(
      makeRequest(`http://localhost/api/projects/${PROJECT_ID}`),
      makeParams(PROJECT_ID)
    );

    expect(res.status).toBe(200);
    const body = await (res as { json: () => Promise<{ success: boolean; data: { _id: string; author: typeof fakeAuthor } }> }).json();
    expect(body.success).toBe(true);
    expect(body.data._id).toBe(PROJECT_ID);
    expect(body.data.author).toEqual(fakeAuthor);
  });

  it("increments viewCount via $inc", async () => {
    mockFindByIdAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue(fakeProjectLean),
    });

    await GET(
      makeRequest(`http://localhost/api/projects/${PROJECT_ID}`),
      makeParams(PROJECT_ID)
    );

    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      PROJECT_ID,
      { $inc: { viewCount: 1 } },
      { new: true }
    );
  });

  it("returns 404 when project does not exist", async () => {
    mockFindByIdAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });

    const res = await GET(
      makeRequest(`http://localhost/api/projects/${PROJECT_ID}`),
      makeParams(PROJECT_ID)
    );

    expect(res.status).toBe(404);
    const body = await (res as { json: () => Promise<{ success: boolean }> }).json();
    expect(body.success).toBe(false);
  });

  it("returns 500 on database error", async () => {
    mockFindByIdAndUpdate.mockReturnValue({
      lean: vi.fn().mockRejectedValue(new Error("DB down")),
    });

    const res = await GET(
      makeRequest(`http://localhost/api/projects/${PROJECT_ID}`),
      makeParams(PROJECT_ID)
    );

    expect(res.status).toBe(500);
  });
});

// ─── PATCH /api/projects/[id] ────────────────────────────────────────────────

describe("PATCH /api/projects/[id]", () => {
  const validPatch = { title: "Updated Title" };

  it("updates the project when the authenticated user is the owner", async () => {
    mockAuth.mockResolvedValue({ userId: AUTHOR_ID });
    const doc = makeProjectDoc();
    mockFindById.mockResolvedValue(doc);

    const req = makeRequest(`http://localhost/api/projects/${PROJECT_ID}`, {
      method: "PATCH",
      body: JSON.stringify(validPatch),
    });
    const res = await PATCH(req, makeParams(PROJECT_ID));

    expect(res.status).toBe(200);
    expect(doc.save).toHaveBeenCalledOnce();
    expect(mockBroadcast).toHaveBeenCalledWith("project_updated", expect.any(Object));
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const req = makeRequest(`http://localhost/api/projects/${PROJECT_ID}`, {
      method: "PATCH",
      body: JSON.stringify(validPatch),
    });
    const res = await PATCH(req, makeParams(PROJECT_ID));

    expect(res.status).toBe(401);
    expect(mockBroadcast).not.toHaveBeenCalled();
  });

  it("returns 403 when the user is not the project owner", async () => {
    mockAuth.mockResolvedValue({ userId: "other-user" });
    mockFindById.mockResolvedValue(makeProjectDoc()); // authorId is AUTHOR_ID

    const req = makeRequest(`http://localhost/api/projects/${PROJECT_ID}`, {
      method: "PATCH",
      body: JSON.stringify(validPatch),
    });
    const res = await PATCH(req, makeParams(PROJECT_ID));

    expect(res.status).toBe(403);
    expect(mockBroadcast).not.toHaveBeenCalled();
  });

  it("returns 404 when project does not exist", async () => {
    mockAuth.mockResolvedValue({ userId: AUTHOR_ID });
    mockFindById.mockResolvedValue(null);

    const req = makeRequest(`http://localhost/api/projects/${PROJECT_ID}`, {
      method: "PATCH",
      body: JSON.stringify(validPatch),
    });
    const res = await PATCH(req, makeParams(PROJECT_ID));

    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid body", async () => {
    mockAuth.mockResolvedValue({ userId: AUTHOR_ID });

    const req = makeRequest(`http://localhost/api/projects/${PROJECT_ID}`, {
      method: "PATCH",
      body: JSON.stringify({ stage: "invalid-stage" }),
    });
    const res = await PATCH(req, makeParams(PROJECT_ID));

    expect(res.status).toBe(400);
    expect(mockBroadcast).not.toHaveBeenCalled();
  });

  it("returns 500 on database error", async () => {
    mockAuth.mockResolvedValue({ userId: AUTHOR_ID });
    mockFindById.mockRejectedValue(new Error("DB error"));

    const req = makeRequest(`http://localhost/api/projects/${PROJECT_ID}`, {
      method: "PATCH",
      body: JSON.stringify(validPatch),
    });
    const res = await PATCH(req, makeParams(PROJECT_ID));

    expect(res.status).toBe(500);
  });
});

// ─── DELETE /api/projects/[id] ───────────────────────────────────────────────

describe("DELETE /api/projects/[id]", () => {
  it("marks the project as completed when the user is the owner", async () => {
    mockAuth.mockResolvedValue({ userId: AUTHOR_ID });
    const doc = makeProjectDoc({ isCompleted: false });
    mockFindById.mockResolvedValue(doc);

    const req = makeRequest(`http://localhost/api/projects/${PROJECT_ID}`, {
      method: "DELETE",
    });
    const res = await DELETE(req, makeParams(PROJECT_ID));

    expect(res.status).toBe(200);
    expect(doc.isCompleted).toBe(true);
    expect(doc.stage).toBe("launched");
    expect(doc.completedAt).toBeInstanceOf(Date);
    expect(doc.save).toHaveBeenCalledOnce();
    expect(mockBroadcast).toHaveBeenCalledWith("project_completed", expect.any(Object));
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const req = makeRequest(`http://localhost/api/projects/${PROJECT_ID}`, {
      method: "DELETE",
    });
    const res = await DELETE(req, makeParams(PROJECT_ID));

    expect(res.status).toBe(401);
    expect(mockBroadcast).not.toHaveBeenCalled();
  });

  it("returns 403 when the user is not the owner", async () => {
    mockAuth.mockResolvedValue({ userId: "not-the-owner" });
    mockFindById.mockResolvedValue(makeProjectDoc());

    const req = makeRequest(`http://localhost/api/projects/${PROJECT_ID}`, {
      method: "DELETE",
    });
    const res = await DELETE(req, makeParams(PROJECT_ID));

    expect(res.status).toBe(403);
    expect(mockBroadcast).not.toHaveBeenCalled();
  });

  it("returns 404 when project is not found", async () => {
    mockAuth.mockResolvedValue({ userId: AUTHOR_ID });
    mockFindById.mockResolvedValue(null);

    const req = makeRequest(`http://localhost/api/projects/${PROJECT_ID}`, {
      method: "DELETE",
    });
    const res = await DELETE(req, makeParams(PROJECT_ID));

    expect(res.status).toBe(404);
  });

  it("returns 500 on database error", async () => {
    mockAuth.mockResolvedValue({ userId: AUTHOR_ID });
    mockFindById.mockRejectedValue(new Error("DB crash"));

    const req = makeRequest(`http://localhost/api/projects/${PROJECT_ID}`, {
      method: "DELETE",
    });
    const res = await DELETE(req, makeParams(PROJECT_ID));

    expect(res.status).toBe(500);
  });
});