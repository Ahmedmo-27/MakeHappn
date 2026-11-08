import mongoose, { type Model, Schema, type Types } from "mongoose";

export const INVOICE_STATUSES = [
  "not_invoiced",
  "invoiced",
  "partially_paid",
  "paid",
  "overdue",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  not_invoiced: "Not Invoiced",
  invoiced: "Invoiced / Sent",
  partially_paid: "Partially Paid",
  paid: "Paid & Settled",
  overdue: "Payment Overdue",
};

export interface IInvoice {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  invoiceNumber: string;
  milestoneTitle: string;
  amount: number;
  percentage?: number;
  status: InvoiceStatus;
  dueDate: Date | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    invoiceNumber: { type: String, required: true, trim: true, uppercase: true },
    milestoneTitle: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    percentage: { type: Number, min: 0, max: 100 },
    status: {
      type: String,
      required: true,
      enum: INVOICE_STATUSES,
      default: "not_invoiced",
      index: true,
    },
    dueDate: { type: Date, default: null },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true },
);

invoiceSchema.index({ projectId: 1, invoiceNumber: 1 }, { unique: true });

export const Invoice: Model<IInvoice> =
  (mongoose.models.Invoice as Model<IInvoice> | undefined) ??
  mongoose.model<IInvoice>("Invoice", invoiceSchema);
