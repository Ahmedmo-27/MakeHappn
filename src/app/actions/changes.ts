"use server";

import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { assertName, field } from "@/lib/parse";
import { redirectWith } from "@/lib/redirect";
import { messageOf, type ActionResult } from "@/lib/result";
import { getCurrentUser } from "@/lib/session";
import {
  createManualChangeRequest,
  approveChangeRequest,
} from "@/services/commercial";
import type { CRReason } from "@/models/ChangeRequest";

export async function createChangeRequestAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const projectId = field(formData, "projectId");
    const title = assertName(field(formData, "title"), "Change request title", 160);
    const reason = (field(formData, "reason") || "client_scope_addition") as CRReason;
    const description = field(formData, "description") || "Scope change details";
    const clientRevenueDelta = parseFloat(field(formData, "clientRevenueDelta")) || 0;
    const internalCostDelta = parseFloat(field(formData, "internalCostDelta")) || 0;
    const timeDeltaDays = parseInt(field(formData, "timeDeltaDays"), 10) || 0;

    await createManualChangeRequest({
      projectId,
      title,
      reason,
      description,
      clientRevenueDelta,
      internalCostDelta,
      timeDeltaDays,
    });

    refresh();
    return { ok: true, notice: "Change Request logged" };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: messageOf(error) };
  }
}

export async function createChangeRequestFormAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const result = await createChangeRequestAction(null, formData);
  if (result.ok) {
    redirectWith(`/projects/${projectId}/changes`, { notice: result.notice });
  } else {
    redirectWith(`/projects/${projectId}/changes`, { error: result.error });
  }
}

export async function approveChangeRequestAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    const changeRequestId = field(formData, "changeRequestId");

    await approveChangeRequest(changeRequestId, user.id);
    refresh();
    return { ok: true, notice: "Change Request approved and financials adjusted" };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: messageOf(error) };
  }
}

export async function approveChangeRequestFormAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const result = await approveChangeRequestAction(null, formData);
  if (result.ok) {
    redirectWith(`/projects/${projectId}/changes`, { notice: result.notice });
  } else {
    redirectWith(`/projects/${projectId}/changes`, { error: result.error });
  }
}
