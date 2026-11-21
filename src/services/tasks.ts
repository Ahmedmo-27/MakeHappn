import { api } from "@/lib/api-client";
import type { AvailabilityStatus } from "@/lib/domain";

export interface ProjectTeam {
  id: string;
  name: string;
  leader: TeamPerson | null;
  members: TeamPerson[];
}

export interface TeamPerson {
  id: string;
  name: string;
  title: string;
  availability: AvailabilityStatus;
  availabilityNote: string;
  availabilityUpdatedAt: string | null;
}

export function listProjectBoardTasks(projectId: string) {
  return api<{
    tasks: Array<{ teamId: string; collaborators: any[]; [key: string]: any }>;
    projectTeams: ProjectTeam[];
  }>(`/projects/${projectId}/tasks`);
}

export function createProjectTask(input: { projectId: string } & Record<string, unknown>) {
  return api<any>(`/projects/${input.projectId}/tasks`, { body: input });
}

export function updateProjectTask(input: { taskId: string } & Record<string, unknown>) {
  return api<any>(`/tasks/${input.taskId}`, { method: "PATCH", body: input });
}

export function moveProjectTaskStatus(taskId: string, status: string, _actorId: string, reason?: string) {
  return api<any>(`/tasks/${taskId}/status`, { body: { status, reason } });
}

export function listProjectTaskComments(taskId: string) {
  return api<any[]>(`/tasks/${taskId}/comments`);
}

export function addProjectTaskComment(taskId: string, _authorId: string, body: string) {
  return api<any>(`/tasks/${taskId}/comments`, { body: { body } });
}
