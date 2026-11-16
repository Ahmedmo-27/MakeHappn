import mongoose, { type Model, Schema, type Types } from "mongoose";

export interface ISupplierQuote {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  collectiveMemberId: Types.ObjectId;
  description: string;
  amount: number;
  selected: boolean;
  purchaseOrderId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const supplierQuoteSchema = new Schema<ISupplierQuote>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    collectiveMemberId: { type: Schema.Types.ObjectId, ref: "CollectiveMember", required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    selected: { type: Boolean, default: false },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: "PurchaseOrder", default: null },
  },
  { timestamps: true },
);

export const SupplierQuote: Model<ISupplierQuote> =
  (mongoose.models.SupplierQuote as Model<ISupplierQuote> | undefined) ??
  mongoose.model<ISupplierQuote>("SupplierQuote", supplierQuoteSchema);

export interface ICostLine {
  label: string;
  category: string;
  estimated: number;
  committed: number;
  actual: number;
}

export interface ICostSheet {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  locked: boolean;
  lines: ICostLine[];
  createdAt: Date;
  updatedAt: Date;
}

const costSheetSchema = new Schema<ICostSheet>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, unique: true, index: true },
    locked: { type: Boolean, default: false },
    lines: [
      {
        label: { type: String, required: true, trim: true },
        category: { type: String, default: "general", trim: true },
        estimated: { type: Number, default: 0, min: 0 },
        committed: { type: Number, default: 0, min: 0 },
        actual: { type: Number, default: 0, min: 0 },
      },
    ],
  },
  { timestamps: true },
);

export const CostSheet: Model<ICostSheet> =
  (mongoose.models.CostSheet as Model<ICostSheet> | undefined) ??
  mongoose.model<ICostSheet>("CostSheet", costSheetSchema);

export interface IEngagement {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  collectiveMemberId: Types.ObjectId;
  role: string;
  agreedFee: number;
  status: "proposed" | "confirmed" | "complete";
  createdAt: Date;
  updatedAt: Date;
}

const engagementSchema = new Schema<IEngagement>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    collectiveMemberId: { type: Schema.Types.ObjectId, ref: "CollectiveMember", required: true, index: true },
    role: { type: String, required: true, trim: true },
    agreedFee: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["proposed", "confirmed", "complete"], default: "proposed" },
  },
  { timestamps: true },
);

engagementSchema.index({ projectId: 1, collectiveMemberId: 1 });

export const Engagement: Model<IEngagement> =
  (mongoose.models.Engagement as Model<IEngagement> | undefined) ??
  mongoose.model<IEngagement>("Engagement", engagementSchema);

export interface IProjectTemplate {
  _id: Types.ObjectId;
  name: string;
  product: string;
  bypassedStages: string[];
  tasks: Array<{ title: string; stage: string; laneName: string; category: string }>;
  deliverables: Array<{ title: string; stage: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const projectTemplateSchema = new Schema<IProjectTemplate>(
  {
    name: { type: String, required: true, trim: true },
    product: { type: String, required: true, trim: true, index: true },
    bypassedStages: [{ type: String }],
    tasks: [
      {
        title: { type: String, required: true },
        stage: { type: String, required: true },
        laneName: { type: String, default: "Project & Delivery" },
        category: { type: String, default: "deliverable_prerequisite" },
      },
    ],
    deliverables: [
      {
        title: { type: String, required: true },
        stage: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
);

export const ProjectTemplate: Model<IProjectTemplate> =
  (mongoose.models.ProjectTemplate as Model<IProjectTemplate> | undefined) ??
  mongoose.model<IProjectTemplate>("ProjectTemplate", projectTemplateSchema);
