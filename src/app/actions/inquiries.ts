"use server";

import { refresh } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { googleMeetScheduleUrl } from "@/lib/google-meet";
import { inquiryApology } from "@/lib/inquiry-apology";
import { field, fieldList } from "@/lib/parse";
import { redirectWith } from "@/lib/redirect";
import { messageOf } from "@/lib/result";
import { getCurrentUser } from "@/lib/session";
import {
  approveInquiry,
  assignInquiryLeads,
  convertInquiryToProject,
  createInquiry,
  declineInquiry,
  getInquiry,
  scheduleInquiryCall,
  startProjectPlanning,
} from "@/services/inquiries";

const LIST = "/sales/inquiries";

export async function createInquiryFormAction(formData: FormData): Promise<void> {
  try {
    await getCurrentUser();
    await createInquiry({
      brandName: field(formData, "brandName"),
      projectName: field(formData, "projectName"),
      clientName: field(formData, "clientName"),
      clientContact: field(formData, "clientContact"),
      product: field(formData, "product"),
      source: field(formData, "source"),
      scope: fieldList(formData, "scope"),
      deliveryDate: field(formData, "deliveryDate") || null,
      budget: parseFloat(field(formData, "budget")) || 0,
      currency: field(formData, "currency") || "USD",
      location: field(formData, "location"),
      notes: field(formData, "notes"),
    });
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(`${LIST}/new`, { error: messageOf(error) });
  }
  redirectWith(LIST, { notice: "Inquiry submitted. Leadership will review it within one working day." });
}

export async function scheduleInquiryCallFormAction(formData: FormData): Promise<void> {
  const id = field(formData, "inquiryId");
  const path = `${LIST}/${id}`;
  let meetUrl = "";
  try {
    const callAt = field(formData, "callAt");
    const callNotes = field(formData, "callNotes");
    await scheduleInquiryCall(id, callAt, callNotes);
    const inquiry = await getInquiry(id);
    const base = (process.env.APP_URL || process.env.AUTH_URL || "http://localhost:3000").replace(/\/$/, "");
    meetUrl = googleMeetScheduleUrl({
      title: `Call: ${inquiry.projectName} (${inquiry.brandName})`,
      details: [callNotes, `Inquiry: ${base}${path}`].filter(Boolean).join("\n\n"),
      startLocal: callAt,
      guestEmails: inquiry.clientContact.includes("@") ? [inquiry.clientContact] : undefined,
    });
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(path, { error: messageOf(error) });
  }
  redirect(meetUrl);
}

export async function approveInquiryFormAction(formData: FormData): Promise<void> {
  const id = field(formData, "inquiryId");
  const path = `${LIST}/${id}`;
  try {
    await approveInquiry(id, fieldList(formData, "projectLeadIds"));
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(path, { error: messageOf(error) });
  }
  redirectWith(path, { notice: "Inquiry approved. Convert it to project setup when ready." });
}

export async function assignInquiryLeadsFormAction(formData: FormData): Promise<void> {
  const id = field(formData, "inquiryId");
  const path = `${LIST}/${id}`;
  try {
    await assignInquiryLeads(id, fieldList(formData, "projectLeadIds"));
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(path, { error: messageOf(error) });
  }
  redirectWith(path, { notice: "Project leads updated" });
}

export async function declineInquiryFormAction(formData: FormData): Promise<void> {
  const id = field(formData, "inquiryId");
  const path = `${LIST}/${id}`;
  let apologyHref: string | null = null;
  let notice = "";
  try {
    const { inquiry, reporterNotified } = await declineInquiry(id, field(formData, "reason"));
    apologyHref = inquiryApology(inquiry).href;
    notice = reporterNotified
      ? "Declined. The submitter was notified."
      : "Declined. The submitter will see it on their inquiry list.";
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(path, { error: messageOf(error) });
  }
  if (apologyHref) redirect(apologyHref);
  redirectWith(path, { notice });
}

export async function startProjectPlanningFormAction(formData: FormData): Promise<void> {
  const id = field(formData, "inquiryId");
  let projectId = "";
  let notice = "";
  try {
    const { project, emailsSent, emailsTotal } = await startProjectPlanning(id, fieldList(formData, "projectLeadIds"));
    projectId = project._id;
    notice =
      `Approved. Project ${project.code} created. ` +
      (emailsSent > 0
        ? `${emailsSent} of ${emailsTotal} notification emails sent. `
        : "No notification emails were sent because email is not configured. ") +
      "Complete the project setup below.";
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(`${LIST}/${id}`, { error: messageOf(error) });
  }
  redirectWith(`/projects/${projectId}/setup`, { notice });
}

export async function convertInquiryFormAction(formData: FormData): Promise<void> {
  const id = field(formData, "inquiryId");
  let projectId = "";
  let notice = "";
  try {
    const { project, emailsSent, emailsTotal } = await convertInquiryToProject(id);
    projectId = project._id;
    notice =
      `Project ${project.code} created. ` +
      (emailsSent > 0
        ? `${emailsSent} of ${emailsTotal} notification emails sent. `
        : "No notification emails were sent because email is not configured. ") +
      "Complete the project setup below.";
    refresh();
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(`${LIST}/${id}`, { error: messageOf(error) });
  }
  redirectWith(`/projects/${projectId}/setup`, { notice });
}
