import mongoose, { type Model, Schema, type Types } from "mongoose";

export interface ITeam {
  _id: Types.ObjectId;
  name: string;
  leaderId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    leaderId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

export const Team: Model<ITeam> =
  (mongoose.models.Team as Model<ITeam> | undefined) ?? mongoose.model<ITeam>("Team", teamSchema);
