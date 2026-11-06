import { TASK_STATUSES, type TaskStatus } from "@/lib/domain";

export type StatusCounts = Record<TaskStatus, number>;

export function emptyCounts(): StatusCounts {
  return {
    backlog: 0,
    todo: 0,
    in_progress: 0,
    in_review: 0,
    blocked: 0,
    done: 0,
  };
}

export function totalOf(counts: StatusCounts): number {
  return TASK_STATUSES.reduce((sum, status) => sum + counts[status], 0);
}

export function donePercent(counts: StatusCounts): number {
  const total = totalOf(counts);
  if (total === 0) return 0;
  return Math.round((counts.done / total) * 100);
}
