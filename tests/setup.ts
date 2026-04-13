// Global test setup
// Silence console.log / console.error noise from the ok() / fail() helpers
// while still letting tests assert on them if needed.
import { vi } from "vitest";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});
