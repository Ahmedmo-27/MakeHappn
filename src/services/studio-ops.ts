import type { TaskStatus } from "@/lib/domain";
import type { MarketingKind } from "@/models/StudioOps";
import { api } from "@/lib/api-client";

export const listGoals = () => api<any[]>("/ops/goals");
export const createGoal = (input: unknown) => api("/ops/goals", { body: input });
export const listDecisions = () => api<any[]>("/ops/decisions");
export const createDecision = (title: string, context: string) => api("/ops/decisions", { body: { title, context } });
export const decide = (id: string, outcome: string) => api(`/ops/decisions/${id}`, { body: { outcome } });
export const listProposals = () => api<any[]>("/proposals");
export const createProposal = (input: unknown) => api("/proposals", { body: input });
export const setProposalStatus = (id: string, status: string) => api(`/proposals/${id}/status`, { body: { status } });
export const listFollowUps = () => api<any[]>("/ops/follow-ups");
export const createFollowUp = (input: unknown) => api("/ops/follow-ups", { body: input });
export const completeFollowUp = (id: string) => api(`/ops/follow-ups/${id}/complete`);
export const listSalesTargets = () => api<any[]>("/ops/targets");
export const createSalesTarget = (input: unknown) => api("/ops/targets", { body: input });
export const listMarketing = (kind?: string) => api<Array<{ _id: any; kind: MarketingKind; [key: string]: any }>>("/ops/marketing", { query: { kind } });
export const createMarketing = (input: unknown) => api("/ops/marketing", { body: input });
export const listExpenses = () => api<any[]>("/ops/expenses");
export const createExpense = (input: unknown) => api("/ops/expenses", { body: input });
export const listLeave = () => api<any[]>("/ops/leave");
export const createLeave = (input: unknown) => api("/ops/leave", { body: input });
export const setLeaveStatus = (id: string, status: "approved" | "declined") => api(`/ops/leave/${id}`, { body: { status } });
export const listReviews = () => api<any[]>("/ops/reviews");
export const createReview = (input: unknown) => api("/ops/reviews", { body: input });
export const listProduction = (projectId?: string) => api<any[]>("/ops/production", { query: { projectId } });
export const createProduction = (input: unknown) => api("/ops/production", { body: input });
export const studioTasks = () => api<Array<{ status: TaskStatus; [key: string]: any }>>("/ops/tasks");
export const linkTaskDependency = (taskId: string, dependsOnId: string) => api("/ops/dependencies", { body: { taskId, dependsOnId } });
export const financeSnapshot = () =>
  api<{ invoices: any[]; expenses: any[]; bills: any[]; orders: any[]; projects: any[] }>("/ops/finance");
export const clientAccounts = () =>
  api<{ clients: Array<{ _id: any; name?: string; brandName?: string; status?: string; industry?: string; paymentTermsDays?: number; contacts: any[] }>; projects: any[]; leads: any[] }>("/ops/clients");
export const allCollaborations = () => api<any[]>("/collective/collaborations");
export const rosterForOps = () => api<any[]>("/ops/roster");
export const updateCollectiveProfile = (input: { id: string } & Record<string, unknown>) =>
  api(`/collective/${input.id}`, { method: "PATCH", body: input });
