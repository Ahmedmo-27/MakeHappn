import type { AvailabilityStatus, ProjectStage, ProjectStatus, StudioProduct } from "@/lib/domain";
import { api } from "@/lib/api-client";

export type UpdateProjectInput = Record<string, unknown>;

export interface ProjectRecord {
  _id: { toString(): string };
  code: string;
  name: string;
  stage: ProjectStage;
  status: ProjectStatus;
  products: StudioProduct[];
  currency: string;
  milestones: Array<{ stage: ProjectStage; [key: string]: any }>;
  teamUserIds: any[];
  bypassedStages: ProjectStage[];
  clientId: any;
  projectLeadId: any;
  [key: string]: any;
}

export function listProjects(filter: Record<string, unknown> = {}) {
  return api<ProjectRecord[]>("/projects", { query: filter as never });
}

export function getProjectById(id: string) {
  return api<ProjectRecord | null>(`/projects/${id}`);
}

export function createProject(input: unknown) {
  return api<any>("/projects", { body: input });
}

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  profileImage: string;
  availability: AvailabilityStatus;
  availabilityNote: string;
  availabilityUpdatedAt: string | null;
  isLead: boolean;
}

export function getProjectTeam(projectId: string) {
  return api<{ members: TeamMember[]; candidates: TeamMember[] }>(`/projects/${projectId}/team`);
}

export function updateProjectSetup(projectId: string, input: Record<string, unknown>) {
  return api<any>(`/projects/${projectId}/setup`, { method: "PATCH", body: input });
}

export function updateProjectTimeline(projectId: string, input: Record<string, unknown>) {
  return api<unknown>(`/projects/${projectId}/setup/timeline`, { method: "PATCH", body: input });
}

export function updateProjectSetupDeliverables(projectId: string, phases: Array<{ name: string; deliverables: string }>) {
  return api<unknown>(`/projects/${projectId}/setup/deliverables`, { method: "PATCH", body: { phases } });
}

export function updateProjectKickoff(projectId: string, kickoffAt: string) {
  return api<unknown>(`/projects/${projectId}/setup/kickoff`, { method: "PATCH", body: { kickoffAt } });
}

export function getProjectCommunicationDetails(projectId: string) {
  return api<{
    name: string;
    code: string;
    brief: string;
    members: Array<{ name: string; email: string }>;
  }>(`/projects/${projectId}/communications`);
}

export function notifyProjectTeam(projectId: string) {
  return api<{ sentCount: number }>(`/projects/${projectId}/notify-team`);
}

export function addProjectMember(projectId: string, userId: string) {
  return api<{ ok: true }>(`/projects/${projectId}/members`, { body: { userId } });
}

export function removeProjectMember(projectId: string, userId: string) {
  return api<{ ok: true }>(`/projects/${projectId}/members/remove`, { body: { userId } });
}

export function getOwnAvailability() {
  return api<{ availability: AvailabilityStatus; availabilityNote: string }>("/me/availability");
}

export function setOwnAvailability(status: string, note: string) {
  return api<{ availability: AvailabilityStatus; availabilityNote: string }>("/me/availability", {
    body: { status, note },
  });
}

export function updateProject(projectId: string, input: unknown) {
  return api<any>(`/projects/${projectId}`, { method: "PATCH", body: input });
}

export function patchProjectFields(projectId: string, fields: unknown) {
  return api<any>(`/projects/${projectId}/fields`, { method: "PATCH", body: fields });
}

export function advanceProjectStage(projectId: string, targetStage: string, _actorId: string, notes?: string, override = false) {
  return api<any>(`/projects/${projectId}/stage`, { body: { targetStage, notes, override } });
}

export function updateProjectStatus(projectId: string, status: string, health?: string) {
  return api<any>(`/projects/${projectId}/status`, { body: { status, health } });
}

export function submitCloseoutAudit(input: { projectId: string } & Record<string, unknown>) {
  return api<any>(`/projects/${input.projectId}/closeout`, { body: input });
}

export function setMilestoneDates(projectId: string, dates: unknown) {
  return api<any>(`/projects/${projectId}/milestones`, { method: "PUT", body: { dates } });
}

export function listProjectActivity(projectId: string) {
  return api<any[]>(`/projects/${projectId}/activity`);
}
