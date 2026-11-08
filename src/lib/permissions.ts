import type { Role, FunctionalRole } from "@/lib/domain";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  title?: string;
  isExecutive?: boolean;
  functionalRoles?: FunctionalRole[];
  laneIds?: string[];
  teamId: string | null;
};

// Legacy helper for Event backwards compatibility
export function canViewEvent(user: SessionUser, teamIds: string[]): boolean {
  if (user.role === "owner" || user.isExecutive) return true;
  if (!user.teamId && (!user.laneIds || user.laneIds.length === 0)) return false;
  const userTeams = [user.teamId, ...(user.laneIds ?? [])].filter(Boolean) as string[];
  return teamIds.some((id) => userTeams.includes(id));
}

// Project-Centric Access Control
export function canViewProject(
  user: SessionUser,
  project: {
    projectLeadId?: unknown;
    teamUserIds?: unknown[];
  },
): boolean {
  if (user.role === "owner" || user.isExecutive) return true;

  const leadIdStr = project.projectLeadId
    ? typeof project.projectLeadId === "object" && "_id" in (project.projectLeadId as Record<string, unknown>)
      ? String((project.projectLeadId as { _id: unknown })._id)
      : String(project.projectLeadId)
    : "";

  if (leadIdStr === user.id) return true;

  if (project.teamUserIds && Array.isArray(project.teamUserIds)) {
    const isMember = project.teamUserIds.some((member) => {
      const idStr = typeof member === "object" && member !== null && "_id" in member
        ? String((member as { _id: unknown })._id)
        : String(member);
      return idStr === user.id;
    });
    if (isMember) return true;
  }

  return false;
}

export function canManageProject(
  user: SessionUser,
  project: {
    projectLeadId?: unknown;
  },
): boolean {
  if (user.role === "owner" || user.isExecutive) return true;

  const leadIdStr = project.projectLeadId
    ? typeof project.projectLeadId === "object" && "_id" in (project.projectLeadId as Record<string, unknown>)
      ? String((project.projectLeadId as { _id: unknown })._id)
      : String(project.projectLeadId)
    : "";

  return leadIdStr === user.id;
}

export function canAssignAcrossLanes(
  user: SessionUser,
  project: {
    projectLeadId?: unknown;
  },
): boolean {
  return canManageProject(user, project);
}

export function canViewFinancials(
  user: SessionUser,
  project: {
    projectLeadId?: unknown;
  },
): boolean {
  if (user.role === "owner" || user.isExecutive) return true;
  if (user.functionalRoles?.includes("finance_operations")) return true;

  const leadIdStr = project.projectLeadId
    ? typeof project.projectLeadId === "object" && "_id" in (project.projectLeadId as Record<string, unknown>)
      ? String((project.projectLeadId as { _id: unknown })._id)
      : String(project.projectLeadId)
    : "";

  return leadIdStr === user.id;
}

export function canAssignTask(user: SessionUser, taskTeamId: string): boolean {
  if (user.role === "owner" || user.isExecutive) return true;
  return user.role === "leader" && user.teamId === taskTeamId;
}

export function canEditTask(user: SessionUser, taskTeamId: string): boolean {
  return canAssignTask(user, taskTeamId);
}

export function canChangeTaskStatus(
  user: SessionUser,
  task: { teamId: string; assigneeId: string | null },
): boolean {
  if (user.role === "owner" || user.isExecutive) return true;
  if (user.role === "leader" && user.teamId === task.teamId) return true;
  return user.role === "member" && task.assigneeId === user.id;
}

export function canCommentOnTask(
  user: SessionUser,
  taskTeamId: string,
  eventTeamIds: string[],
): boolean {
  if (!canViewEvent(user, eventTeamIds)) return false;
  if (user.role === "owner" || user.isExecutive) return true;
  return user.teamId === taskTeamId;
}

export function canViewPerformance(user: SessionUser): boolean {
  return user.role === "owner" || user.isExecutive || user.role === "leader";
}

export function visibleTeamId(user: SessionUser, requested?: string): string | null {
  if (user.role === "owner" || user.isExecutive) return requested || null;
  return user.teamId;
}
