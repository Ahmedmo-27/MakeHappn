import mongoose, { type Model, Schema, type Types } from "mongoose";
import {
  TASK_STATUSES,
  PROJECT_STAGES,
  type TaskStatus,
  type ProjectStage,
} from "@/lib/domain";

export const TASK_CATEGORIES = [
  "deliverable_prerequisite",
  "continuous_support",
  "operational_internal",
] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const TASK_PRIORITIES = ["urgent", "high", "medium", "low"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface ITask {
  _id: Types.ObjectId;
  projectId?: Types.ObjectId;
  eventId?: Types.ObjectId;
  teamId: Types.ObjectId;
  stage?: ProjectStage;

  // Dual Accountability
  accountableOwnerId?: Types.ObjectId | null; // Single throat to choke
  collaboratorIds: Types.ObjectId[]; // Supporting team members
  assigneeId: Types.ObjectId | null; // Legacy single assignee alias

  title: string;
  description: string;
  dueDate: Date | null;
  status: TaskStatus;
  priority: TaskPriority;

  // Operational Invariant Categorization
  taskCategory: TaskCategory;
  isGatePrerequisite: boolean; // false for continuous support tasks like social media documentation

  // Dependency DAG & Deliverable Linkage
  dependsOnTaskIds: Types.ObjectId[];
  deliverableId?: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", index: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    stage: { type: String, enum: PROJECT_STAGES, index: true },

    accountableOwnerId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    collaboratorIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    assigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    dueDate: { type: Date, default: null },
    status: { type: String, required: true, enum: TASK_STATUSES, default: "backlog", index: true },
    priority: { type: String, required: true, enum: TASK_PRIORITIES, default: "medium" },

    taskCategory: {
      type: String,
      required: true,
      enum: TASK_CATEGORIES,
      default: "deliverable_prerequisite",
    },
    isGatePrerequisite: { type: Boolean, default: true },

    dependsOnTaskIds: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    deliverableId: { type: Schema.Types.ObjectId, ref: "Deliverable", default: null },
  },
  { timestamps: true },
);

// Backward-compatibility pre-save: sync assigneeId with accountableOwnerId
taskSchema.pre("save", function () {
  if (this.accountableOwnerId && !this.assigneeId) {
    this.assigneeId = this.accountableOwnerId;
  } else if (this.assigneeId && !this.accountableOwnerId) {
    this.accountableOwnerId = this.assigneeId;
  }
});

taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ eventId: 1, teamId: 1, status: 1 });
taskSchema.index({ accountableOwnerId: 1, status: 1 });

export const Task: Model<ITask> =
  (mongoose.models.Task as Model<ITask> | undefined) ?? mongoose.model<ITask>("Task", taskSchema);
