import { api } from "@/lib/api-client";
import type { InquiryProduct, InquirySource, InquiryStatus, StudioCurrency } from "@/lib/domain";

export interface InquiryUserRef {
  _id: string;
  name: string;
  title?: string;
}

export interface InquiryRecord {
  _id: string;
  brandName: string;
  projectName: string;
  clientName: string;
  clientContact: string;
  product: InquiryProduct;
  source: InquirySource;
  scope: string[];
  deliveryDate?: string | null;
  budget: number;
  currency: StudioCurrency;
  location: string;
  notes: string;
  status: InquiryStatus;
  submittedById: string;
  submittedByName: string;
  callScheduledAt?: string | null;
  callNotes: string;
  projectLeadIds: InquiryUserRef[];
  decidedAt?: string | null;
  declineReason: string;
  convertedProjectId?: { _id: string; code: string; name: string } | null;
  createdAt: string;
}

export function listInquiries() {
  return api<InquiryRecord[]>("/inquiries");
}

export function getInquiry(id: string) {
  return api<InquiryRecord>(`/inquiries/${id}`);
}

export function createInquiry(input: unknown) {
  return api<InquiryRecord>("/inquiries", { body: input });
}

export function scheduleInquiryCall(id: string, callAt: string, notes: string) {
  return api<InquiryRecord>(`/inquiries/${id}/call`, { body: { callAt, notes } });
}

export function approveInquiry(id: string, projectLeadIds: string[]) {
  return api<InquiryRecord>(`/inquiries/${id}/approve`, { body: { projectLeadIds } });
}

export function assignInquiryLeads(id: string, projectLeadIds: string[]) {
  return api<InquiryRecord>(`/inquiries/${id}/leads`, { body: { projectLeadIds } });
}

export function declineInquiry(id: string, reason: string) {
  return api<{ inquiry: InquiryRecord; reporterNotified: boolean }>(`/inquiries/${id}/decline`, {
    body: { reason },
  });
}

export function startProjectPlanning(id: string, projectLeadIds: string[]) {
  return api<{ project: { _id: string; code: string }; emailsSent: number; emailsTotal: number }>(
    `/inquiries/${id}/start-planning`,
    { body: { projectLeadIds } },
  );
}

export function convertInquiryToProject(id: string) {
  return api<{ project: { _id: string; code: string }; emailsSent: number; emailsTotal: number }>(
    `/inquiries/${id}/convert`,
    { body: {} },
  );
}
