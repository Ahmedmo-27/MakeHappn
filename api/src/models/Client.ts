import mongoose, { type Model, Schema, type Types } from "mongoose";

export interface IClientContact {
  name: string;
  title?: string;
  email: string;
  phone?: string;
  isPrimary: boolean;
}

export interface IClient {
  _id: Types.ObjectId;
  name: string;
  brandName?: string;
  industry?: string;
  contacts: IClientContact[];
  billingAddress?: {
    street?: string;
    city?: string;
    country?: string;
    taxId?: string;
  };
  paymentTermsDays: number;
  status: "lead" | "active" | "inactive";
  relationshipOwnerId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    name: { type: String, required: true, trim: true, index: true },
    brandName: { type: String, trim: true },
    industry: { type: String, trim: true },
    contacts: [
      {
        name: { type: String, required: true, trim: true },
        title: { type: String, trim: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        phone: { type: String, trim: true },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    billingAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      country: { type: String, trim: true },
      taxId: { type: String, trim: true },
    },
    paymentTermsDays: { type: Number, default: 30 },
    status: {
      type: String,
      enum: ["lead", "active", "inactive"],
      default: "active",
      index: true,
    },
    relationshipOwnerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

export const Client: Model<IClient> =
  (mongoose.models.Client as Model<IClient> | undefined) ??
  mongoose.model<IClient>("Client", clientSchema);
