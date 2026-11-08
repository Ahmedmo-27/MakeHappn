import mongoose, { type Model, Schema, type Types } from "mongoose";

export interface ISupplierBill {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  purchaseOrderId: Types.ObjectId;
  billNumber: string;
  amount: number;
  status: "received" | "approved" | "paid";
  notes?: string;
  receivedAt: Date;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const supplierBillSchema = new Schema<ISupplierBill>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: "PurchaseOrder", required: true, index: true },
    billNumber: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["received", "approved", "paid"], default: "received", index: true },
    notes: { type: String, default: "", trim: true },
    receivedAt: { type: Date, default: Date.now },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const SupplierBill: Model<ISupplierBill> =
  (mongoose.models.SupplierBill as Model<ISupplierBill> | undefined) ??
  mongoose.model<ISupplierBill>("SupplierBill", supplierBillSchema);
