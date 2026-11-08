import mongoose, { type Model, Schema, type Types } from "mongoose";
import { PROJECT_STAGES, type ProjectStage } from "@/lib/domain";

export const DELIVERABLE_STATUSES = [
  "draft",
  "internal_review",
  "sent_to_client",
  "revision_required",
  "approved",
  "final",
] as const;
export type DeliverableStatus = (typeof DELIVERABLE_STATUSES)[number];

export const DELIVERABLE_STATUS_LABELS: Record<DeliverableStatus, string> = {
  draft: "Draft",
  internal_review: "Internal Review",
  sent_to_client: "Sent to Client",
  revision_required: "Revision Required",
  approved: "Client Approved",
  final: "Final Production",
};

export interface IDeliverableVersion {
  versionNumber: number;
  assetUrl?: string;
  notes?: string;
  submittedById: Types.ObjectId;
  submittedAt: Date;
}

export interface IDeliverableReview {
  versionNumber: number;
  reviewerId: Types.ObjectId;
  reviewerRole: "craft_lead" | "project_lead" | "executive" | "client";
  decision: "approved" | "revision_required";
  feedback?: string;
  reviewedAt: Date;
}

export interface IDeliverable {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  stage: ProjectStage;
  title: string;
  description: string;
  status: DeliverableStatus;
  currentVersion: number;
  revisionRound: number;
  changeRequestId?: Types.ObjectId | null;
  versions: IDeliverableVersion[];
  reviews: IDeliverableReview[];
  createdAt: Date;
  updatedAt: Date;
}

const versionSchema = new Schema<IDeliverableVersion>(
  {
    versionNumber: { type: Number, required: true },
    assetUrl: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    submittedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const reviewSchema = new Schema<IDeliverableReview>(
  {
    versionNumber: { type: Number, required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviewerRole: {
      type: String,
      required: true,
      enum: ["craft_lead", "project_lead", "executive", "client"],
    },
    decision: { type: String, required: true, enum: ["approved", "revision_required"] },
    feedback: { type: String, default: "", trim: true },
    reviewedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const deliverableSchema = new Schema<IDeliverable>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    stage: { type: String, required: true, enum: PROJECT_STAGES, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    status: {
      type: String,
      required: true,
      enum: DELIVERABLE_STATUSES,
      default: "draft",
      index: true,
    },
    currentVersion: { type: Number, default: 1 },
    revisionRound: { type: Number, default: 0 },
    changeRequestId: { type: Schema.Types.ObjectId, ref: "ChangeRequest", default: null },
    versions: [versionSchema],
    reviews: [reviewSchema],
  },
  { timestamps: true },
);

deliverableSchema.index({ projectId: 1, stage: 1 });

export const Deliverable: Model<IDeliverable> =
  (mongoose.models.Deliverable as Model<IDeliverable> | undefined) ??
  mongoose.model<IDeliverable>("Deliverable", deliverableSchema);
