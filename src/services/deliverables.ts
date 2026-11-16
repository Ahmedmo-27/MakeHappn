import type { DeliverableStatus } from "@/models/Deliverable";
import { api } from "@/lib/api-client";

export interface DeliverableRecord {
  _id: { toString(): string };
  status: DeliverableStatus;
  title: string;
  versions: any[];
  reviews: any[];
  [key: string]: any;
}

export function listDeliverables(projectId: string) {
  return api<DeliverableRecord[]>(`/projects/${projectId}/deliverables`);
}

export function createDeliverable(input: { projectId: string } & Record<string, unknown>) {
  return api<any>(`/projects/${input.projectId}/deliverables`, { body: input });
}

export function submitDeliverableReview(id: string, _reviewerId: string, reviewerRole: string, decision: string, feedback?: string) {
  return api<any>(`/deliverables/${id}/reviews`, { body: { reviewerRole, decision, feedback } });
}

export function submitDeliverableVersion(id: string, _submittedById: string, assetUrl?: string, notes?: string) {
  return api<any>(`/deliverables/${id}/versions`, { body: { assetUrl, notes } });
}

export function sendDeliverableToClient(id: string) {
  return api<any>(`/deliverables/${id}/send`);
}

export function markDeliverableFinal(id: string) {
  return api<any>(`/deliverables/${id}/final`);
}
