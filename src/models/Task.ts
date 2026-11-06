import mongoose, { type Model, Schema, type Types } from "mongoose";
import { TASK_STATUSES, type TaskStatus } from "@/lib/domain";

export interface ITask {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  teamId: Types.ObjectId;
  assigneeId: Types.ObjectId | null;
  title: string;
  description: string;
  dueDate: Date | null;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    dueDate: { type: Date, default: null },
    status: { type: String, required: true, enum: TASK_STATUSES, default: "backlog" },
  },
  { timestamps: true },
);

taskSchema.index({ eventId: 1, teamId: 1, status: 1 });
taskSchema.index({ assigneeId: 1, status: 1 });

export const Task: Model<ITask> =
  (mongoose.models.Task as Model<ITask> | undefined) ?? mongoose.model<ITask>("Task", taskSchema);
