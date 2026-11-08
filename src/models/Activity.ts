import mongoose, { type Model, Schema, type Types } from "mongoose";
import { TASK_STATUSES, type TaskStatus } from "@/lib/domain";

export type ActivityType = "status" | "assignment" | "comment" | "edit";

export interface IActivity {
  _id: Types.ObjectId;
  taskId: Types.ObjectId;
  eventId?: Types.ObjectId | null;
  projectId?: Types.ObjectId | null;
  actorId: Types.ObjectId;
  type: ActivityType;
  fromStatus?: TaskStatus;
  toStatus?: TaskStatus;
  reason?: string;
  fromAssigneeId?: Types.ObjectId | null;
  toAssigneeId?: Types.ObjectId | null;
  detail?: string;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", default: null },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true, enum: ["status", "assignment", "comment", "edit"] },
    fromStatus: { type: String, enum: TASK_STATUSES },
    toStatus: { type: String, enum: TASK_STATUSES },
    reason: { type: String, trim: true },
    fromAssigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    toAssigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    detail: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activitySchema.index({ taskId: 1, createdAt: 1 });
activitySchema.index({ eventId: 1, createdAt: 1 });
activitySchema.index({ projectId: 1, createdAt: 1 });

const cachedActivity = mongoose.models.Activity as Model<IActivity> | undefined;
const cachedTypes = cachedActivity?.schema.path("type")?.options.enum as string[] | undefined;
if (cachedActivity && !cachedTypes?.includes("edit")) {
  mongoose.deleteModel("Activity");
}

export const Activity: Model<IActivity> =
  (mongoose.models.Activity as Model<IActivity> | undefined) ??
  mongoose.model<IActivity>("Activity", activitySchema);
