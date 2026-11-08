"use server";

import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { parseDateInput } from "@/lib/format";
import { assertName, field, fieldList } from "@/lib/parse";
import { redirectWith } from "@/lib/redirect";
import { messageOf, type ActionResult } from "@/lib/result";
import { getCurrentUser } from "@/lib/session";
import {
  createProject,
  advanceProjectStage,
  updateProjectStatus,
  submitCloseoutAudit,
} from "@/services/projects";
import {
  isProjectStage,
  isProjectStatus,
  isStudioProduct,
  type StudioProduct,
  type StudioCurrency,
} from "@/lib/domain";

export async function createProjectAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let projectId = "";
  try {
    const user = await getCurrentUser();
    const name = assertName(field(formData, "name"), "Project name", 120);
    const clientId = field(formData, "clientId");
    const projectLeadId = field(formData, "projectLeadId") || user.id;

    const rawProducts = fieldList(formData, "products");
    const products: StudioProduct[] = rawProducts.filter(isStudioProduct);
    if (products.length === 0) {
      return { ok: false, error: "Select at least one studio product" };
    }

    const startDate = parseDateInput(field(formData, "startDate"));
    const deliveryDate = parseDateInput(field(formData, "deliveryDate"));

    const currency = (field(formData, "currency") || "USD") as StudioCurrency;
    const quotedValue = parseFloat(field(formData, "quotedValue")) || 0;
    const approvedContractValue =
      parseFloat(field(formData, "approvedContractValue")) || 0;

    const brief = field(formData, "brief");
    const objectives = field(formData, "objectives");
    const audience = field(formData, "audience");
    const location = field(formData, "location");

    const created = await createProject({
      name,
      clientId,
      projectLeadId,
      products,
      brief,
      objectives,
      audience,
      location,
      startDate,
      deliveryDate,
      currency,
      quotedValue,
      approvedContractValue,
    });

    projectId = created._id.toString();
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: messageOf(error) };
  }
  redirectWith(`/projects/${projectId}`, { notice: "Project created successfully" });
}

export async function createProjectFormAction(formData: FormData): Promise<void> {
  const result = await createProjectAction(null, formData);
  if (!result.ok) {
    redirectWith("/projects/new", { error: result.error });
  }
}

export async function advanceStageAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const projectId = field(formData, "projectId");
  const targetStage = field(formData, "targetStage");
  const notes = field(formData, "notes");

  try {
    const user = await getCurrentUser();
    if (!isProjectStage(targetStage)) {
      return { ok: false, error: "Invalid target stage" };
    }

    await advanceProjectStage(projectId, targetStage, user.id, notes);
    refresh();
    return { ok: true, notice: "Stage advanced successfully" };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: messageOf(error) };
  }
}

export async function advanceStageFormAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const result = await advanceStageAction(null, formData);
  if (result.ok) {
    redirectWith(`/projects/${projectId}`, { notice: result.notice });
  } else {
    redirectWith(`/projects/${projectId}`, { error: result.error });
  }
}

export async function updateStatusAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const projectId = field(formData, "projectId");
  const status = field(formData, "status");
  const health = field(formData, "health") as "on_track" | "at_risk" | "blocked" | undefined;

  try {
    await getCurrentUser();
    if (!isProjectStatus(status)) {
      return { ok: false, error: "Invalid status" };
    }

    await updateProjectStatus(projectId, status, health);
    refresh();
    return { ok: true, notice: "Project status updated" };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: messageOf(error) };
  }
}

export async function updateStatusFormAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const result = await updateStatusAction(null, formData);
  if (result.ok) {
    redirectWith(`/projects/${projectId}`, { notice: result.notice });
  } else {
    redirectWith(`/projects/${projectId}`, { error: result.error });
  }
}

export async function submitCloseoutChecklistAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const projectId = field(formData, "projectId");
  const clientWalkthroughSigned = formData.get("clientWalkthroughSigned") === "on";
  const punchListCleared = formData.get("punchListCleared") === "on";
  const postMortemCompleted = formData.get("postMortemCompleted") === "on";
  const archiveDelivered = formData.get("archiveDelivered") === "on";
  const archivedAssetsUrl = field(formData, "archivedAssetsUrl");
  const lessonsLearned = field(formData, "lessonsLearned");

  try {
    const user = await getCurrentUser();
    await submitCloseoutAudit({
      projectId,
      actorId: user.id,
      clientWalkthroughSigned,
      punchListCleared,
      postMortemCompleted,
      archiveDelivered,
      archivedAssetsUrl,
      lessonsLearned,
    });
    refresh();
    return { ok: true, notice: "Closeout audit checklist updated" };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: messageOf(error) };
  }
}

export async function submitCloseoutChecklistFormAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const result = await submitCloseoutChecklistAction(null, formData);
  if (result.ok) {
    redirectWith(`/projects/${projectId}`, { notice: result.notice });
  } else {
    redirectWith(`/projects/${projectId}`, { error: result.error });
  }
}
