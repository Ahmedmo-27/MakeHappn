"use server";

import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { parseDateInput } from "@/lib/format";
import { assertName, field, fieldList } from "@/lib/parse";
import { redirectWith } from "@/lib/redirect";
import { messageOf, type ActionResult } from "@/lib/result";
import { getCurrentUser } from "@/lib/session";
import { canManageProject } from "@/lib/permissions";
import {
  createProject,
  updateProject,
  getProjectById,
  type UpdateProjectInput,
  advanceProjectStage,
  updateProjectStatus,
  submitCloseoutAudit,
} from "@/services/projects";
import {
  isProjectStage,
  isProjectStatus,
  isStudioProduct,
  CURRENCIES,
  type StudioProduct,
  type StudioCurrency,
} from "@/lib/domain";

/** Parses the shared project form (create + edit). Returns an error message when invalid. */
function readProjectForm(formData: FormData, fallbackLeadId: string): UpdateProjectInput | string {
  const name = assertName(field(formData, "name"), "Project name", 120);
  const products: StudioProduct[] = fieldList(formData, "products").filter(isStudioProduct);
  if (products.length === 0) return "Select at least one studio product";

  const rawCurrency = field(formData, "currency");
  const currency: StudioCurrency = (CURRENCIES as readonly string[]).includes(rawCurrency)
    ? (rawCurrency as StudioCurrency)
    : "USD";
  const num = (key: string) => {
    const n = parseFloat(field(formData, key));
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  return {
    name,
    clientId: field(formData, "clientId"),
    projectLeadId: field(formData, "projectLeadId") || fallbackLeadId,
    products,
    teamUserIds: fieldList(formData, "teamUserIds"),
    brief: field(formData, "brief"),
    objectives: field(formData, "objectives"),
    audience: field(formData, "audience"),
    location: field(formData, "location"),
    startDate: parseDateInput(field(formData, "startDate")),
    deliveryDate: parseDateInput(field(formData, "deliveryDate")),
    currency,
    quotedValue: num("quotedValue"),
    approvedContractValue: num("approvedContractValue"),
    contractedRevisionRounds: Math.max(1, Math.round(num("contractedRevisionRounds")) || 2),
  };
}

export async function createProjectAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let projectId = "";
  try {
    const user = await getCurrentUser();
    const input = readProjectForm(formData, user.id);
    if (typeof input === "string") return { ok: false, error: input };
    const created = await createProject(input);

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

export async function updateProjectAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const projectId = field(formData, "projectId");
  try {
    const user = await getCurrentUser();
    const project = await getProjectById(projectId);
    if (!project) return { ok: false, error: "Project not found" };
    if (!canManageProject(user, project)) {
      return { ok: false, error: "Only the project lead or an executive can edit this project" };
    }
    const input = readProjectForm(formData, String(project.projectLeadId?._id ?? user.id));
    if (typeof input === "string") return { ok: false, error: input };
    await updateProject(projectId, input);
    refresh();
    return { ok: true, notice: "Project updated" };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: messageOf(error) };
  }
}

export async function updateProjectFormAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const result = await updateProjectAction(null, formData);
  if (result.ok) {
    redirectWith(`/projects/${projectId}/scope`, { notice: result.notice });
  } else {
    redirectWith(`/projects/${projectId}/edit`, { error: result.error });
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
