import mongoose, { type Model, Schema, type Types } from "mongoose";
import { STUDIO_PRODUCTS, CURRENCIES, type StudioProduct, type StudioCurrency } from "@/lib/domain";

export const LEAD_STAGES = ["inquiry", "discovery", "proposal", "won", "lost"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  inquiry: "01 Lead / Inquiry",
  discovery: "02 Discovery & Qual",
  proposal: "03 Proposal & Scope",
  won: "04 Won & Confirmed",
  lost: "Archived / Lost",
};

export interface ILead {
  _id: Types.ObjectId;
  clientName: string;
  companyName: string;
  email: string;
  phone?: string;
  stage: LeadStage;
  products: StudioProduct[];
  estimatedValue: number;
  currency: StudioCurrency;
  notes: string;
  assignedLeadId?: Types.ObjectId | null;
  convertedProjectId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    clientName: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    stage: { type: String, required: true, enum: LEAD_STAGES, default: "inquiry", index: true },
    products: [{ type: String, enum: STUDIO_PRODUCTS }],
    estimatedValue: { type: Number, default: 0, min: 0 },
    currency: { type: String, enum: CURRENCIES, default: "USD" },
    notes: { type: String, default: "", trim: true },
    assignedLeadId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    convertedProjectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
  },
  { timestamps: true },
);

export const Lead: Model<ILead> =
  (mongoose.models.Lead as Model<ILead> | undefined) ?? mongoose.model<ILead>("Lead", leadSchema);
