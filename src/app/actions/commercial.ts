"use server";

import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { assertName, field, fieldList } from "@/lib/parse";
import { parseDateInput } from "@/lib/format";
import { redirectWith } from "@/lib/redirect";
import { messageOf, type ActionResult } from "@/lib/result";
import { getCurrentUser } from "@/lib/session";
import {
  createLead,
  convertLeadToConfirmedProject,
  createPurchaseOrder,
  recordSupplierBill,
  createClientInvoice,
  markInvoicePaid,
} from "@/services/commercial";
import {
  isStudioProduct,
  type StudioCurrency,
} from "@/lib/domain";

export async function createLeadAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    const clientName = assertName(field(formData, "clientName"), "Contact name", 120);
    const companyName = assertName(field(formData, "companyName"), "Company name", 120);
    const email = field(formData, "email");
    const phone = field(formData, "phone");
    const estimatedValue = parseFloat(field(formData, "estimatedValue")) || 0;
    const currency = (field(formData, "currency") || "USD") as StudioCurrency;
    const notes = field(formData, "notes");
    const products = fieldList(formData, "products").filter(isStudioProduct);

    await createLead({
      clientName,
      companyName,
      email,
      phone,
      products: products.length > 0 ? products : ["turnkey_experience"],
      estimatedValue,
      currency,
      notes,
      assignedLeadId: user.id,
    });

    refresh();
    return { ok: true, notice: "Lead added to pipeline" };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: messageOf(error) };
  }
}

export async function createLeadFormAction(formData: FormData): Promise<void> {
  const result = await createLeadAction(null, formData);
  if (result.ok) {
    redirectWith("/sales", { notice: result.notice });
  } else {
    redirectWith("/sales", { error: result.error });
  }
}

export async function convertLeadFormAction(formData: FormData): Promise<void> {
  const leadId = field(formData, "leadId");
  try {
    const user = await getCurrentUser();
    const project = await convertLeadToConfirmedProject(leadId, user.id);
    refresh();
    redirectWith(`/projects/${project._id}`, {
      notice: `Lead confirmed! Project ${project.code} initialized at Stage 04 (Confirmation).`,
    });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith("/sales", { error: messageOf(error) });
  }
}

export async function createPOFormAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const collectiveMemberId = field(formData, "collectiveMemberId");
  const scopeDescription = field(formData, "scopeDescription");
  const amount = parseFloat(field(formData, "amount")) || 0;
  const path = `/projects/${projectId}/commercials`;

  try {
    await getCurrentUser();
    await createPurchaseOrder({
      projectId,
      collectiveMemberId,
      scopeDescription,
      amount,
    });
    refresh();
    redirectWith(path, { notice: "Purchase Order issued to collective partner" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(path, { error: messageOf(error) });
  }
}

export async function recordBillFormAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const purchaseOrderId = field(formData, "purchaseOrderId");
  const billNumber = field(formData, "billNumber");
  const amount = parseFloat(field(formData, "amount")) || 0;
  const notes = field(formData, "notes");
  const path = `/projects/${projectId}/commercials`;

  try {
    await getCurrentUser();
    await recordSupplierBill({
      projectId,
      purchaseOrderId,
      billNumber,
      amount,
      notes,
    });
    refresh();
    redirectWith(path, { notice: "Supplier invoice recorded against Purchase Order" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(path, { error: messageOf(error) });
  }
}

export async function createInvoiceFormAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const invoiceNumber = field(formData, "invoiceNumber");
  const milestoneTitle = field(formData, "milestoneTitle");
  const amount = parseFloat(field(formData, "amount")) || 0;
  const percentage = parseFloat(field(formData, "percentage")) || undefined;
  const dueDate = parseDateInput(field(formData, "dueDate"));
  const path = `/projects/${projectId}/commercials`;

  try {
    await getCurrentUser();
    await createClientInvoice({
      projectId,
      invoiceNumber,
      milestoneTitle,
      amount,
      percentage,
      dueDate,
    });
    refresh();
    redirectWith(path, { notice: "Client milestone invoice created" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(path, { error: messageOf(error) });
  }
}

export async function markInvoicePaidFormAction(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const invoiceId = field(formData, "invoiceId");
  const path = `/projects/${projectId}/commercials`;

  try {
    await getCurrentUser();
    await markInvoicePaid(invoiceId);
    refresh();
    redirectWith(path, { notice: "Client payment confirmed and logged" });
  } catch (error) {
    unstable_rethrow(error);
    redirectWith(path, { error: messageOf(error) });
  }
}
