import { api } from "@/lib/api-client";

export const listQuotes = (projectId: string) => api<any[]>(`/projects/${projectId}/quotes`);
export const createQuote = (input: { projectId: string } & Record<string, unknown>) => api(`/projects/${input.projectId}/quotes`, { body: input });
export const selectQuote = (id: string) => api(`/quotes/${id}/select`);
export const getCostSheet = (projectId: string) => api<any>(`/projects/${projectId}/cost-sheet`);
export const saveCostSheet = (projectId: string, lines: unknown, locked?: boolean) =>
  api(`/projects/${projectId}/cost-sheet`, { method: "PUT", body: { lines, locked } });
export const listEngagements = (projectId?: string) => api<any[]>("/engagements", { query: { projectId } });
export const createEngagement = (input: { projectId: string } & Record<string, unknown>) => api(`/projects/${input.projectId}/engagements`, { body: input });
export const listTemplates = () => api<any[]>("/templates");
export const createTemplate = (input: unknown) => api("/templates", { body: input });
export const applyTemplate = (projectId: string, templateId: string) => api(`/projects/${projectId}/templates/${templateId}`);
export const memberEngagements = (memberId: string) => api<any[]>(`/collective/${memberId}/engagements`);
