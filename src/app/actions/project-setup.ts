"use server";

import { refresh } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { parseDateInput } from "@/lib/format";
import { field, fieldList } from "@/lib/parse";
import { redirectWith } from "@/lib/redirect";
import { messageOf } from "@/lib/result";
import { getCurrentUser } from "@/lib/session";
import { PROJECT_SETUP_PHASES } from "@/lib/domain";
import { googleMeetScheduleUrl } from "@/lib/google-meet";
import {
  addProjectMember,
  getProjectCommunicationDetails,
  notifyProjectTeam,
  removeProjectMember,
  setOwnAvailability,
  updateProjectKickoff,
  updateProjectSetupDeliverables,
  updateProjectSetup,
  updateProjectTimeline,
} from "@/services/projects";

function dateOrNull(value: string, label: string) {
  if (!value) return null;
  const date = parseDateInput(value);
  if (!date) throw new Error(`${label} is not a valid date`);
  return date.toISOString();
}

export async function saveProjectSetupAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const path = `/projects/${projectId}/setup`;
  try {
    await getCurrentUser();
    await updateProjectSetup(projectId, {
      brief: field(formData, "brief"),
      creativeLeadId: field(formData, "creativeLeadId") || null,
      scopeItems: fieldList(formData, "scopeItems"),
    });
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(path, { error: messageOf(error) });
  }
  redirectWith(path, { notice: "Overview and scope saved" });
}

export async function saveProjectTimelineAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const path = `/projects/${projectId}/setup/timeline`;
  try {
    await getCurrentUser();
    await updateProjectTimeline(projectId, {
      startDate: dateOrNull(field(formData, "startDate"), "Start date"),
      deliveryDate: dateOrNull(field(formData, "deliveryDate"), "Delivery date"),
      phases: PROJECT_SETUP_PHASES.map((name, index) => ({
        name,
        durationDays: field(formData, `duration-${index}`).trim()
          ? Number(field(formData, `duration-${index}`))
          : 0,
        ownerId: field(formData, `owner-${index}`) || null,
      })),
    });
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(path, { error: messageOf(error) });
  }
  redirectWith(path, { notice: "Timeline and phases saved" });
}

export async function saveProjectDeliverablesAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const path = `/projects/${projectId}/setup/deliverables`;
  try {
    await getCurrentUser();
    await updateProjectSetupDeliverables(projectId, PROJECT_SETUP_PHASES.map((name, index) => ({
        name,
        deliverables: field(formData, `deliverables-${index}`),
      })));
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(path, { error: messageOf(error) });
  }
  redirectWith(path, { notice: "Deliverables saved" });
}

export async function scheduleProjectKickoffAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  let calendarUrl: string;
  try {
    await getCurrentUser();
    const kickoffAt = field(formData, "kickoffAt");
    const project = await getProjectCommunicationDetails(projectId);
    if (project.members.length === 0) throw new Error("Add project members before scheduling the kick-off");
    if (project.members.some((member) => !member.email?.trim())) {
      throw new Error("Add an email address for each project member before scheduling the kick-off");
    }
    const appBaseUrl = (process.env.APP_URL || process.env.AUTH_URL || "http://localhost:3000").replace(/\/$/, "");
    calendarUrl = googleMeetScheduleUrl({
      title: `Kick-off: ${project.name}`,
      details: [
        `Project ${project.code}`,
        project.brief,
        `Project overview: ${appBaseUrl}/projects/${projectId}`,
      ].filter(Boolean).join("\n"),
      startLocal: kickoffAt,
      guestEmails: project.members.map((member) => member.email.trim().toLowerCase()),
    });
    await updateProjectKickoff(projectId, kickoffAt);
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(`/projects/${projectId}/setup/deliverables`, { error: messageOf(error) });
  }
  redirect(calendarUrl);
}

export async function notifyProjectTeamAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const path = `/projects/${projectId}/setup/deliverables`;
  let sentCount: number;
  try {
    await getCurrentUser();
    const result = await notifyProjectTeam(projectId);
    sentCount = result.sentCount;
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(path, { error: messageOf(error) });
  }
  redirectWith(path, { notice: `Email sent to ${sentCount} project ${sentCount === 1 ? "member" : "members"}` });
}

export async function addProjectMemberAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const path = `/projects/${projectId}/setup/team`;
  try {
    await getCurrentUser();
    await addProjectMember(projectId, field(formData, "userId"));
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(path, { error: messageOf(error) });
  }
  redirectWith(path, { notice: "Team member added" });
}

export async function removeProjectMemberAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const path = `/projects/${projectId}/setup/team`;
  try {
    await getCurrentUser();
    await removeProjectMember(projectId, field(formData, "userId"));
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(path, { error: messageOf(error) });
  }
  redirectWith(path, { notice: "Team member removed" });
}

export async function setOwnAvailabilityAction(formData: FormData): Promise<void> {
  const path = "/profile";
  try {
    await getCurrentUser();
    await setOwnAvailability(field(formData, "status"), field(formData, "note"));
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(path, { error: messageOf(error) });
  }
  redirectWith(path, { notice: "Your status was updated" });
}
