import mongoose from "mongoose";

export function isObjectId(value: string): boolean {
  if (!mongoose.Types.ObjectId.isValid(value)) return false;
  return new mongoose.Types.ObjectId(value).toString() === value;
}

export function toObjectId(value: string): mongoose.Types.ObjectId {
  if (!isObjectId(value)) throw new Error("Invalid id");
  return new mongoose.Types.ObjectId(value);
}

export function sameId(left: unknown, right: unknown): boolean {
  if (left == null || right == null) return false;
  return String(left) === String(right);
}
