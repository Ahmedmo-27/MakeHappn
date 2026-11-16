"use server";

import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { isFunctionalRole, isRole, type FunctionalRole } from "@/lib/domain";
import { assertEmail, assertName, assertPassword, field, fieldList } from "@/lib/parse";
import { redirectWith } from "@/lib/redirect";
import { messageOf, type ActionResult } from "@/lib/result";
import { requireOwner } from "@/lib/session";
import { createPerson, createTeam, promoteLeader, renameTeam, updatePerson } from "@/services/org";

function readFunctionalRoles(formData: FormData): FunctionalRole[] {
  const selected = fieldList(formData, "functionalRoles");
  const roles = selected.filter(isFunctionalRole);
  if (roles.length !== selected.length) throw new Error("Choose a functional role from the list");
  return roles;
}

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
      title: field(formData, "title"),
      password: assertPassword(String(formData.get("password") ?? "")),
      role: roleValue,
      teamId: roleValue === "owner" ? null : field(formData, "teamId") || null,
      jobDescription: field(formData, "jobDescription"),
      weeklyCapacityHours: Number(field(formData, "weeklyCapacityHours")) || 40,
      reportsToId: field(formData, "reportsToId") || null,
      functionalRoles: readFunctionalRoles(formData),
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
      title: field(formData, "title"),
      password: password ? assertPassword(password) : undefined,
      role: roleValue,
      teamId: roleValue === "owner" ? null : field(formData, "teamId") || null,
      jobDescription: field(formData, "jobDescription"),
      weeklyCapacityHours: Number(field(formData, "weeklyCapacityHours")) || 40,
      reportsToId: field(formData, "reportsToId") || null,
      functionalRoles: readFunctionalRoles(formData),
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

