import mongoose, { type Model, Schema, type Types } from "mongoose";

export const CR_REASONS = [
  "client_scope_addition",
  "revision_limit_exceeded",
  "site_condition",
  "budget_adjustment",
] as const;
export type CRReason = (typeof CR_REASONS)[number];

export const CR_STATUSES = [
  "draft",
  "submitted",
  "client_approved",
  "client_rejected",
] as const;
export type CRStatus = (typeof CR_STATUSES)[number];

export interface IChangeRequest {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  deliverableId?: Types.ObjectId | null;
  code: string;
  title: string;
  reason: CRReason;
  description: string;
  clientRevenueDelta: number;
  internalCostDelta: number;
  timeDeltaDays: number;
  status: CRStatus;
  approvedById?: Types.ObjectId | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const changeRequestSchema = new Schema<IChangeRequest>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    deliverableId: { type: Schema.Types.ObjectId, ref: "Deliverable", default: null },
    code: { type: String, required: true, trim: true, uppercase: true },
    title: { type: String, required: true, trim: true },
    reason: { type: String, required: true, enum: CR_REASONS },
    description: { type: String, default: "", trim: true },
    clientRevenueDelta: { type: Number, default: 0 },
    internalCostDelta: { type: Number, default: 0 },
    timeDeltaDays: { type: Number, default: 0 },
    status: { type: String, required: true, enum: CR_STATUSES, default: "draft", index: true },
    approvedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

changeRequestSchema.index({ projectId: 1, code: 1 }, { unique: true });

export const ChangeRequest: Model<IChangeRequest> =
  (mongoose.models.ChangeRequest as Model<IChangeRequest> | undefined) ??
  mongoose.model<IChangeRequest>("ChangeRequest", changeRequestSchema);
