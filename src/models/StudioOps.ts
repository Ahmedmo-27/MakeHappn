import mongoose, { type Model, Schema, type Types } from "mongoose";

export const PROPOSAL_STATUSES = [
  "draft",
  "internal_review",
  "sent",
  "under_discussion",
  "approved",
  "declined",
] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const MARKETING_KINDS = [
  "calendar",
  "content",
  "campaign",
  "case_study",
  "asset",
  "pr",
  "website",
] as const;
export type MarketingKind = (typeof MARKETING_KINDS)[number];

export const MARKETING_KIND_LABELS: Record<MarketingKind, string> = {
  calendar: "Marketing calendar",
  content: "Social content",
  campaign: "Campaign",
  case_study: "Case study",
  asset: "Brand asset",
  pr: "PR & partnerships",
  website: "Website & digital",
};

export interface IQuarterlyGoal {
  _id: Types.ObjectId;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  title: string;
  target: string;
  progress: number;
  ownerId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const quarterlyGoalSchema = new Schema<IQuarterlyGoal>(
  {
    year: { type: Number, required: true, index: true },
    quarter: { type: Number, required: true, min: 1, max: 4 },
    title: { type: String, required: true, trim: true },
    target: { type: String, default: "", trim: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

export const QuarterlyGoal: Model<IQuarterlyGoal> =
  (mongoose.models.QuarterlyGoal as Model<IQuarterlyGoal> | undefined) ??
  mongoose.model<IQuarterlyGoal>("QuarterlyGoal", quarterlyGoalSchema);

export interface IProposal {
  _id: Types.ObjectId;
  leadId: Types.ObjectId;
  title: string;
  scopeIncluded: string;
  scopeExcluded: string;
  assumptions: string;
  amount: number;
  paymentTerms: string;
  status: ProposalStatus;
  createdAt: Date;
  updatedAt: Date;
}

const proposalSchema = new Schema<IProposal>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    title: { type: String, required: true, trim: true },
    scopeIncluded: { type: String, default: "", trim: true },
    scopeExcluded: { type: String, default: "", trim: true },
    assumptions: { type: String, default: "", trim: true },
    amount: { type: Number, default: 0, min: 0 },
    paymentTerms: { type: String, default: "", trim: true },
    status: { type: String, enum: PROPOSAL_STATUSES, default: "draft", index: true },
  },
  { timestamps: true },
);

export const Proposal: Model<IProposal> =
  (mongoose.models.Proposal as Model<IProposal> | undefined) ??
  mongoose.model<IProposal>("Proposal", proposalSchema);

export interface IFollowUp {
  _id: Types.ObjectId;
  leadId?: Types.ObjectId | null;
  clientId?: Types.ObjectId | null;
  title: string;
  when: Date;
  notes: string;
  done: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const followUpSchema = new Schema<IFollowUp>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", default: null, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", default: null },
    title: { type: String, required: true, trim: true },
    when: { type: Date, required: true, index: true },
    notes: { type: String, default: "", trim: true },
    done: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const FollowUp: Model<IFollowUp> =
  (mongoose.models.FollowUp as Model<IFollowUp> | undefined) ??
  mongoose.model<IFollowUp>("FollowUp", followUpSchema);

export interface ISalesTarget {
  _id: Types.ObjectId;
  label: string;
  year: number;
  quarter: number;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const salesTargetSchema = new Schema<ISalesTarget>(
  {
    label: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    quarter: { type: Number, required: true, min: 1, max: 4 },
    amount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

export const SalesTarget: Model<ISalesTarget> =
  (mongoose.models.SalesTarget as Model<ISalesTarget> | undefined) ??
  mongoose.model<ISalesTarget>("SalesTarget", salesTargetSchema);

export interface IMarketingItem {
  _id: Types.ObjectId;
  kind: MarketingKind;
  title: string;
  channel: string;
  status: string;
  startsOn: Date | null;
  notes: string;
  metric: string;
  createdAt: Date;
  updatedAt: Date;
}

const marketingItemSchema = new Schema<IMarketingItem>(
  {
    kind: { type: String, enum: MARKETING_KINDS, required: true, index: true },
    title: { type: String, required: true, trim: true },
    channel: { type: String, default: "", trim: true },
    status: { type: String, default: "planned", trim: true },
    startsOn: { type: Date, default: null },
    notes: { type: String, default: "", trim: true },
    metric: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

export const MarketingItem: Model<IMarketingItem> =
  (mongoose.models.MarketingItem as Model<IMarketingItem> | undefined) ??
  mongoose.model<IMarketingItem>("MarketingItem", marketingItemSchema);

export interface IExpense {
  _id: Types.ObjectId;
  projectId?: Types.ObjectId | null;
  category: string;
  description: string;
  amount: number;
  incurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null, index: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    incurredAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

export const Expense: Model<IExpense> =
  (mongoose.models.Expense as Model<IExpense> | undefined) ??
  mongoose.model<IExpense>("Expense", expenseSchema);

export interface ILeaveRequest {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: "requested" | "approved" | "declined";
  createdAt: Date;
  updatedAt: Date;
}

const leaveRequestSchema = new Schema<ILeaveRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, default: "", trim: true },
    status: { type: String, enum: ["requested", "approved", "declined"], default: "requested" },
  },
  { timestamps: true },
);

export const LeaveRequest: Model<ILeaveRequest> =
  (mongoose.models.LeaveRequest as Model<ILeaveRequest> | undefined) ??
  mongoose.model<ILeaveRequest>("LeaveRequest", leaveRequestSchema);

export interface IPerformanceReview {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  period: string;
  kpiNotes: string;
  development: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

const performanceReviewSchema = new Schema<IPerformanceReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    period: { type: String, required: true, trim: true },
    kpiNotes: { type: String, default: "", trim: true },
    development: { type: String, default: "", trim: true },
    rating: { type: Number, default: 3, min: 1, max: 5 },
  },
  { timestamps: true },
);

export const PerformanceReview: Model<IPerformanceReview> =
  (mongoose.models.PerformanceReview as Model<IPerformanceReview> | undefined) ??
  mongoose.model<IPerformanceReview>("PerformanceReview", performanceReviewSchema);

export interface IProductionUpdate {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  area: "fabrication" | "installation" | "handover";
  percent: number;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

const productionUpdateSchema = new Schema<IProductionUpdate>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    area: { type: String, enum: ["fabrication", "installation", "handover"], required: true },
    percent: { type: Number, required: true, min: 0, max: 100 },
    note: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

export const ProductionUpdate: Model<IProductionUpdate> =
  (mongoose.models.ProductionUpdate as Model<IProductionUpdate> | undefined) ??
  mongoose.model<IProductionUpdate>("ProductionUpdate", productionUpdateSchema);

export interface IFounderDecision {
  _id: Types.ObjectId;
  title: string;
  context: string;
  status: "open" | "decided";
  outcome: string;
  createdAt: Date;
  updatedAt: Date;
}

const founderDecisionSchema = new Schema<IFounderDecision>(
  {
    title: { type: String, required: true, trim: true },
    context: { type: String, default: "", trim: true },
    status: { type: String, enum: ["open", "decided"], default: "open", index: true },
    outcome: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

export const FounderDecision: Model<IFounderDecision> =
  (mongoose.models.FounderDecision as Model<IFounderDecision> | undefined) ??
  mongoose.model<IFounderDecision>("FounderDecision", founderDecisionSchema);
