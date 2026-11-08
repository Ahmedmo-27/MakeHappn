import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import {
  CollectiveMember,
  type ICollectiveMember,
  type CollectiveType,
} from "@/models/CollectiveMember";

export async function listCollectiveMembers(typeFilter?: CollectiveType) {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (typeFilter) query.type = typeFilter;

  return CollectiveMember.find(query)
    .populate("relationshipOwnerId", "name title")
    .sort({ name: 1 })
    .lean();
}

export async function createCollectiveMember(input: {
  name: string;
  type: CollectiveType;
  specialisms: string[];
  contactPerson?: string;
  email?: string;
  phone?: string;
  location?: string;
  notes?: string;
  relationshipOwnerId?: string;
}): Promise<ICollectiveMember> {
  await connectDB();
  if (!input.name || input.name.trim().length === 0) {
    throw new Error("Partner or maker name is required");
  }

  const member = await CollectiveMember.create({
    name: input.name.trim(),
    type: input.type,
    specialisms: input.specialisms,
    contactPerson: input.contactPerson?.trim() ?? "",
    email: input.email?.trim() ?? "",
    phone: input.phone?.trim() ?? "",
    location: input.location?.trim() ?? "",
    notes: input.notes?.trim() ?? "",
    relationshipOwnerId: input.relationshipOwnerId ? new Types.ObjectId(input.relationshipOwnerId) : null,
    rating: 5,
    status: "vetted",
  });

  return member;
}
