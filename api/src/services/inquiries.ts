import "@/models/User"; // registers the schema for populate of user refs
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { sendInquiryDeclinedEmail, sendProjectAssignedEmail } from "@/lib/mail";
import {
  CURRENCIES,
  INQUIRY_PRODUCT_TO_STUDIO,
  INQUIRY_SCOPES,
  isInquiryProduct,
  isInquirySource,
  type InquiryProduct,
  type StudioCurrency,
} from "@/lib/domain";
import { Client } from "@/models/Client";
import { Inquiry, type IInquiry } from "@/models/Inquiry";
import { User } from "@/models/User";
import { createProject } from "@/services/projects";

export type InquiryInput = {
  brandName: string;
  projectName: string;
  clientName: string;
  clientContact: string;
  product: string;
  source: string;
  scope?: string[];
  deliveryDate?: string | null;
  budget?: number;
  currency?: string;
  location?: string;
  notes?: string;
};

export type InquirySubmitter = { id: string; name: string; email: string };

function requireText(value: string | undefined, label: string) {
  const text = value?.trim() ?? "";
  if (!text) throw new Error(`${label} is required`);
  return text;
}

function parseDate(value: string | null | undefined, label: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} is not a valid date`);
  return date;
}

function objectIds(values: string[]) {
  const unique = [...new Set(values)];
  if (unique.some((value) => !Types.ObjectId.isValid(value))) throw new Error("Choose valid project leads");
  return unique.map((value) => new Types.ObjectId(value));
}

async function findInquiry(id: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(id)) throw new Error("Inquiry not found");
  const inquiry = await Inquiry.findById(id);
  if (!inquiry) throw new Error("Inquiry not found");
  return inquiry;
}

export async function listInquiries(filter: { userId?: string } = {}) {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (filter.userId && Types.ObjectId.isValid(filter.userId)) {
    const userId = new Types.ObjectId(filter.userId);
    query.$or = [{ submittedById: userId }, { projectLeadIds: userId }];
  }
  return Inquiry.find(query)
    .populate("projectLeadIds", "name title")
    .populate("convertedProjectId", "code name status")
    .sort({ createdAt: -1 })
    .lean();
}

export async function getInquiry(id: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(id)) return null;
  return Inquiry.findById(id)
    .populate("projectLeadIds", "name title")
    .populate("convertedProjectId", "code name status")
    .lean();
}

export async function createInquiry(input: InquiryInput, submitter: InquirySubmitter): Promise<IInquiry> {
  await connectDB();
  if (!isInquiryProduct(input.product)) throw new Error("Choose a product");
  if (!isInquirySource(input.source)) throw new Error("Choose an inquiry source");
  const budget = Number(input.budget ?? 0);
  if (!Number.isFinite(budget) || budget < 0) throw new Error("Budget must be zero or more");
  const currency = (CURRENCIES as readonly string[]).includes(input.currency ?? "")
    ? (input.currency as StudioCurrency)
    : "USD";

  return Inquiry.create({
    brandName: requireText(input.brandName, "Brand name"),
    projectName: requireText(input.projectName, "Project name"),
    clientName: requireText(input.clientName, "Client name"),
    clientContact: requireText(input.clientContact, "Client contact"),
    product: input.product,
    source: input.source,
    scope: (input.scope ?? []).filter((item) => (INQUIRY_SCOPES as readonly string[]).includes(item)),
    deliveryDate: parseDate(input.deliveryDate, "Delivery date"),
    budget,
    currency,
    location: input.location?.trim() ?? "",
    notes: input.notes?.trim() ?? "",
    status: "pending",
    submittedById: new Types.ObjectId(submitter.id),
    submittedByName: submitter.name,
    submittedByEmail: submitter.email,
  });
}

export async function scheduleInquiryCall(id: string, callAt: string, notes?: string) {
  const inquiry = await findInquiry(id);
  if (inquiry.status !== "pending") throw new Error("Calls can only be scheduled while the inquiry is pending");
  const date = parseDate(callAt, "Call time");
  if (!date) throw new Error("Choose a call date and time");
  inquiry.callScheduledAt = date;
  inquiry.callNotes = notes?.trim() ?? "";
  await inquiry.save();
  return inquiry;
}

export async function approveInquiry(id: string, deciderId: string, projectLeadIds: string[]) {
  const inquiry = await findInquiry(id);
  if (inquiry.status !== "pending") throw new Error("Only a pending inquiry can be approved");
  if (projectLeadIds.length === 0) throw new Error("Assign at least one project lead");
  inquiry.projectLeadIds = objectIds(projectLeadIds);
  inquiry.status = "approved";
  inquiry.decidedById = new Types.ObjectId(deciderId);
  inquiry.decidedAt = new Date();
  await inquiry.save();
  return inquiry;
}

export async function assignInquiryLeads(id: string, projectLeadIds: string[]) {
  const inquiry = await findInquiry(id);
  if (inquiry.status !== "approved") throw new Error("Project leads can only be changed on an approved inquiry");
  if (projectLeadIds.length === 0) throw new Error("Assign at least one project lead");
  inquiry.projectLeadIds = objectIds(projectLeadIds);
  await inquiry.save();
  return inquiry;
}

/** Approves a pending inquiry with its project leads and creates the project in one step. */
export async function startProjectPlanning(id: string, deciderId: string, projectLeadIds: string[]) {
  const inquiry = await findInquiry(id);
  if (inquiry.status === "pending") await approveInquiry(id, deciderId, projectLeadIds);
  else if (inquiry.status === "approved" && projectLeadIds.length > 0) await assignInquiryLeads(id, projectLeadIds);
  return convertInquiryToProject(id);
}

export async function declineInquiry(id: string, deciderId: string, reason: string) {
  const inquiry = await findInquiry(id);
  if (inquiry.status !== "pending") throw new Error("Only a pending inquiry can be declined");
  const text = reason.trim();
  if (!text) throw new Error("Explain why the inquiry is declined");
  inquiry.status = "declined";
  inquiry.declineReason = text;
  inquiry.decidedById = new Types.ObjectId(deciderId);
  inquiry.decidedAt = new Date();
  await inquiry.save();

  if (inquiry.submittedByEmail) {
    const mail = await sendInquiryDeclinedEmail({
      to: inquiry.submittedByEmail,
      reporterName: inquiry.submittedByName,
      projectName: inquiry.projectName,
      brandName: inquiry.brandName,
      reason: text,
      inquiryPath: `/sales/inquiries/${inquiry._id}`,
    });
    return { inquiry, mail };
  }
  return { inquiry, mail: { sent: false, error: "No reporter email on file" } };
}

export async function convertInquiryToProject(id: string) {
  const inquiry = await findInquiry(id);
  if (inquiry.convertedProjectId) throw new Error("This inquiry is already a project");
  if (inquiry.status !== "approved") throw new Error("Only an approved inquiry can become a project");
  const [leadId, ...team] = inquiry.projectLeadIds.map(String);
  if (!leadId) throw new Error("Assign a project lead first");

  const contactIsEmail = inquiry.clientContact.includes("@");
  let client = await Client.findOne({ name: inquiry.brandName });
  if (!client) {
    client = await Client.create({
      name: inquiry.brandName,
      brandName: inquiry.brandName,
      contacts: contactIsEmail
        ? [{ name: inquiry.clientName, email: inquiry.clientContact, isPrimary: true }]
        : [],
      paymentTermsDays: 30,
      status: "active",
    });
  }

  const project = await createProject({
    name: inquiry.projectName,
    clientId: String(client._id),
    projectLeadId: leadId,
    teamUserIds: team,
    scopeItems: inquiry.scope,
    products: [INQUIRY_PRODUCT_TO_STUDIO[inquiry.product as InquiryProduct]],
    quotedValue: inquiry.budget,
    currency: inquiry.currency,
    location: inquiry.location,
    deliveryDate: inquiry.deliveryDate ?? null,
    brief: inquiry.notes,
  });

  inquiry.status = "converted";
  inquiry.convertedProjectId = project._id;
  await inquiry.save();

  const recipients = new Map<string, { name: string; reason: "lead" | "reporter" }>();
  const leads = await User.find({ _id: { $in: inquiry.projectLeadIds } }).select("name email").lean();
  for (const lead of leads) {
    if (lead.email) recipients.set(lead.email.toLowerCase(), { name: lead.name, reason: "lead" });
  }
  const reporterEmail = inquiry.submittedByEmail.toLowerCase();
  if (reporterEmail && !recipients.has(reporterEmail)) {
    recipients.set(reporterEmail, { name: inquiry.submittedByName, reason: "reporter" });
  }

  const results = await Promise.all(
    [...recipients].map(([to, who]) =>
      sendProjectAssignedEmail({
        to,
        recipientName: who.name,
        reason: who.reason,
        projectName: project.name,
        projectCode: project.code,
        brandName: inquiry.brandName,
        projectPath: `/projects/${project._id}/setup`,
      }),
    ),
  );
  return { project, emailsSent: results.filter((result) => result.sent).length, emailsTotal: results.length };
}
