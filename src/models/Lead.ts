import mongoose, { type Model, Schema, type Types } from "mongoose";
import { STUDIO_PRODUCTS, CURRENCIES, type StudioProduct, type StudioCurrency } from "@/lib/domain";

export const LEAD_STAGES = ["inquiry", "contacted", "discovery", "proposal", "on_hold", "won", "lost"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export function isLeadStage(value: string): value is LeadStage {
  return (LEAD_STAGES as readonly string[]).includes(value);
}

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  inquiry: "New",
  contacted: "Contacted",
  discovery: "Qualified",
  proposal: "Proposal in progress",
  on_hold: "On hold",
  won: "Won",
  lost: "Lost",
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
  source: string;
  nextAction: string;
  followUpAt?: Date | null;
  expectedTiming: string;
  objectives: string;
  audience: string;
  deliverablesText: string;
  budgetRange: string;
  location: string;
  decisionMakers: string;
  missingInfo: string;
  assumptions: string;
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
    source: { type: String, default: "", trim: true },
    nextAction: { type: String, default: "", trim: true },
    followUpAt: { type: Date, default: null },
    expectedTiming: { type: String, default: "", trim: true },
    objectives: { type: String, default: "", trim: true },
    audience: { type: String, default: "", trim: true },
    deliverablesText: { type: String, default: "", trim: true },
    budgetRange: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    decisionMakers: { type: String, default: "", trim: true },
    missingInfo: { type: String, default: "", trim: true },
    assumptions: { type: String, default: "", trim: true },
    assignedLeadId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    convertedProjectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
  },
  { timestamps: true },
);

export const Lead: Model<ILead> =
  (mongoose.models.Lead as Model<ILead> | undefined) ?? mongoose.model<ILead>("Lead", leadSchema);
