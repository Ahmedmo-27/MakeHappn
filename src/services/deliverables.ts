import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { type ProjectStage } from "@/lib/domain";
import { ChangeRequest } from "@/models/ChangeRequest";
import { Deliverable, type IDeliverable } from "@/models/Deliverable";
import { Project } from "@/models/Project";

export async function listDeliverables(projectId: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(projectId)) return [];
  return Deliverable.find({ projectId: new Types.ObjectId(projectId) })
    .populate("versions.submittedById", "name title")
    .populate("reviews.reviewerId", "name title")
    .sort({ createdAt: 1 })
    .lean();
}

export async function createDeliverable(input: {
  projectId: string;
  stage: ProjectStage;
  title: string;
  description?: string;
  submittedById: string;
  assetUrl?: string;
}): Promise<IDeliverable> {
  await connectDB();
  if (!input.title || input.title.trim().length === 0) {
    throw new Error("Deliverable title is required");
  }

  const deliverable = await Deliverable.create({
    projectId: new Types.ObjectId(input.projectId),
    stage: input.stage,
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    status: "internal_review",
    currentVersion: 1,
    revisionRound: 0,
    versions: [
      {
        versionNumber: 1,
        assetUrl: input.assetUrl?.trim() ?? "",
        notes: "Initial version",
        submittedById: new Types.ObjectId(input.submittedById),
        submittedAt: new Date(),
      },
    ],
    reviews: [],
  });

  return deliverable;
}

export async function submitDeliverableReview(
  deliverableId: string,
  reviewerId: string,
  reviewerRole: "craft_lead" | "project_lead" | "executive" | "client",
  decision: "approved" | "revision_required",
  feedback?: string,
) {
  await connectDB();
  const deliverable = await Deliverable.findById(deliverableId);
  if (!deliverable) throw new Error("Deliverable not found");

  const project = await Project.findById(deliverable.projectId);
  if (!project) throw new Error("Project not found");

  deliverable.reviews.push({
    versionNumber: deliverable.currentVersion,
    reviewerId: new Types.ObjectId(reviewerId),
    reviewerRole,
    decision,
    feedback: feedback?.trim() ?? "",
    reviewedAt: new Date(),
  });

  if (decision === "approved") {
    deliverable.status = "approved";
  } else {
    // Loopback: revision_required
    deliverable.status = "revision_required";
    deliverable.revisionRound += 1;

    // Invariant 7: If revision rounds exceed contracted revision limit, automatically generate Change Request
    const limit = project.contractedRevisionRounds ?? 2;
    if (deliverable.revisionRound > limit && !deliverable.changeRequestId) {
      const crCode = `CR-REV-${deliverable.currentVersion}`;
      const cr = await ChangeRequest.create({
        projectId: project._id,
        deliverableId: deliverable._id,
        code: crCode,
        title: `Scope Extension: ${deliverable.title} exceeded ${limit} revisions`,
        reason: "revision_limit_exceeded",
        description: `Contracted revision rounds (${limit}) exceeded. Revision round ${deliverable.revisionRound} requested.`,
        clientRevenueDelta: 1500, // standard revision fee baseline
        internalCostDelta: 500,
        timeDeltaDays: 3,
        status: "draft",
      });
      deliverable.changeRequestId = cr._id;
    }
  }

  await deliverable.save();
  return deliverable;
}

export async function submitDeliverableVersion(
  deliverableId: string,
  submittedById: string,
  assetUrl?: string,
  notes?: string,
) {
  await connectDB();
  const deliverable = await Deliverable.findById(deliverableId);
  if (!deliverable) throw new Error("Deliverable not found");

  const nextVersion = deliverable.currentVersion + 1;
  deliverable.currentVersion = nextVersion;
  deliverable.status = "internal_review"; // Loopback to review
  deliverable.versions.push({
    versionNumber: nextVersion,
    assetUrl: assetUrl?.trim() ?? "",
    notes: notes?.trim() ?? `Version ${nextVersion} submitted after revisions`,
    submittedById: new Types.ObjectId(submittedById),
    submittedAt: new Date(),
  });

  await deliverable.save();
  return deliverable;
}
