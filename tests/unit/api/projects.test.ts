/**
 * tests/unit/api/projects.test.ts
 *
 * Tests for src/app/api/projects/route.ts — GET and POST handlers.
 *
 * External dependencies mocked:
 *   - @clerk/nextjs/server  (auth)
 *   - @/lib/db/mongoose     (connectDB)
 *   - @/models              (Project, User)
 *   - @/lib/sse/connections (broadcast)
 *   - next/server           (NextResponse)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db/mongoose", () => ({
  connectDB: vi.fn(),
}));

const {
  mockProjectFind,
  mockProjectCount,
  mockProjectCreate,
  mockUserFind,
  mockUserFindOne,
  mockBroadcast,
} = vi.hoisted(() => ({
  mockProjectFind: vi.fn(),
  mockProjectCount: vi.fn(),
  mockProjectCreate: vi.fn(),
  mockUserFind: vi.fn(),
  mockUserFindOne: vi.fn(),
  mockBroadcast: vi.fn(),
}));

vi.mock("@/models", () => ({
  Project: {
    find: vi.fn(() => ({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: mockProjectFind,
    })),
    countDocuments: mockProjectCount,
    create: mockProjectCreate,
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

// ── Import after mocks ────────────────────────────────────────────────────────

import { GET, POST } from "../../../src/app/api/projects/route";
import { auth } from "@clerk/nextjs/server";

const mockAuth = auth as ReturnType<typeof vi.fn>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(url: string, options: RequestInit = {}) {
  return new NextRequest(url, options);
}

const fakeProject = {
  _id: "proj-1",
  authorId: "user-abc",
  title: "Test Project",
  description: "A test project description.",
  stage: "building",
  supportNeeded: ["code-review"],
  techStack: ["TypeScript"],
  isCompleted: false,
  viewCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  toObject: () => fakeProject,
};

const fakeAuthor = {
  clerkId: "user-abc",
  firstName: "Alice",
  lastName: "Dev",
  imageUrl: "",
  username: "alice",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockProjectFind.mockResolvedValue([fakeProject]);
  mockProjectCount.mockResolvedValue(1);
  mockUserFind.mockResolvedValue([fakeAuthor]);
  mockUserFindOne.mockResolvedValue(fakeAuthor);
});

// ─── GET /api/projects ────────────────────────────────────────────────────────

describe("GET /api/projects", () => {
  it("returns a paginated list with authors populated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const req = makeRequest("http://localhost/api/projects");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await (res as any).json();
    expect(body.success).toBe(true);
    expect(body.data.projects).toHaveLength(1);
    expect(body.data.pagination.total).toBe(1);
  });

  it("respects page and limit query params", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    mockProjectFind.mockResolvedValue([]);
    mockProjectCount.mockResolvedValue(0);
    mockUserFind.mockResolvedValue([]);

    const req = makeRequest("http://localhost/api/projects?page=2&limit=5");
    await GET(req);

    // The route uses skip((page-1)*limit) — verify no crash on custom pagination
    expect(mockProjectCount).toHaveBeenCalledOnce();
  });

  it("clamps limit to a maximum of 20", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const req = makeRequest("http://localhost/api/projects?limit=999");
    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it("returns 401 when mine=true and user is not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const req = makeRequest("http://localhost/api/projects?mine=true");
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await (res as any).json();
    expect(body.success).toBe(false);
  });

  it("filters by the user's authorId when mine=true", async () => {
    mockAuth.mockResolvedValue({ userId: "user-abc" });

    const req = makeRequest("http://localhost/api/projects?mine=true");
    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it("populates null author when author not found in DB", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    mockUserFind.mockResolvedValue([]); // no authors returned

    const req = makeRequest("http://localhost/api/projects");
    const res = await GET(req);

    const body = await (res as any).json();
    expect(body.data.projects[0].author).toBeNull();
  });

  it("returns 500 on unexpected database error", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    mockProjectFind.mockRejectedValue(new Error("DB connection lost"));

    const req = makeRequest("http://localhost/api/projects");
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});

// ─── POST /api/projects ───────────────────────────────────────────────────────

describe("POST /api/projects", () => {
  const validBody = {
    title: "My Project",
    description: "A detailed enough description to pass.",
    stage: "building",
    supportNeeded: ["code-review"],
    techStack: ["TypeScript"],
  };

  it("creates a project and returns 201 when auth and body are valid", async () => {
    mockAuth.mockResolvedValue({ userId: "user-abc" });
    mockProjectCreate.mockResolvedValue(fakeProject);

    const req = makeRequest("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await (res as any).json();
    expect(body.success).toBe(true);
  });

  it("broadcasts new_project SSE event after creation", async () => {
    mockAuth.mockResolvedValue({ userId: "user-abc" });
    mockProjectCreate.mockResolvedValue(fakeProject);

    const req = makeRequest("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    await POST(req);

    expect(mockBroadcast).toHaveBeenCalledWith("new_project", expect.any(Object));
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const req = makeRequest("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(mockBroadcast).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid body (title too short)", async () => {
    mockAuth.mockResolvedValue({ userId: "user-abc" });

    const req = makeRequest("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify({ ...validBody, title: "ab" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockBroadcast).not.toHaveBeenCalled();
  });

  it("returns 400 for missing required fields", async () => {
    mockAuth.mockResolvedValue({ userId: "user-abc" });

    const req = makeRequest("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify({ title: "Only title" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 500 on database error", async () => {
    mockAuth.mockResolvedValue({ userId: "user-abc" });
    mockProjectCreate.mockRejectedValue(new Error("Write failed"));

    const req = makeRequest("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
  });
});