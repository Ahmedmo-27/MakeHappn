import type { RiskCategory, RiskSeverity } from "@/models/RiskIssue";
import { api } from "@/lib/api-client";

export interface RiskRecord {
  _id: { toString(): string };
  severity: RiskSeverity;
  category: RiskCategory;
  status: string;
  [key: string]: any;
}

export function listProjectRisks(projectId: string) {
  return api<RiskRecord[]>(`/projects/${projectId}/risks`);
}

export function createRiskIssue(input: { projectId: string } & Record<string, unknown>) {
  return api<any>(`/projects/${input.projectId}/risks`, { body: input });
}

export function resolveRiskIssue(id: string, resolution: string, _actorId: string) {
  return api<any>(`/risks/${id}/resolve`, { body: { resolution } });
}
