import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Project } from "@/models/Project";
import {
  RiskIssue,
  type IRiskIssue,
  type RiskCategory,
  type RiskSeverity,
  type RiskStatus,
} from "@/models/RiskIssue";

export async function listProjectRisks(projectId: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(projectId)) return [];

  return RiskIssue.find({ projectId: new Types.ObjectId(projectId) })
    .populate("ownerId", "name title")
    .sort({ createdAt: -1 })
    .lean();
}

export async function createRiskIssue(input: {
  projectId: string;
  title: string;
  category: RiskCategory;
  severity: RiskSeverity;
  ownerId: string;
  impactDescription: string;
  mitigationDecision?: string;
}): Promise<IRiskIssue> {
  await connectDB();
  const projObjId = new Types.ObjectId(input.projectId);

  const risk = await RiskIssue.create({
    projectId: projObjId,
    title: input.title.trim(),
    category: input.category,
    severity: input.severity,
    ownerId: new Types.ObjectId(input.ownerId),
    impactDescription: input.impactDescription.trim(),
    mitigationDecision: input.mitigationDecision?.trim() ?? "",
    status: "open",
  });

  // If severity is critical, flag project health
  if (input.severity === "critical") {
    await Project.findByIdAndUpdate(projObjId, { $set: { health: "at_risk" } });
  }

  return risk;
}

export async function resolveRiskIssue(
  riskId: string,
  resolutionNotes: string,
  status: RiskStatus = "resolved",
) {
  await connectDB();
  const risk = await RiskIssue.findById(riskId);
  if (!risk) throw new Error("Risk/Issue not found");

  risk.status = status;
  risk.resolutionNotes = resolutionNotes.trim();
  risk.resolvedAt = new Date();
  await risk.save();

  // Check if remaining open critical risks exist
  const openCritical = await RiskIssue.countDocuments({
    projectId: risk.projectId,
    severity: "critical",
    status: "open",
  });

  if (openCritical === 0) {
    await Project.findByIdAndUpdate(risk.projectId, { $set: { health: "on_track" } });
  }

  return risk;
}
