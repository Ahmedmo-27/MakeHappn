import mongoose, { type Model, Schema, type Types } from "mongoose";

export interface IComment {
  _id: Types.ObjectId;
  taskId: Types.ObjectId;
  authorId: Types.ObjectId;
  body: string;
  createdAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

commentSchema.index({ taskId: 1, createdAt: 1 });

export const Comment: Model<IComment> =
  (mongoose.models.Comment as Model<IComment> | undefined) ??
  mongoose.model<IComment>("Comment", commentSchema);
