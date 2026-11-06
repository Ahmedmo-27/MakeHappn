import mongoose, { type Model, Schema, type Types } from "mongoose";

export interface IEvent {
  _id: Types.ObjectId;
  name: string;
  typeId: Types.ObjectId;
  start: Date;
  end: Date;
  teamIds: Types.ObjectId[];
  notifiedTeamIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    name: { type: String, required: true, trim: true },
    typeId: { type: Schema.Types.ObjectId, ref: "EventType", required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    teamIds: [{ type: Schema.Types.ObjectId, ref: "Team", required: true }],
    notifiedTeamIds: [{ type: Schema.Types.ObjectId, ref: "Team" }],
  },
  { timestamps: true },
);

eventSchema.index({ start: 1 });

export const Event: Model<IEvent> =
  (mongoose.models.Event as Model<IEvent> | undefined) ??
  mongoose.model<IEvent>("Event", eventSchema);
