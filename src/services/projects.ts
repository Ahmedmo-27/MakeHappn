import type { ProjectStage, ProjectStatus, StudioProduct } from "@/lib/domain";
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
