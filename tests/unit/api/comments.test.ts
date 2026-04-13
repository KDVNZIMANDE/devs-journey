/**
 * tests/unit/api/comments.test.ts
 *
 * Tests for src/app/api/comments/route.ts — GET and POST handlers.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/mongoose", () => ({ connectDB: vi.fn() }));

const {
  mockCommentFind,
  mockCommentCreate,
  mockProjectFindById,
  mockUserFind,
  mockUserFindOne,
  mockBroadcast,
  mockSendToUser,
} = vi.hoisted(() => ({
  mockCommentFind: vi.fn(),
  mockCommentCreate: vi.fn(),
  mockProjectFindById: vi.fn(),
  mockUserFind: vi.fn(),
  mockUserFindOne: vi.fn(),
  mockBroadcast: vi.fn(),
  mockSendToUser: vi.fn(),
}));

vi.mock("@/models", () => ({
  Comment: {
    find: vi.fn(() => ({
      sort: vi.fn().mockReturnThis(),
      lean: mockCommentFind,
    })),
    create: mockCommentCreate,
  },
  Project: {
    findById: mockProjectFindById,
  },
  User: {
    find: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      lean: mockUserFind,
    })),
    findOne: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      lean: mockUserFindOne,
    })),
  },
}));

vi.mock("@/lib/sse/connections", () => ({
  broadcast: mockBroadcast,
  sendToUser: mockSendToUser,
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

import { GET, POST } from "../../../src/app/api/comments/route";
import { auth } from "@clerk/nextjs/server";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

// ── Fixtures ─────────────────────────────────────────────────────────────────

const PROJECT_ID  = "64f1a2b3c4d5e6f7a8b9c0d1";
const COMMENTER   = "clerk-commenter";
const OWNER       = "clerk-owner";

const fakeProject = { _id: PROJECT_ID, authorId: OWNER, title: "My Project" };

const fakeComment = {
  _id: "comment-1",
  projectId: PROJECT_ID,
  authorId: COMMENTER,
  content: "Looks great!",
  createdAt: new Date().toISOString(),
  toObject: function () { return { ...this }; },
};

const fakeAuthor = {
  clerkId: COMMENTER,
  firstName: "Bob",
  lastName: "Tester",
  imageUrl: "",
  username: "bob",
};

function makeRequest(url: string, options: Omit<RequestInit, "signal"> & { signal?: AbortSignal } = {}) {
  return new NextRequest(url, options as ConstructorParameters<typeof NextRequest>[1]);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCommentFind.mockResolvedValue([fakeComment]);
  mockUserFind.mockResolvedValue([fakeAuthor]);
  mockUserFindOne.mockResolvedValue(fakeAuthor);
  mockProjectFindById.mockResolvedValue(fakeProject);
  mockCommentCreate.mockResolvedValue(fakeComment);
});

// ─── GET /api/comments ───────────────────────────────────────────────────────

describe("GET /api/comments", () => {
  it("returns comments with authors for a valid projectId", async () => {
    const req = makeRequest(`http://localhost/api/comments?projectId=${PROJECT_ID}`);
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await (res as { json: () => Promise<{ success: boolean; data: Array<{ author: typeof fakeAuthor | null }> }> }).json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].author).toEqual(fakeAuthor);
  });

  it("returns 400 when projectId is missing", async () => {
    const req = makeRequest("http://localhost/api/comments");
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it("populates null author when author is not found", async () => {
    mockUserFind.mockResolvedValue([]);

    const req = makeRequest(`http://localhost/api/comments?projectId=${PROJECT_ID}`);
    const res = await GET(req);

    const body = await (res as { json: () => Promise<{ data: Array<{ author: typeof fakeAuthor | null }> }> }).json();
    expect(body.data[0].author).toBeNull();
  });

  it("returns an empty array when there are no comments", async () => {
    mockCommentFind.mockResolvedValue([]);
    mockUserFind.mockResolvedValue([]);

    const req = makeRequest(`http://localhost/api/comments?projectId=${PROJECT_ID}`);
    const res = await GET(req);

    const body = await (res as { json: () => Promise<{ data: unknown[] }> }).json();
    expect(body.data).toEqual([]);
  });

  it("returns 500 on database error", async () => {
    mockCommentFind.mockRejectedValue(new Error("DB error"));
    const req = makeRequest(`http://localhost/api/comments?projectId=${PROJECT_ID}`);
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});

// ─── POST /api/comments ──────────────────────────────────────────────────────

describe("POST /api/comments", () => {
  const validBody = { projectId: PROJECT_ID, content: "Great work!" };

  it("creates a comment and returns 201", async () => {
    mockAuth.mockResolvedValue({ userId: COMMENTER });

    const req = makeRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await (res as { json: () => Promise<{ success: boolean }> }).json();
    expect(body.success).toBe(true);
  });

  it("broadcasts new_comment to all clients", async () => {
    mockAuth.mockResolvedValue({ userId: COMMENTER });

    const req = makeRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    await POST(req);

    expect(mockBroadcast).toHaveBeenCalledWith("new_comment", expect.any(Object));
  });

  it("sends a notification to the project owner when commenter is different", async () => {
    mockAuth.mockResolvedValue({ userId: COMMENTER }); // commenter !== OWNER

    const req = makeRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    await POST(req);

    expect(mockSendToUser).toHaveBeenCalledWith(
      OWNER,
      "notification",
      expect.objectContaining({ type: "new_comment" })
    );
  });

  it("does NOT send a notification when the owner comments on their own project", async () => {
    mockAuth.mockResolvedValue({ userId: OWNER }); // same as project.authorId
    mockUserFindOne.mockResolvedValue({ ...fakeAuthor, clerkId: OWNER });

    const req = makeRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    await POST(req);

    expect(mockSendToUser).not.toHaveBeenCalled();
  });

  it("notification message includes commenter name and project title", async () => {
    mockAuth.mockResolvedValue({ userId: COMMENTER });

    const req = makeRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    await POST(req);

    const [, , notifPayload] = mockSendToUser.mock.calls[0];
    expect(notifPayload.message).toContain("Bob");
    expect(notifPayload.message).toContain("My Project");
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const req = makeRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(mockBroadcast).not.toHaveBeenCalled();
    expect(mockSendToUser).not.toHaveBeenCalled();
  });

  it("returns 400 for empty content", async () => {
    mockAuth.mockResolvedValue({ userId: COMMENTER });

    const req = makeRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify({ ...validBody, content: "" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockBroadcast).not.toHaveBeenCalled();
  });

  it("returns 400 for content exceeding 500 chars", async () => {
    mockAuth.mockResolvedValue({ userId: COMMENTER });

    const req = makeRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify({ ...validBody, content: "x".repeat(501) }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 404 when the project does not exist", async () => {
    mockAuth.mockResolvedValue({ userId: COMMENTER });
    mockProjectFindById.mockResolvedValue(null);

    const req = makeRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);

    expect(res.status).toBe(404);
  });

  it("returns 500 on database error", async () => {
    mockAuth.mockResolvedValue({ userId: COMMENTER });
    mockCommentCreate.mockRejectedValue(new Error("Write failed"));

    const req = makeRequest("http://localhost/api/comments", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
  });
});