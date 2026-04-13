/**
 * tests/unit/api/milestones.test.ts
 *
 * Tests for src/app/api/milestones/route.ts — GET and POST handlers.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/mongoose", () => ({ connectDB: vi.fn() }));

const {
  mockMilestoneFind,
  mockMilestoneCreate,
  mockProjectFindById,
  mockBroadcast,
} = vi.hoisted(() => ({
  mockMilestoneFind: vi.fn(),
  mockMilestoneCreate: vi.fn(),
  mockProjectFindById: vi.fn(),
  mockBroadcast: vi.fn(),
}));

vi.mock("@/models", () => ({
  Milestone: {
    find: vi.fn(() => ({
      sort: vi.fn().mockReturnThis(),
      lean: mockMilestoneFind,
    })),
    create: mockMilestoneCreate,
  },
  Project: {
    findById: mockProjectFindById,
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

import { GET, POST } from "../../../src/app/api/milestones/route";
import { auth } from "@clerk/nextjs/server";

const mockAuth = auth as ReturnType<typeof vi.fn>;

const PROJECT_ID = "64f1a2b3c4d5e6f7a8b9c0d1";
const AUTHOR_ID  = "clerk-author";

const fakeProject = {
  _id: PROJECT_ID,
  authorId: AUTHOR_ID,
  title: "My Project",
};

const fakeMilestone = {
  _id: "ms-1",
  projectId: PROJECT_ID,
  authorId: AUTHOR_ID,
  title: "Beta shipped",
  description: "First beta release.",
  createdAt: new Date().toISOString(),
  toObject: function () { return { ...this }; },
};

function makeRequest(url: string, options: RequestInit = {}) {
  return new NextRequest(url, options);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockMilestoneFind.mockResolvedValue([fakeMilestone]);
  mockProjectFindById.mockResolvedValue(fakeProject);
  mockMilestoneCreate.mockResolvedValue(fakeMilestone);
});

// ─── GET /api/milestones ──────────────────────────────────────────────────────

describe("GET /api/milestones", () => {
  it("returns milestones for a valid projectId", async () => {
    const req = makeRequest(`http://localhost/api/milestones?projectId=${PROJECT_ID}`);
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await (res as any).json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
  });

  it("returns 400 when projectId is missing", async () => {
    const req = makeRequest("http://localhost/api/milestones");
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await (res as any).json();
    expect(body.success).toBe(false);
  });

  it("returns an empty array when no milestones exist", async () => {
    mockMilestoneFind.mockResolvedValue([]);
    const req = makeRequest(`http://localhost/api/milestones?projectId=${PROJECT_ID}`);
    const res = await GET(req);

    const body = await (res as any).json();
    expect(body.data).toEqual([]);
  });

  it("returns 500 on database error", async () => {
    mockMilestoneFind.mockRejectedValue(new Error("DB error"));
    const req = makeRequest(`http://localhost/api/milestones?projectId=${PROJECT_ID}`);
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});

// ─── POST /api/milestones ─────────────────────────────────────────────────────

describe("POST /api/milestones", () => {
  const validBody = {
    projectId: PROJECT_ID,
    title: "Beta released",
    description: "Optional description.",
  };

  it("creates a milestone when the user is the project owner", async () => {
    mockAuth.mockResolvedValue({ userId: AUTHOR_ID });

    const req = makeRequest("http://localhost/api/milestones", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await (res as any).json();
    expect(body.success).toBe(true);
  });

  it("broadcasts new_milestone SSE event with projectTitle", async () => {
    mockAuth.mockResolvedValue({ userId: AUTHOR_ID });

    const req = makeRequest("http://localhost/api/milestones", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    await POST(req);

    expect(mockBroadcast).toHaveBeenCalledWith("new_milestone", {
      milestone: expect.any(Object),
      projectTitle: "My Project",
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const req = makeRequest("http://localhost/api/milestones", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(mockBroadcast).not.toHaveBeenCalled();
  });

  it("returns 403 when user is not the project owner", async () => {
    mockAuth.mockResolvedValue({ userId: "some-other-user" });

    const req = makeRequest("http://localhost/api/milestones", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockBroadcast).not.toHaveBeenCalled();
  });

  it("returns 404 when project does not exist", async () => {
    mockAuth.mockResolvedValue({ userId: AUTHOR_ID });
    mockProjectFindById.mockResolvedValue(null);

    const req = makeRequest("http://localhost/api/milestones", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);

    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid body (title too short)", async () => {
    mockAuth.mockResolvedValue({ userId: AUTHOR_ID });

    const req = makeRequest("http://localhost/api/milestones", {
      method: "POST",
      body: JSON.stringify({ ...validBody, title: "ab" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockBroadcast).not.toHaveBeenCalled();
  });

  it("returns 400 when projectId is missing", async () => {
    mockAuth.mockResolvedValue({ userId: AUTHOR_ID });

    const req = makeRequest("http://localhost/api/milestones", {
      method: "POST",
      body: JSON.stringify({ title: "Valid title" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 500 on database error", async () => {
    mockAuth.mockResolvedValue({ userId: AUTHOR_ID });
    mockMilestoneCreate.mockRejectedValue(new Error("Write failed"));

    const req = makeRequest("http://localhost/api/milestones", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
  });
});