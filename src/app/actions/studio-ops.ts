"use server";

import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { field } from "@/lib/parse";
import { redirectWith } from "@/lib/redirect";
import { messageOf } from "@/lib/result";
import { getCurrentUser, requireOwner } from "@/lib/session";
import { MARKETING_KINDS, PROPOSAL_STATUSES, type MarketingKind, type ProposalStatus } from "@/models/StudioOps";
import { COLLECTIVE_TYPES, type CollectiveType } from "@/models/CollectiveMember";
import {
  completeFollowUp,
  createDecision,
  createExpense,
  createFollowUp,
  createGoal,
  createLeave,
  createMarketing,
  createProduction,
  createProposal,
  createReview,
  createSalesTarget,
  decide,
  linkTaskDependency,
  setLeaveStatus,
  updateCollectiveProfile,
} from "@/services/studio-ops";

function num(value: string, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function day(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Enter a valid date");
  return date;
}

export async function createGoalFormAction(formData: FormData) {
  try {
    await requireOwner();
    await createGoal({
      year: num(field(formData, "year"), new Date().getFullYear()),
      quarter: num(field(formData, "quarter"), 1),
      title: field(formData, "title"),
      target: field(formData, "target"),
      progress: num(field(formData, "progress")),
    });
    refresh();
    redirectWith("/dashboard?view=overview", { notice: "Quarterly goal saved" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith("/dashboard", { error: messageOf(error) });
  }
}

export async function createDecisionFormAction(formData: FormData) {
  try {
    await requireOwner();
    const title = field(formData, "title");
    if (!title) throw new Error("A decision needs a title");
    await createDecision(title, field(formData, "context"));
    refresh();
    redirectWith("/dashboard?view=overview", { notice: "Decision added to the founder queue" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith("/dashboard", { error: messageOf(error) });
  }
}

export async function decideFormAction(formData: FormData) {
  try {
    await requireOwner();
    await decide(field(formData, "id"), field(formData, "outcome") || "Decided");
    refresh();
    redirectWith("/dashboard?view=overview", { notice: "Decision recorded" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith("/dashboard", { error: messageOf(error) });
  }
}

export async function createProposalFormAction(formData: FormData) {
  try {
    await getCurrentUser();
    const status = field(formData, "status");
    if (!(PROPOSAL_STATUSES as readonly string[]).includes(status)) throw new Error("Choose a proposal status");
    const title = field(formData, "title");
    if (!title) throw new Error("Proposal title is required");
    await createProposal({
      leadId: field(formData, "leadId"),
      title,
      scopeIncluded: field(formData, "scopeIncluded"),
      scopeExcluded: field(formData, "scopeExcluded"),
      assumptions: field(formData, "assumptions"),
      amount: num(field(formData, "amount")),
      paymentTerms: field(formData, "paymentTerms"),
      status: status as ProposalStatus,
    });
    refresh();
    redirectWith("/sales", { notice: "Proposal recorded" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith("/sales", { error: messageOf(error) });
  }
}

export async function createFollowUpFormAction(formData: FormData) {
  try {
    await getCurrentUser();
    const title = field(formData, "title");
    if (!title) throw new Error("Follow-up needs a next action");
    await createFollowUp({
      leadId: field(formData, "leadId") || undefined,
      title,
      when: day(field(formData, "when")),
      notes: field(formData, "notes"),
    });
    refresh();
    redirectWith("/sales", { notice: "Follow-up scheduled" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith("/sales", { error: messageOf(error) });
  }
}

export async function completeFollowUpFormAction(formData: FormData) {
  try {
    await getCurrentUser();
    await completeFollowUp(field(formData, "id"));
    refresh();
    redirectWith("/sales", { notice: "Follow-up completed" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith("/sales", { error: messageOf(error) });
  }
}

export async function createSalesTargetFormAction(formData: FormData) {
  try {
    await requireOwner();
    await createSalesTarget({
      label: field(formData, "label") || "Quarter target",
      year: num(field(formData, "year"), new Date().getFullYear()),
      quarter: num(field(formData, "quarter"), 1),
      amount: num(field(formData, "amount")),
    });
    refresh();
    redirectWith("/sales", { notice: "Sales target saved" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith("/sales", { error: messageOf(error) });
  }
}

export async function createMarketingFormAction(formData: FormData) {
  try {
    await getCurrentUser();
    const kind = field(formData, "kind");
    if (!(MARKETING_KINDS as readonly string[]).includes(kind)) throw new Error("Choose a marketing type");
    const title = field(formData, "title");
    if (!title) throw new Error("Title is required");
    const starts = field(formData, "startsOn");
    await createMarketing({
      kind: kind as MarketingKind,
      title,
      channel: field(formData, "channel"),
      status: field(formData, "status") || "planned",
      startsOn: starts ? day(starts) : null,
      notes: field(formData, "notes"),
      metric: field(formData, "metric"),
    });
    refresh();
    redirectWith("/marketing", { notice: "Marketing item added" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith("/marketing", { error: messageOf(error) });
  }
}

export async function createExpenseFormAction(formData: FormData) {
  try {
    await getCurrentUser();
    const description = field(formData, "description");
    if (!description) throw new Error("Describe the expense");
    await createExpense({
      projectId: field(formData, "projectId") || undefined,
      category: field(formData, "category") || "General",
      description,
      amount: num(field(formData, "amount")),
      incurredAt: day(field(formData, "incurredAt")),
    });
    refresh();
    redirectWith("/finance", { notice: "Expense recorded" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith("/finance", { error: messageOf(error) });
  }
}

export async function linkDependencyFormAction(formData: FormData) {
  try {
    await getCurrentUser();
    await linkTaskDependency(field(formData, "taskId"), field(formData, "dependsOnId"));
    refresh();
    redirectWith("/tasks", { notice: "Dependency saved" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith("/tasks", { error: messageOf(error) });
  }
}

export async function createLeaveFormAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    const userId = field(formData, "userId") || user.id;
    if (user.role !== "owner" && userId !== user.id) throw new Error("You can only request your own leave");
    await createLeave({
      userId,
      startDate: day(field(formData, "startDate")),
      endDate: day(field(formData, "endDate")),
      reason: field(formData, "reason"),
    });
    refresh();
    const next = field(formData, "next") === "/tasks" ? "/tasks" : "/people";
    redirectWith(next, { notice: "Leave request sent" });
  } catch (error) {
    unstable_rethrow(error);
    const next = field(formData, "next") === "/tasks" ? "/tasks" : "/people";
    redirectWith(next, { error: messageOf(error) });
  }
}

export async function setLeaveFormAction(formData: FormData) {
  try {
    await requireOwner();
    const status = field(formData, "status");
    if (status !== "approved" && status !== "declined") throw new Error("Choose a decision");
    await setLeaveStatus(field(formData, "id"), status);
    refresh();
    redirectWith("/people", { notice: "Leave updated" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith("/people", { error: messageOf(error) });
  }
}

export async function createReviewFormAction(formData: FormData) {
  try {
    await requireOwner();
    await createReview({
      userId: field(formData, "userId"),
      period: field(formData, "period"),
      kpiNotes: field(formData, "kpiNotes"),
      development: field(formData, "development"),
      rating: num(field(formData, "rating"), 3),
    });
    refresh();
    redirectWith("/people", { notice: "Review saved" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith("/people", { error: messageOf(error) });
  }
}

export async function createProductionFormAction(formData: FormData) {
  try {
    await getCurrentUser();
    const area = field(formData, "area");
    if (area !== "fabrication" && area !== "installation" && area !== "handover") {
      throw new Error("Choose a production area");
    }
    await createProduction({
      projectId: field(formData, "projectId"),
      area,
      percent: num(field(formData, "percent")),
      note: field(formData, "note"),
    });
    refresh();
    redirectWith(`/projects/${field(formData, "projectId")}`, { notice: "Production progress saved" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith("/projects", { error: messageOf(error) });
  }
}

export async function updateCollectiveFormAction(formData: FormData) {
  try {
    await getCurrentUser();
    const type = field(formData, "type");
    if (!(COLLECTIVE_TYPES as readonly string[]).includes(type)) throw new Error("Choose a network type");
    const status = field(formData, "status");
    if (status !== "active" && status !== "vetted" && status !== "on_hold") throw new Error("Choose a status");
    await updateCollectiveProfile({
      id: field(formData, "id"),
      phone: field(formData, "phone"),
      rateAmount: num(field(formData, "rateAmount")),
      rateUnit: field(formData, "rateUnit") || "day",
      commercialTerms: field(formData, "commercialTerms"),
      availability: field(formData, "availability"),
      pastWorkNotes: field(formData, "pastWorkNotes"),
      type: type as CollectiveType,
      status,
    });
    refresh();
    redirectWith("/collective", { notice: "Network profile updated" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith("/collective", { error: messageOf(error) });
  }
}
