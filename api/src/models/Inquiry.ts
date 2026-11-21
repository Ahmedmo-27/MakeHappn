import mongoose, { type Model, Schema, type Types } from "mongoose";
import {
  CURRENCIES,
  INQUIRY_PRODUCTS,
  INQUIRY_SOURCES,
  INQUIRY_STATUSES,
  type InquiryProduct,
  type InquirySource,
  type InquiryStatus,
  type StudioCurrency,
} from "@/lib/domain";

export interface IInquiry {
  _id: Types.ObjectId;
  brandName: string;
  projectName: string;
  clientName: string;
  clientContact: string;
  product: InquiryProduct;
  source: InquirySource;
  scope: string[];
  deliveryDate?: Date | null;
  budget: number;
  currency: StudioCurrency;
  location: string;
  notes: string;
  status: InquiryStatus;
  submittedById: Types.ObjectId;
  submittedByName: string;
  submittedByEmail: string;
  callScheduledAt?: Date | null;
  callNotes: string;
  projectLeadIds: Types.ObjectId[];
  decidedById?: Types.ObjectId | null;
  decidedAt?: Date | null;
  declineReason: string;
  convertedProjectId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const inquirySchema = new Schema<IInquiry>(
  {
    brandName: { type: String, required: true, trim: true, index: true },
    projectName: { type: String, required: true, trim: true },
    clientName: { type: String, required: true, trim: true },
    clientContact: { type: String, required: true, trim: true },
    product: { type: String, required: true, enum: INQUIRY_PRODUCTS },
    source: { type: String, enum: INQUIRY_SOURCES, default: "website" },
    scope: [{ type: String, trim: true }],
    deliveryDate: { type: Date, default: null },
    budget: { type: Number, default: 0, min: 0 },
    currency: { type: String, enum: CURRENCIES, default: "USD" },
    location: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    status: { type: String, required: true, enum: INQUIRY_STATUSES, default: "pending", index: true },
    submittedById: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    submittedByName: { type: String, default: "", trim: true },
    submittedByEmail: { type: String, default: "", trim: true },
    callScheduledAt: { type: Date, default: null },
    callNotes: { type: String, default: "", trim: true },
    projectLeadIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    decidedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    decidedAt: { type: Date, default: null },
    declineReason: { type: String, default: "", trim: true },
    convertedProjectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
  },
  { timestamps: true },
);

export const Inquiry: Model<IInquiry> =
  (mongoose.models.Inquiry as Model<IInquiry> | undefined) ??
  mongoose.model<IInquiry>("Inquiry", inquirySchema);
