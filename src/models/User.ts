import mongoose, { type Model, Schema, type Types } from "mongoose";
import type { Role } from "@/lib/domain";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  teamId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ["owner", "leader", "member"] },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
  },
  { timestamps: true },
);

userSchema.index({ teamId: 1 });

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser> | undefined) ?? mongoose.model<IUser>("User", userSchema);
