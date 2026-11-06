"use server";

import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { isRole } from "@/lib/domain";
import { assertEmail, assertName, assertPassword, field } from "@/lib/parse";
import { redirectWith } from "@/lib/redirect";
import { messageOf, type ActionResult } from "@/lib/result";
import { requireOwner } from "@/lib/session";
import {
  createEventType,
  createPerson,
  createTeam,
  promoteLeader,
  renameEventType,
  renameTeam,
  updatePerson,
} from "@/services/org";

export async function createPersonAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireOwner();
    const roleValue = field(formData, "role");
    if (!isRole(roleValue)) return { ok: false, error: "Choose a role" };
    await createPerson({
      name: assertName(field(formData, "name"), "Name"),
      email: assertEmail(field(formData, "email")),
      password: assertPassword(String(formData.get("password") ?? "")),
      role: roleValue,
      teamId: roleValue === "owner" ? null : field(formData, "teamId") || null,
    });
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: messageOf(error) };
  }
  redirectWith("/people", { notice: "Person added" });
}

export async function updatePersonAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireOwner();
    const roleValue = field(formData, "role");
    if (!isRole(roleValue)) return { ok: false, error: "Choose a role" };
    const password = String(formData.get("password") ?? "");
    await updatePerson({
      id: field(formData, "id"),
      name: assertName(field(formData, "name"), "Name"),
      email: assertEmail(field(formData, "email")),
      password: password ? assertPassword(password) : undefined,
      role: roleValue,
      teamId: roleValue === "owner" ? null : field(formData, "teamId") || null,
    });
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: messageOf(error) };
  }
  redirectWith("/people", { notice: "Person updated" });
}

export async function createTeamAction(formData: FormData) {
  try {
    await requireOwner();
    await createTeam(assertName(field(formData, "name"), "Team name", 60));
    refresh();
    redirectWith("/teams", { notice: "Team added" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith("/teams", { error: messageOf(error) });
  }
}

export async function renameTeamAction(formData: FormData) {
  try {
    await requireOwner();
    await renameTeam(field(formData, "teamId"), assertName(field(formData, "name"), "Team name", 60));
    refresh();
    redirectWith("/teams", { notice: "Team renamed" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith("/teams", { error: messageOf(error) });
  }
}

export async function promoteLeaderAction(formData: FormData) {
  try {
    await requireOwner();
    await promoteLeader(field(formData, "teamId"), field(formData, "userId"));
    refresh();
    redirectWith("/teams", { notice: "Team leader updated" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith("/teams", { error: messageOf(error) });
  }
}

export async function createEventTypeAction(formData: FormData) {
  try {
    await requireOwner();
    await createEventType(assertName(field(formData, "name"), "Event type", 60));
    refresh();
    redirectWith("/event-types", { notice: "Event type added" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith("/event-types", { error: messageOf(error) });
  }
}

export async function renameEventTypeAction(formData: FormData) {
  try {
    await requireOwner();
    await renameEventType(
      field(formData, "typeId"),
      assertName(field(formData, "name"), "Event type", 60),
    );
    refresh();
    redirectWith("/event-types", { notice: "Event type renamed" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith("/event-types", { error: messageOf(error) });
  }
}
