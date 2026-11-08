"use server";

import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { field } from "@/lib/parse";
import { redirectWith } from "@/lib/redirect";
import { messageOf, type ActionResult } from "@/lib/result";
import { getCurrentUser } from "@/lib/session";
import {
  createDeliverable,
  submitDeliverableReview,
  submitDeliverableVersion,
} from "@/services/deliverables";
import { isProjectStage, type ProjectStage } from "@/lib/domain";

export async function createDeliverableAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const projectId = field(formData, "projectId");
  const stage = field(formData, "stage");
  const title = field(formData, "title");
  const description = field(formData, "description");
  const assetUrl = field(formData, "assetUrl");

  try {
    const user = await getCurrentUser();
    if (!isProjectStage(stage)) {
      return { ok: false, error: "Invalid stage" };
    }

    await createDeliverable({
      projectId,
      stage: stage as ProjectStage,
      title,
      description,
      submittedById: user.id,
      assetUrl,
    });

    refresh();
    return { ok: true, notice: "Deliverable created and submitted for review" };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: messageOf(error) };
  }
}

export async function createDeliverableFormAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const result = await createDeliverableAction(null, formData);
  if (result.ok) {
    redirectWith(`/projects/${projectId}/deliverables`, { notice: result.notice });
  } else {
    redirectWith(`/projects/${projectId}/deliverables`, { error: result.error });
  }
}

export async function submitReviewAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const deliverableId = field(formData, "deliverableId");
  const decision = field(formData, "decision") as "approved" | "revision_required";
  const feedback = field(formData, "feedback");
  const role = (field(formData, "reviewerRole") || "project_lead") as
    | "craft_lead"
    | "project_lead"
    | "executive"
    | "client";

  try {
    const user = await getCurrentUser();
    await submitDeliverableReview(deliverableId, user.id, role, decision, feedback);
    refresh();
    return {
      ok: true,
      notice: decision === "approved" ? "Deliverable approved" : "Revision feedback submitted",
    };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: messageOf(error) };
  }
}

export async function submitReviewFormAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const result = await submitReviewAction(null, formData);
  if (result.ok) {
    redirectWith(`/projects/${projectId}/deliverables`, { notice: result.notice });
  } else {
    redirectWith(`/projects/${projectId}/deliverables`, { error: result.error });
  }
}

export async function submitNewVersionAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const deliverableId = field(formData, "deliverableId");
  const assetUrl = field(formData, "assetUrl");
  const notes = field(formData, "notes");

  try {
    const user = await getCurrentUser();
    await submitDeliverableVersion(deliverableId, user.id, assetUrl, notes);
    refresh();
    return { ok: true, notice: "New version submitted for review" };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: messageOf(error) };
  }
}

export async function submitNewVersionFormAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const result = await submitNewVersionAction(null, formData);
  if (result.ok) {
    redirectWith(`/projects/${projectId}/deliverables`, { notice: result.notice });
  } else {
    redirectWith(`/projects/${projectId}/deliverables`, { error: result.error });
  }
}
