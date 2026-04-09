export type SSEEventType =
  | "new_project"
  | "project_updated"
  | "project_completed"
  | "new_milestone"
  | "new_comment"
  | "notification";

export type SSEEvent<T = unknown> = {
  type: SSEEventType;
  data: T;
};