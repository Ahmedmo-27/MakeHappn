import mongoose, { type Model, Schema, type Types } from "mongoose";

export const RISK_SEVERITIES = ["critical", "high", "medium", "low"] as const;
export type RiskSeverity = (typeof RISK_SEVERITIES)[number];

export const RISK_CATEGORIES = [
  "timeline",
  "budget",
  "client_scope",
  "fabrication_supplier",
  "site_operations",
  "quality_craft",
] as const;
export type RiskCategory = (typeof RISK_CATEGORIES)[number];

export const RISK_STATUSES = ["open", "mitigated", "resolved"] as const;
export type RiskStatus = (typeof RISK_STATUSES)[number];

export const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  timeline: "Schedule & Deadlines",
  budget: "Cost & Budget Variance",
  client_scope: "Client Scope & Feedback",
  fabrication_supplier: "Fabrication & Suppliers",
  site_operations: "Site & Live Operations",
  quality_craft: "Craft & Quality Control",
};

export interface IRiskIssue {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  title: string;
  category: RiskCategory;
  severity: RiskSeverity;
  ownerId: Types.ObjectId;
  impactDescription: string;
  mitigationDecision?: string;
  resolutionNotes?: string;
  status: RiskStatus;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const riskIssueSchema = new Schema<IRiskIssue>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: RISK_CATEGORIES },
    severity: { type: String, required: true, enum: RISK_SEVERITIES, default: "medium", index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    impactDescription: { type: String, default: "", trim: true },
    mitigationDecision: { type: String, default: "", trim: true },
    resolutionNotes: { type: String, default: "", trim: true },
    status: { type: String, required: true, enum: RISK_STATUSES, default: "open", index: true },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

riskIssueSchema.index({ projectId: 1, severity: 1, status: 1 });

export const RiskIssue: Model<IRiskIssue> =
  (mongoose.models.RiskIssue as Model<IRiskIssue> | undefined) ??
  mongoose.model<IRiskIssue>("RiskIssue", riskIssueSchema);
