import mongoose, { type Model, Schema, type Types } from "mongoose";

export const COLLECTIVE_TYPES = [
  "maker",
  "partner",
  "contractor",
  "supplier",
  "venue",
] as const;
export type CollectiveType = (typeof COLLECTIVE_TYPES)[number];

export const COLLECTIVE_TYPE_LABELS: Record<CollectiveType, string> = {
  maker: "Artisan / Maker",
  partner: "Creative Partner",
  contractor: "Specialist Contractor",
  supplier: "Equipment / Materials Supplier",
  venue: "Venue / Site",
};

export interface ICollectiveMember {
  _id: Types.ObjectId;
  name: string;
  type: CollectiveType;
  specialisms: string[];
  contactPerson: string;
  email: string;
  phone: string;
  location: string;
  relationshipOwnerId?: Types.ObjectId | null;
  rating: number;
  status: "active" | "vetted" | "on_hold";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const collectiveMemberSchema = new Schema<ICollectiveMember>(
  {
    name: { type: String, required: true, trim: true, index: true },
    type: { type: String, required: true, enum: COLLECTIVE_TYPES, index: true },
    specialisms: [{ type: String, trim: true }],
    contactPerson: { type: String, default: "", trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    relationshipOwnerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    status: { type: String, enum: ["active", "vetted", "on_hold"], default: "vetted", index: true },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

collectiveMemberSchema.index({ type: 1, status: 1 });

export const CollectiveMember: Model<ICollectiveMember> =
  (mongoose.models.CollectiveMember as Model<ICollectiveMember> | undefined) ??
  mongoose.model<ICollectiveMember>("CollectiveMember", collectiveMemberSchema);
