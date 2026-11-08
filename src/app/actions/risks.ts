"use server";

import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { assertName, field } from "@/lib/parse";
import { redirectWith } from "@/lib/redirect";
import { messageOf, type ActionResult } from "@/lib/result";
import { getCurrentUser } from "@/lib/session";
import { createRiskIssue, resolveRiskIssue } from "@/services/risks";
import type { RiskCategory, RiskSeverity, RiskStatus } from "@/models/RiskIssue";

export async function createRiskAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    const projectId = field(formData, "projectId");
    const title = assertName(field(formData, "title"), "Risk title", 160);
    const category = (field(formData, "category") || "scope") as RiskCategory;
    const severity = (field(formData, "severity") || "medium") as RiskSeverity;
    const impactDescription =
      field(formData, "impactDescription") || "Potential schedule or budget impact";
    const mitigationDecision = field(formData, "mitigationDecision");
    const ownerId = field(formData, "ownerId") || user.id;

    await createRiskIssue({
      projectId,
      title,
      category,
      severity,
      ownerId,
      impactDescription,
      mitigationDecision,
    });

    refresh();
    return { ok: true, notice: "Risk/Issue logged to project register" };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: messageOf(error) };
  }
}

export async function createRiskFormAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const result = await createRiskAction(null, formData);
  if (result.ok) {
    redirectWith(`/projects/${projectId}/risks`, { notice: result.notice });
  } else {
    redirectWith(`/projects/${projectId}/risks`, { error: result.error });
  }
}

export async function resolveRiskAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const riskId = field(formData, "riskId");
    const resolutionNotes = field(formData, "resolutionNotes") || "Mitigated and closed";
    const status = (field(formData, "status") || "resolved") as RiskStatus;

    await resolveRiskIssue(riskId, resolutionNotes, status);
    refresh();
    return { ok: true, notice: "Risk status updated" };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: messageOf(error) };
  }
}

export async function resolveRiskFormAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const result = await resolveRiskAction(null, formData);
  if (result.ok) {
    redirectWith(`/projects/${projectId}/risks`, { notice: result.notice });
  } else {
    redirectWith(`/projects/${projectId}/risks`, { error: result.error });
  }
}
