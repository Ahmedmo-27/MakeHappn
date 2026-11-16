import mongoose, { type Model, Schema, type Types } from "mongoose";

export const PO_STATUSES = [
  "draft",
  "issued",
  "partially_billed",
  "fully_billed",
  "cancelled",
] as const;
export type POStatus = (typeof PO_STATUSES)[number];

export interface IPurchaseOrder {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  poNumber: string;
  collectiveMemberId: Types.ObjectId;
  scopeDescription: string;
  amount: number;
  billedAmount: number;
  status: POStatus;
  issuedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    poNumber: { type: String, required: true, trim: true, uppercase: true, unique: true },
    collectiveMemberId: { type: Schema.Types.ObjectId, ref: "CollectiveMember", required: true },
    scopeDescription: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    billedAmount: { type: Number, default: 0, min: 0 },
    status: { type: String, required: true, enum: PO_STATUSES, default: "draft", index: true },
    issuedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

purchaseOrderSchema.index({ projectId: 1, status: 1 });

export const PurchaseOrder: Model<IPurchaseOrder> =
  (mongoose.models.PurchaseOrder as Model<IPurchaseOrder> | undefined) ??
  mongoose.model<IPurchaseOrder>("PurchaseOrder", purchaseOrderSchema);
