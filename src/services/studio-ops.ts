import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Client } from "@/models/Client";
import { CollectiveMember, type CollectiveType } from "@/models/CollectiveMember";
import { Invoice } from "@/models/Invoice";
import { Lead } from "@/models/Lead";
import { Project } from "@/models/Project";
import { PurchaseOrder } from "@/models/PurchaseOrder";
import { SupplierBill } from "@/models/SupplierBill";
import { Task } from "@/models/Task";
import { User } from "@/models/User";
import {
  Expense,
  FollowUp,
  FounderDecision,
  LeaveRequest,
  MarketingItem,
  PerformanceReview,
  ProductionUpdate,
  Proposal,
  QuarterlyGoal,
  SalesTarget,
  type MarketingKind,
  type ProposalStatus,
} from "@/models/StudioOps";

const oid = (id?: string | null) => (id ? new Types.ObjectId(id) : null);

export async function listGoals() {
  await connectDB();
  return QuarterlyGoal.find().sort({ year: -1, quarter: -1 }).lean();
}

export async function createGoal(input: {
  year: number;
  quarter: number;
  title: string;
  target: string;
  progress: number;
}) {
  await connectDB();
  const quarter = input.quarter;
  if (quarter !== 1 && quarter !== 2 && quarter !== 3 && quarter !== 4) {
    throw new Error("Quarter must be 1 to 4");
  }
  await QuarterlyGoal.create({ ...input, quarter });
}

export async function listDecisions() {
  await connectDB();
  return FounderDecision.find().sort({ status: 1, updatedAt: -1 }).lean();
}

export async function createDecision(title: string, context: string) {
  await connectDB();
  await FounderDecision.create({ title, context, status: "open" });
}

export async function decide(id: string, outcome: string) {
  await connectDB();
  await FounderDecision.findByIdAndUpdate(id, { status: "decided", outcome });
}

export async function listProposals() {
  await connectDB();
  return Proposal.find().populate("leadId", "companyName clientName stage").sort({ updatedAt: -1 }).lean();
}

export async function createProposal(input: {
  leadId: string;
  title: string;
  scopeIncluded: string;
  scopeExcluded: string;
  assumptions: string;
  amount: number;
  paymentTerms: string;
  status: ProposalStatus;
}) {
  await connectDB();
  if (!input.leadId) throw new Error("Choose a lead");
  await Proposal.create({ ...input, leadId: input.leadId });
}

export async function listFollowUps() {
  await connectDB();
  return FollowUp.find().populate("leadId", "companyName").sort({ when: 1 }).lean();
}

export async function createFollowUp(input: {
  leadId?: string;
  title: string;
  when: Date;
  notes: string;
}) {
  await connectDB();
  await FollowUp.create({
    leadId: oid(input.leadId),
    title: input.title,
    when: input.when,
    notes: input.notes,
  });
}

export async function completeFollowUp(id: string) {
  await connectDB();
  await FollowUp.findByIdAndUpdate(id, { done: true });
}

export async function listSalesTargets() {
  await connectDB();
  return SalesTarget.find().sort({ year: -1, quarter: -1 }).lean();
}

export async function createSalesTarget(input: { label: string; year: number; quarter: number; amount: number }) {
  await connectDB();
  await SalesTarget.create(input);
}

export async function listMarketing(kind?: MarketingKind) {
  await connectDB();
  const query = kind ? { kind } : {};
  return MarketingItem.find(query).sort({ startsOn: 1, createdAt: -1 }).lean();
}

export async function createMarketing(input: {
  kind: MarketingKind;
  title: string;
  channel: string;
  status: string;
  startsOn: Date | null;
  notes: string;
  metric: string;
}) {
  await connectDB();
  await MarketingItem.create(input);
}

export async function listExpenses() {
  await connectDB();
  return Expense.find().populate("projectId", "code name").sort({ incurredAt: -1 }).lean();
}

export async function createExpense(input: {
  projectId?: string;
  category: string;
  description: string;
  amount: number;
  incurredAt: Date;
}) {
  await connectDB();
  await Expense.create({ ...input, projectId: oid(input.projectId) });
}

export async function listLeave() {
  await connectDB();
  return LeaveRequest.find().populate("userId", "name title").sort({ startDate: -1 }).lean();
}

export async function createLeave(input: { userId: string; startDate: Date; endDate: Date; reason: string }) {
  await connectDB();
  await LeaveRequest.create(input);
}

export async function setLeaveStatus(id: string, status: "approved" | "declined") {
  await connectDB();
  await LeaveRequest.findByIdAndUpdate(id, { status });
}

export async function listReviews() {
  await connectDB();
  return PerformanceReview.find().populate("userId", "name title").sort({ createdAt: -1 }).lean();
}

export async function createReview(input: {
  userId: string;
  period: string;
  kpiNotes: string;
  development: string;
  rating: number;
}) {
  await connectDB();
  await PerformanceReview.create(input);
}

export async function listProduction(projectId?: string) {
  await connectDB();
  const query = projectId ? { projectId } : {};
  return ProductionUpdate.find(query).populate("projectId", "code name").sort({ updatedAt: -1 }).lean();
}

export async function createProduction(input: {
  projectId: string;
  area: "fabrication" | "installation" | "handover";
  percent: number;
  note: string;
}) {
  await connectDB();
  await ProductionUpdate.create(input);
}

export async function studioTasks() {
  await connectDB();
  return Task.find({ projectId: { $ne: null } })
    .populate("projectId", "code name")
    .populate("accountableOwnerId", "name")
    .populate("dependsOnTaskIds", "title status")
    .sort({ dueDate: 1 })
    .lean();
}

export async function linkTaskDependency(taskId: string, dependsOnId: string) {
  await connectDB();
  if (taskId === dependsOnId) throw new Error("A task cannot depend on itself");
  await Task.findByIdAndUpdate(taskId, { $addToSet: { dependsOnTaskIds: dependsOnId } });
}

export async function financeSnapshot() {
  await connectDB();
  const [invoices, bills, orders, projects, expenses] = await Promise.all([
    Invoice.find().populate("projectId", "code name currency").lean(),
    SupplierBill.find().populate("projectId", "code name").lean(),
    PurchaseOrder.find().populate("collectiveMemberId", "name").populate("projectId", "code name").lean(),
    Project.find().select("code name approvedContractValue quotedValue estimatedTotalCost committedTotalCost actualTotalCost currency status").lean(),
    Expense.find().lean(),
  ]);
  return { invoices, bills, orders, projects, expenses };
}

export async function clientAccounts() {
  await connectDB();
  const [clients, projects, leads] = await Promise.all([
    Client.find().sort({ name: 1 }).lean(),
    Project.find().select("name code clientId approvedContractValue status").lean(),
    Lead.find().select("companyName clientName stage estimatedValue convertedProjectId").lean(),
  ]);
  return { clients, projects, leads };
}

export async function allCollaborations() {
  await connectDB();
  return PurchaseOrder.find().populate("projectId", "code name").lean();
}

export async function memberHistory(memberId: string) {
  await connectDB();
  return PurchaseOrder.find({ collectiveMemberId: memberId })
    .populate("projectId", "code name")
    .sort({ createdAt: -1 })
    .lean();
}

export async function updateCollectiveProfile(input: {
  id: string;
  phone: string;
  rateAmount: number;
  rateUnit: string;
  commercialTerms: string;
  availability: string;
  pastWorkNotes: string;
  type: CollectiveType;
  status: "active" | "vetted" | "on_hold";
}) {
  await connectDB();
  await CollectiveMember.findByIdAndUpdate(input.id, {
    phone: input.phone,
    rateAmount: input.rateAmount,
    rateUnit: input.rateUnit,
    commercialTerms: input.commercialTerms,
    availability: input.availability,
    pastWorkNotes: input.pastWorkNotes,
    type: input.type,
    status: input.status,
  });
}

export async function rosterForOps() {
  await connectDB();
  return User.find({ isActive: { $ne: false } })
    .select("name title role reportsToId jobDescription weeklyCapacityHours teamId")
    .sort({ name: 1 })
    .lean();
}
