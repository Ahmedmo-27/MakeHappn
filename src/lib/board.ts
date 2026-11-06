import type { BoardStatus } from "@/lib/domain";

export type BoardTask = {
  id: string;
  title: string;
  status: BoardStatus;
  assigneeId: string | null;
  assigneeName: string;
  dueDate: string | null;
  teamId: string;
  teamName: string;
  canDrag: boolean;
};
