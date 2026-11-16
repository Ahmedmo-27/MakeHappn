import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { CostSheet, Engagement, ProjectTemplate, SupplierQuote } from "@/models/Planning";
import { Team } from "@/models/Team";
import { Task } from "@/models/Task";
import { Deliverable } from "@/models/Deliverable";
import { User } from "@/models/User";
import { PurchaseOrder } from "@/models/PurchaseOrder";

const oid = (id: string) => new Types.ObjectId(id);

export async function listQuotes(projectId: string) {
  await connectDB();
  return SupplierQuote.find({ projectId: oid(projectId) }).populate("collectiveMemberId", "name").lean();
}

export async function createQuote(input: { projectId: string; collectiveMemberId: string; description: string; amount: number }) {
  await connectDB();
  return SupplierQuote.create({ ...input, projectId: oid(input.projectId), collectiveMemberId: oid(input.collectiveMemberId) });
}

export async function selectQuote(quoteId: string) {
  await connectDB();
  const quote = await SupplierQuote.findById(quoteId);
  if (!quote) throw new Error("Quote not found");
  const count = await PurchaseOrder.countDocuments({ projectId: quote.projectId });
  const po = await PurchaseOrder.create({
    projectId: quote.projectId,
    poNumber: `PO-Q-${String(count + 1).padStart(2, "0")}`,
    collectiveMemberId: quote.collectiveMemberId,
    scopeDescription: quote.description,
    amount: quote.amount,
    billedAmount: 0,
    status: "issued",
    issuedAt: new Date(),
  });
  quote.selected = true;
  quote.purchaseOrderId = po._id;
  await quote.save();
  const { syncDerivedCosts } = await import("@/services/commercial");
  await syncDerivedCosts(String(quote.projectId));
  return { quote, purchaseOrder: po };
}

export async function getCostSheet(projectId: string) {
  await connectDB();
  return CostSheet.findOne({ projectId: oid(projectId) }).lean();
}

export async function saveCostSheet(projectId: string, lines: Array<{ label: string; category?: string; estimated?: number; committed?: number; actual?: number }>, locked?: boolean) {
  await connectDB();
  const existing = await CostSheet.findOne({ projectId: oid(projectId) });
  if (existing?.locked) throw new Error("This cost sheet is locked");
  return CostSheet.findOneAndUpdate(
    { projectId: oid(projectId) },
    { $set: { lines, ...(locked == null ? {} : { locked }) } },
    { upsert: true, new: true },
  );
}

export async function listEngagements(projectId?: string) {
  await connectDB();
  const query = projectId ? { projectId: oid(projectId) } : {};
  return Engagement.find(query).populate("collectiveMemberId", "name type").populate("projectId", "code name").lean();
}

export async function createEngagement(input: { projectId: string; collectiveMemberId: string; role: string; agreedFee?: number; status?: "proposed" | "confirmed" | "complete" }) {
  await connectDB();
  return Engagement.create({
    projectId: oid(input.projectId),
    collectiveMemberId: oid(input.collectiveMemberId),
    role: input.role.trim(),
    agreedFee: input.agreedFee ?? 0,
    status: input.status ?? "proposed",
  });
}

export async function listTemplates() {
  await connectDB();
  return ProjectTemplate.find().sort({ name: 1 }).lean();
}

export async function createTemplate(input: {
  name: string;
  product: string;
  bypassedStages?: string[];
  tasks?: Array<{ title: string; stage: string; laneName?: string; category?: string }>;
  deliverables?: Array<{ title: string; stage: string }>;
}) {
  await connectDB();
  return ProjectTemplate.create(input);
}

export async function applyTemplate(projectId: string, templateId: string, actorId: string) {
  await connectDB();
  const template = await ProjectTemplate.findById(templateId);
  if (!template) throw new Error("Template not found");
  const lanes = await Team.find().lean();
  const laneId = (name?: string) => lanes.find((lane) => lane.name === name)?._id ?? lanes[0]?._id;
  const owner = new Types.ObjectId(actorId);
  if (template.tasks.length && laneId()) {
    await Task.insertMany(
      template.tasks.map((task) => ({
        projectId: oid(projectId),
        stage: task.stage,
        teamId: laneId(task.laneName),
        accountableOwnerId: owner,
        assigneeId: owner,
        title: task.title,
        status: "todo",
        taskCategory: task.category || "deliverable_prerequisite",
        isGatePrerequisite: task.category !== "continuous_support",
      })),
    );
  }
  if (template.deliverables.length) {
    await Deliverable.insertMany(
      template.deliverables.map((item) => ({
        projectId: oid(projectId),
        stage: item.stage,
        title: item.title,
        status: "draft",
        currentVersion: 1,
        versions: [{ versionNumber: 1, notes: "From template", submittedById: owner, submittedAt: new Date() }],
      })),
    );
  }
  return { applied: template.name };
}

export async function memberEngagements(memberId: string) {
  await connectDB();
  return Engagement.find({ collectiveMemberId: oid(memberId) }).populate("projectId", "code name status").lean();
}

void User;
