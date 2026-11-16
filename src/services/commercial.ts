import type { StudioProduct } from "@/lib/domain";
import type { LeadStage } from "@/models/Lead";
import { api } from "@/lib/api-client";

export interface LeadRecord {
  _id: { toString(): string };
  stage: LeadStage;
  products: StudioProduct[];
  currency: string;
  companyName: string;
  clientName: string;
  estimatedValue: number;
  assignedLeadId: any;
  convertedProjectId: any;
  [key: string]: any;
}

export function listLeads(filter?: { stage?: string; assignedLeadId?: string }) {
  return api<LeadRecord[]>("/leads", { query: filter });
}

export function countLeadsAssignedTo(_userId: string) {
  return api<{ count: number }>("/leads/count").then((row) => row.count);
}

export function getLeadById(id: string) {
  return api<any>(`/leads/${id}`);
}

export function createLead(input: unknown) {
  return api<any>("/leads", { body: input });
}

export function updateLead(id: string, input: unknown) {
  return api<any>(`/leads/${id}`, { method: "PATCH", body: input });
}

export function updateLeadStage(leadId: string, stage: string) {
  return api<any>(`/leads/${leadId}/stage`, { body: { stage } });
}

export function updateLeadOwner(leadId: string, assignedLeadId: string) {
  return api<any>(`/leads/${leadId}/owner`, { body: { assignedLeadId } });
}

export function convertLeadToConfirmedProject(leadId: string, _actorId: string) {
  return api<any>(`/leads/${leadId}/convert`);
}

export function getProjectCommercials(projectId: string) {
  return api<{ project: any; purchaseOrders: any[]; supplierBills: any[]; invoices: any[]; financialSummary: any }>(`/projects/${projectId}/commercials`);
}

export function projectFinanceLists(projectId: string) {
  return api<{ invoices: any[]; purchaseOrders: any[] }>(`/projects/${projectId}/finance-lists`);
}

export function createPurchaseOrder(input: { projectId: string } & Record<string, unknown>) {
  return api<any>(`/projects/${input.projectId}/purchase-orders`, { body: input });
}

export function updatePurchaseOrder(id: string, input: unknown) {
  return api<any>(`/purchase-orders/${id}`, { method: "PATCH", body: input });
}

export function cancelPurchaseOrder(id: string) {
  return api<any>(`/purchase-orders/${id}/cancel`);
}

export function recordSupplierBill(input: { projectId: string } & Record<string, unknown>) {
  return api<any>(`/projects/${input.projectId}/bills`, { body: input });
}

export function markSupplierBillPaid(id: string) {
  return api<any>(`/bills/${id}/pay`);
}

export function createClientInvoice(input: { projectId: string } & Record<string, unknown>) {
  return api<any>(`/projects/${input.projectId}/invoices`, { body: input });
}

export function markInvoicePaid(invoiceId: string) {
  return api<any>(`/invoices/${invoiceId}/payments`, { body: {} });
}

export function recordInvoicePayment(invoiceId: string, amount: number) {
  return api<any>(`/invoices/${invoiceId}/payments`, { body: { amount } });
}

export function listProjectChangeRequests(projectId: string) {
  return api<Array<{ _id: { toString(): string }; status: "draft" | "submitted" | "client_approved" | "client_rejected"; reason: "client_scope_addition" | "revision_limit_exceeded" | "site_condition" | "budget_adjustment"; [key: string]: any }>>(`/projects/${projectId}/changes`);
}

export function createManualChangeRequest(input: { projectId: string } & Record<string, unknown>) {
  return api<any>(`/projects/${input.projectId}/changes`, { body: input });
}

export function submitChangeRequest(id: string) {
  return api<any>(`/changes/${id}/submit`);
}

export function approveChangeRequest(id: string, _actorId: string, approverName?: string, evidenceUrl?: string) {
  return api<any>(`/changes/${id}/approve`, { body: { approverName, evidenceUrl } });
}

export function rejectChangeRequest(id: string, _actorId: string, approverName?: string, evidenceUrl?: string) {
  return api<any>(`/changes/${id}/reject`, { body: { approverName, evidenceUrl } });
}
