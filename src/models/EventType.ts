import mongoose, { type Model, Schema, type Types } from "mongoose";

export interface IEventType {
  _id: Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const eventTypeSchema = new Schema<IEventType>(
  {
    name: { type: String, required: true, trim: true, unique: true },
  },
  { timestamps: true },
);

export const EventType: Model<IEventType> =
  (mongoose.models.EventType as Model<IEventType> | undefined) ??
  mongoose.model<IEventType>("EventType", eventTypeSchema);
