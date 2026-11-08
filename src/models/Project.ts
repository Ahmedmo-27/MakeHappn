import mongoose, { type Model, Schema, type Types } from "mongoose";
import {
  PROJECT_STAGES,
  PROJECT_STATUSES,
  STUDIO_PRODUCTS,
  NON_BYPASSABLE_STAGES,
  CURRENCIES,
  type ProjectStage,
  type ProjectStatus,
  type StudioProduct,
  type StudioCurrency,
} from "@/lib/domain";

export interface IProjectMilestone {
  stage: ProjectStage;
  targetDate?: Date | null;
  completedAt?: Date | null;
  isGateApproved: boolean;
  approvedById?: Types.ObjectId | null;
  approvalNotes?: string;
}

export interface ICloseoutChecklist {
  clientWalkthroughSigned: boolean;
  punchListCleared: boolean;
  postMortemCompleted: boolean;
  archiveDelivered: boolean;
  archivedAssetsUrl?: string;
  lessonsLearned?: string;
  closedById?: Types.ObjectId | null;
  closedAt?: Date | null;
}

export interface IProject {
  _id: Types.ObjectId;
  code: string;
  name: string;
  clientId: Types.ObjectId;
  projectLeadId: Types.ObjectId;
  products: StudioProduct[];
  stage: ProjectStage;
  bypassedStages: ProjectStage[];
  status: ProjectStatus;
  health: "on_track" | "at_risk" | "blocked";

  // Scope & Objectives
  brief: string;
  objectives: string;
  audience: string;
  location: string;
  startDate?: Date | null;
  deliveryDate?: Date | null;
  closeDate?: Date | null;
  isDelivered: boolean;

  // Commercials & Currency
  currency: StudioCurrency;
  quotedValue: number;
  approvedContractValue: number;
  contractedRevisionRounds: number;

  // Tri-Partite Financial Baseline
  estimatedTotalCost: number;
  committedTotalCost: number;
  actualTotalCost: number;

  // Milestone Gates & Matrix Staffing
  milestones: IProjectMilestone[];
  teamUserIds: Types.ObjectId[];

  // Stage 11 Closeout Audit
  closeoutChecklist?: ICloseoutChecklist;

  createdAt: Date;
  updatedAt: Date;
}

const milestoneSchema = new Schema<IProjectMilestone>(
  {
    stage: { type: String, required: true, enum: PROJECT_STAGES },
    targetDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    isGateApproved: { type: Boolean, default: false },
    approvedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    approvalNotes: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const closeoutChecklistSchema = new Schema<ICloseoutChecklist>(
  {
    clientWalkthroughSigned: { type: Boolean, default: false },
    punchListCleared: { type: Boolean, default: false },
    postMortemCompleted: { type: Boolean, default: false },
    archiveDelivered: { type: Boolean, default: false },
    archivedAssetsUrl: { type: String, default: "", trim: true },
    lessonsLearned: { type: String, default: "", trim: true },
    closedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    closedAt: { type: Date, default: null },
  },
  { _id: false },
);

const projectSchema = new Schema<IProject>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    projectLeadId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    products: [{ type: String, required: true, enum: STUDIO_PRODUCTS }],
    stage: {
      type: String,
      required: true,
      enum: PROJECT_STAGES,
      default: "01_lead_inquiry",
      index: true,
    },
    bypassedStages: [{ type: String, enum: PROJECT_STAGES }],
    status: {
      type: String,
      required: true,
      enum: PROJECT_STATUSES,
      default: "not_started",
      index: true,
    },
    health: {
      type: String,
      required: true,
      enum: ["on_track", "at_risk", "blocked"],
      default: "on_track",
    },

    brief: { type: String, default: "", trim: true },
    objectives: { type: String, default: "", trim: true },
    audience: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    startDate: { type: Date, default: null },
    deliveryDate: { type: Date, default: null },
    closeDate: { type: Date, default: null },
    isDelivered: { type: Boolean, default: false, index: true },

    currency: { type: String, enum: CURRENCIES, default: "USD" },
    quotedValue: { type: Number, default: 0, min: 0 },
    approvedContractValue: { type: Number, default: 0, min: 0 },
    contractedRevisionRounds: { type: Number, default: 2, min: 1 },

    estimatedTotalCost: { type: Number, default: 0, min: 0 },
    committedTotalCost: { type: Number, default: 0, min: 0 },
    actualTotalCost: { type: Number, default: 0, min: 0 },

    milestones: [milestoneSchema],
    teamUserIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    closeoutChecklist: { type: closeoutChecklistSchema, default: () => ({}) },
  },
  { timestamps: true },
);

// Pre-save validation: Ensure non-bypassable stages are never bypassed
projectSchema.pre("save", function () {
  if (this.bypassedStages && this.bypassedStages.length > 0) {
    const invalidBypasses = this.bypassedStages.filter((s) =>
      (NON_BYPASSABLE_STAGES as readonly string[]).includes(s),
    );
    if (invalidBypasses.length > 0) {
      throw new Error(`Cannot bypass mandatory governance stages: ${invalidBypasses.join(", ")}`);
    }
  }
});

projectSchema.index({ clientId: 1, status: 1 });
projectSchema.index({ stage: 1, status: 1 });
projectSchema.index({ projectLeadId: 1, status: 1 });

export const Project: Model<IProject> =
  (mongoose.models.Project as Model<IProject> | undefined) ??
  mongoose.model<IProject>("Project", projectSchema);
