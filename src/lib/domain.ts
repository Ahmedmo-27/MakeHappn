export const ROLES = ["owner", "leader", "member"] as const;
export type Role = (typeof ROLES)[number];

export const TASK_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "blocked",
  "done",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const BOARD_STATUSES = [
  "todo",
  "in_progress",
  "in_review",
  "blocked",
  "done",
] as const;
export type BoardStatus = (typeof BOARD_STATUSES)[number];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  blocked: "Blocked",
  done: "Done",
};

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

export function isBoardStatus(value: string): value is BoardStatus {
  return (BOARD_STATUSES as readonly string[]).includes(value);
}

export function roleLabel(role: Role): string {
  if (role === "owner") return "Owner";
  if (role === "leader") return "Team leader";
  return "Member";
}
