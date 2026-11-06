import type { Role } from "@/lib/domain";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  teamId: string | null;
};

export function canViewEvent(user: SessionUser, teamIds: string[]): boolean {
  if (user.role === "owner") return true;
  if (!user.teamId) return false;
  return teamIds.includes(user.teamId);
}

export function canAssignTask(user: SessionUser, taskTeamId: string): boolean {
  if (user.role === "owner") return true;
  return user.role === "leader" && user.teamId === taskTeamId;
}

export function canChangeTaskStatus(
  user: SessionUser,
  task: { teamId: string; assigneeId: string | null },
): boolean {
  if (user.role === "owner") return true;
  if (user.role === "leader" && user.teamId === task.teamId) return true;
  return user.role === "member" && task.assigneeId === user.id;
}

export function canCommentOnTask(
  user: SessionUser,
  taskTeamId: string,
  eventTeamIds: string[],
): boolean {
  if (!canViewEvent(user, eventTeamIds)) return false;
  if (user.role === "owner") return true;
  return user.teamId === taskTeamId;
}

export function canViewPerformance(user: SessionUser): boolean {
  return user.role === "owner" || user.role === "leader";
}

export function visibleTeamId(user: SessionUser, requested?: string): string | null {
  if (user.role === "owner") return requested || null;
  return user.teamId;
}
