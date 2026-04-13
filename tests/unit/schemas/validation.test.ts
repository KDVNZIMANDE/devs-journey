/**
 * tests/unit/schemas/validation.test.ts
 *
 * Tests for all Zod schemas: createProjectSchema, updateProjectSchema,
 * createMilestoneSchema, updateMilestoneSchema, createCommentSchema,
 * updateCommentSchema, createUserSchema, updateUserSchema.
 */

import { describe, it, expect } from "vitest";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../../../src/types/project";
import {
  createMilestoneSchema,
  updateMilestoneSchema,
} from "../../../src/types/milestone";
import {
  createCommentSchema,
  updateCommentSchema,
} from "../../../src/types/comment";
import {
  createUserSchema,
  updateUserSchema,
} from "../../../src/types/user";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function valid<T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T } }, value: unknown): T {
  const result = schema.safeParse(value);
  expect(result.success).toBe(true);
  return result.data as T;
}

function invalid(schema: { safeParse: (v: unknown) => { success: boolean } }, value: unknown) {
  const result = schema.safeParse(value);
  expect(result.success).toBe(false);
}

// ─── createProjectSchema ─────────────────────────────────────────────────────

const baseProject = {
  title: "My awesome project",
  description: "A description that is long enough to pass.",
  stage: "building" as const,
  supportNeeded: ["code-review" as const],
  techStack: ["TypeScript", "Next.js"],
};

describe("createProjectSchema", () => {
  it("accepts a valid minimal payload", () => {
    valid(createProjectSchema, baseProject);
  });

  it("accepts all optional fields", () => {
    valid(createProjectSchema, {
      ...baseProject,
      repoUrl: "https://github.com/user/repo",
      demoUrl: "https://demo.example.com",
      targetLaunchDate: new Date().toISOString(),
    });
  });

  it("accepts an empty string for repoUrl (optional cleared)", () => {
    valid(createProjectSchema, { ...baseProject, repoUrl: "" });
  });

  it("accepts an empty string for demoUrl", () => {
    valid(createProjectSchema, { ...baseProject, demoUrl: "" });
  });

  it("rejects title shorter than 3 chars", () => {
    invalid(createProjectSchema, { ...baseProject, title: "ab" });
  });

  it("rejects title longer than 100 chars", () => {
    invalid(createProjectSchema, { ...baseProject, title: "a".repeat(101) });
  });

  it("rejects description shorter than 10 chars", () => {
    invalid(createProjectSchema, { ...baseProject, description: "short" });
  });

  it("rejects description longer than 1000 chars", () => {
    invalid(createProjectSchema, { ...baseProject, description: "a".repeat(1001) });
  });

  it("rejects an invalid stage value", () => {
    invalid(createProjectSchema, { ...baseProject, stage: "shipped" });
  });

  it("accepts all valid stage values", () => {
    for (const stage of ["idea", "planning", "building", "testing", "launched"]) {
      valid(createProjectSchema, { ...baseProject, stage });
    }
  });

  it("rejects empty supportNeeded array", () => {
    invalid(createProjectSchema, { ...baseProject, supportNeeded: [] });
  });

  it("rejects an invalid supportNeeded value", () => {
    invalid(createProjectSchema, { ...baseProject, supportNeeded: ["mentoring"] });
  });

  it("accepts all valid supportNeeded values", () => {
    valid(createProjectSchema, {
      ...baseProject,
      supportNeeded: [
        "code-review",
        "design-feedback",
        "beta-testing",
        "accountability",
        "collaboration",
      ],
    });
  });

  it("rejects more than 10 techStack items", () => {
    invalid(createProjectSchema, {
      ...baseProject,
      techStack: Array.from({ length: 11 }, (_, i) => `tech${i}`),
    });
  });

  it("rejects a techStack item longer than 30 chars", () => {
    invalid(createProjectSchema, {
      ...baseProject,
      techStack: ["a".repeat(31)],
    });
  });

  it("rejects an invalid repoUrl", () => {
    invalid(createProjectSchema, { ...baseProject, repoUrl: "not-a-url" });
  });

  it("rejects an invalid demoUrl", () => {
    invalid(createProjectSchema, { ...baseProject, demoUrl: "not-a-url" });
  });

  it("rejects an invalid targetLaunchDate (not ISO 8601)", () => {
    invalid(createProjectSchema, { ...baseProject, targetLaunchDate: "tomorrow" });
  });

  it("defaults techStack to [] when omitted", () => {
    const result = valid(createProjectSchema, {
      title: "My project",
      description: "Long enough description here.",
      stage: "idea",
      supportNeeded: ["accountability"],
    });
    expect((result as { techStack: string[] }).techStack).toEqual([]);
  });
});

// ─── updateProjectSchema ─────────────────────────────────────────────────────

describe("updateProjectSchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    valid(updateProjectSchema, {});
  });

  it("accepts a partial update", () => {
    valid(updateProjectSchema, { title: "Updated title" });
  });

  it("still validates individual fields when provided", () => {
    invalid(updateProjectSchema, { title: "ab" }); // too short
  });

  it("rejects an invalid stage in a partial update", () => {
    invalid(updateProjectSchema, { stage: "released" });
  });
});

// ─── createMilestoneSchema ───────────────────────────────────────────────────

describe("createMilestoneSchema", () => {
  const baseMilestone = {
    projectId: "64f1a2b3c4d5e6f7a8b9c0d1",
    title: "First release",
  };

  it("accepts a valid milestone", () => {
    valid(createMilestoneSchema, baseMilestone);
  });

  it("accepts optional description", () => {
    valid(createMilestoneSchema, { ...baseMilestone, description: "Some context." });
  });

  it("rejects missing projectId", () => {
    invalid(createMilestoneSchema, { title: "First release" });
  });

  it("rejects empty projectId", () => {
    invalid(createMilestoneSchema, { ...baseMilestone, projectId: "" });
  });

  it("rejects title shorter than 3 chars", () => {
    invalid(createMilestoneSchema, { ...baseMilestone, title: "ab" });
  });

  it("rejects title longer than 100 chars", () => {
    invalid(createMilestoneSchema, { ...baseMilestone, title: "a".repeat(101) });
  });

  it("rejects description longer than 500 chars", () => {
    invalid(createMilestoneSchema, {
      ...baseMilestone,
      description: "a".repeat(501),
    });
  });
});

// ─── updateMilestoneSchema ───────────────────────────────────────────────────

describe("updateMilestoneSchema", () => {
  it("accepts an empty object", () => {
    valid(updateMilestoneSchema, {});
  });

  it("accepts a partial title update", () => {
    valid(updateMilestoneSchema, { title: "Updated" });
  });

  it("does NOT include projectId (omitted)", () => {
    // If projectId were accepted, safeParse would still succeed (Zod strips unknowns by default)
    // but the schema should not have a projectId field at all after omit.
    const result = updateMilestoneSchema.safeParse({ projectId: "abc", title: "Hi there" });
    expect(result.success).toBe(true);
    // projectId must be stripped
    expect((result.data as Record<string, unknown>).projectId).toBeUndefined();
  });

  it("rejects description longer than 500 chars", () => {
    invalid(updateMilestoneSchema, { description: "a".repeat(501) });
  });
});

// ─── createCommentSchema ─────────────────────────────────────────────────────

describe("createCommentSchema", () => {
  const baseComment = {
    projectId: "64f1a2b3c4d5e6f7a8b9c0d1",
    content: "Great project!",
  };

  it("accepts a valid comment", () => {
    valid(createCommentSchema, baseComment);
  });

  it("rejects missing projectId", () => {
    invalid(createCommentSchema, { content: "Hello" });
  });

  it("rejects empty content", () => {
    invalid(createCommentSchema, { ...baseComment, content: "" });
  });

  it("rejects content longer than 500 chars", () => {
    invalid(createCommentSchema, { ...baseComment, content: "a".repeat(501) });
  });

  it("accepts content at exactly 500 chars", () => {
    valid(createCommentSchema, { ...baseComment, content: "a".repeat(500) });
  });
});

// ─── updateCommentSchema ─────────────────────────────────────────────────────

describe("updateCommentSchema", () => {
  it("accepts valid content", () => {
    valid(updateCommentSchema, { content: "Updated comment" });
  });

  it("rejects empty content", () => {
    invalid(updateCommentSchema, { content: "" });
  });

  it("rejects content longer than 500 chars", () => {
    invalid(updateCommentSchema, { content: "x".repeat(501) });
  });
});

// ─── createUserSchema ────────────────────────────────────────────────────────

describe("createUserSchema", () => {
  const baseUser = {
    firstName: "Alice",
    lastName: "Dev",
    username: "alice_dev",
  };

  it("accepts a valid minimal user", () => {
    valid(createUserSchema, baseUser);
  });

  it("accepts all optional fields", () => {
    valid(createUserSchema, {
      ...baseUser,
      bio: "I build stuff.",
      githubUrl: "https://github.com/alice",
      portfolioUrl: "https://alice.dev",
      techStack: ["TypeScript", "React"],
      availableForCollab: false,
    });
  });

  it("accepts empty string for githubUrl", () => {
    valid(createUserSchema, { ...baseUser, githubUrl: "" });
  });

  it("rejects firstName shorter than 1 char", () => {
    invalid(createUserSchema, { ...baseUser, firstName: "" });
  });

  it("rejects firstName longer than 50 chars", () => {
    invalid(createUserSchema, { ...baseUser, firstName: "a".repeat(51) });
  });

  it("rejects username shorter than 2 chars", () => {
    invalid(createUserSchema, { ...baseUser, username: "a" });
  });

  it("rejects username longer than 30 chars", () => {
    invalid(createUserSchema, { ...baseUser, username: "a".repeat(31) });
  });

  it("rejects username with uppercase letters", () => {
    invalid(createUserSchema, { ...baseUser, username: "Alice" });
  });

  it("rejects username with spaces", () => {
    invalid(createUserSchema, { ...baseUser, username: "alice dev" });
  });

  it("accepts username with hyphens and underscores", () => {
    valid(createUserSchema, { ...baseUser, username: "alice-dev_42" });
  });

  it("rejects bio longer than 300 chars", () => {
    invalid(createUserSchema, { ...baseUser, bio: "a".repeat(301) });
  });

  it("rejects more than 15 techStack items", () => {
    invalid(createUserSchema, {
      ...baseUser,
      techStack: Array.from({ length: 16 }, (_, i) => `tech${i}`),
    });
  });

  it("rejects an invalid githubUrl", () => {
    invalid(createUserSchema, { ...baseUser, githubUrl: "github.com/alice" });
  });

  it("rejects an invalid portfolioUrl", () => {
    invalid(createUserSchema, { ...baseUser, portfolioUrl: "not-a-url" });
  });

  it("defaults availableForCollab to true", () => {
    const result = valid(createUserSchema, baseUser);
    expect((result as { availableForCollab: boolean }).availableForCollab).toBe(true);
  });
});

// ─── updateUserSchema ────────────────────────────────────────────────────────

describe("updateUserSchema", () => {
  it("accepts an empty object", () => {
    valid(updateUserSchema, {});
  });

  it("accepts a partial update", () => {
    valid(updateUserSchema, { bio: "New bio." });
  });

  it("still validates username format when provided", () => {
    invalid(updateUserSchema, { username: "UPPER_CASE" });
  });
});
