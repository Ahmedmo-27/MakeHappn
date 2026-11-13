import mongoose, { type Model, Schema, type Types } from "mongoose";
import {
  type Role,
  type FunctionalRole,
  FUNCTIONAL_ROLES,
} from "@/lib/domain";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  title: string;
  isExecutive: boolean;
  functionalRoles: FunctionalRole[];
  laneIds: Types.ObjectId[];
  teamId: Types.ObjectId | null;
  phone?: string;
  reportsToId?: Types.ObjectId | null;
  jobDescription: string;
  weeklyCapacityHours: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ["owner", "leader", "member"] },
    title: { type: String, default: "", trim: true },
    isExecutive: { type: Boolean, default: false },
    functionalRoles: [{ type: String, enum: FUNCTIONAL_ROLES }],
    laneIds: [{ type: Schema.Types.ObjectId, ref: "Team" }],
    teamId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    phone: { type: String, trim: true },
    reportsToId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    jobDescription: { type: String, default: "", trim: true },
    weeklyCapacityHours: { type: Number, default: 40, min: 0, max: 80 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.index({ teamId: 1 });
userSchema.index({ laneIds: 1 });

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser> | undefined) ?? mongoose.model<IUser>("User", userSchema);
