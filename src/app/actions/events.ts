"use server";

import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { parseDateInput } from "@/lib/format";
import { assertName, field, fieldList } from "@/lib/parse";
import { redirectWith } from "@/lib/redirect";
import { messageOf, type ActionResult } from "@/lib/result";
import { getCurrentUser, requireOwner } from "@/lib/session";
import { addTeamToEvent, createEvent, notifyPendingTeams } from "@/services/events";

export async function createEventAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let eventId = "";
  let notice = "Event created";
  try {
    await requireOwner();
    const start = parseDateInput(field(formData, "start"));
    const end = parseDateInput(field(formData, "end"));
    if (!start || !end) return { ok: false, error: "Choose a start and end date" };
    const created = await createEvent({
      name: assertName(field(formData, "name"), "Event name", 120),
      typeId: field(formData, "typeId"),
      teamIds: fieldList(formData, "teamIds"),
      start,
      end,
    });
    eventId = created.id;
    notice =
      created.warnings.length > 0
        ? `Event created. ${created.warnings.join(" ")}`
        : "Event created. Team leaders were emailed.";
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: messageOf(error) };
  }
  redirectWith(`/events/${eventId}/backlog`, { notice });
}

export async function addTeamAction(formData: FormData) {
  const eventId = field(formData, "eventId");
  const path = `/events/${eventId}/backlog`;
  try {
    await requireOwner();
    const warnings = await addTeamToEvent(eventId, field(formData, "teamId"));
    refresh();
    redirectWith(path, {
      notice: warnings.length > 0 ? warnings.join(" ") : "Team added and the leader was emailed.",
    });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(path, { error: messageOf(error) });
  }
}

export async function resendNoticesAction(formData: FormData) {
  const eventId = field(formData, "eventId");
  const path = `/events/${eventId}/backlog`;
  try {
    const user = await getCurrentUser();
    if (user.role !== "owner") throw new Error("Only the owner can send assignment emails");
    const warnings = await notifyPendingTeams(eventId);
    refresh();
    redirectWith(path, {
      notice: warnings.length > 0 ? warnings.join(" ") : "Assignment emails sent.",
    });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(path, { error: messageOf(error) });
  }
}
