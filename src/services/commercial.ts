import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Client } from "@/models/Client";
import { Lead, type ILead, type LeadStage } from "@/models/Lead";
import { Project } from "@/models/Project";
import { PurchaseOrder, type IPurchaseOrder } from "@/models/PurchaseOrder";
import { SupplierBill, type ISupplierBill } from "@/models/SupplierBill";
import { Invoice, type IInvoice } from "@/models/Invoice";
import { ChangeRequest, type IChangeRequest, type CRReason } from "@/models/ChangeRequest";
import { createProject } from "@/services/projects";
import { type StudioProduct, type StudioCurrency } from "@/lib/domain";

export async function listLeads(stageFilter?: LeadStage) {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (stageFilter) query.stage = stageFilter;

  return Lead.find(query)
    .populate("assignedLeadId", "name title")
    .populate("convertedProjectId", "code name status")
    .sort({ createdAt: -1 })
    .lean();
}

export async function createLead(input: {
  clientName: string;
  companyName: string;
  email: string;
  phone?: string;
  products: StudioProduct[];
  estimatedValue?: number;
  currency?: StudioCurrency;
  notes?: string;
  assignedLeadId?: string;
}): Promise<ILead> {
  await connectDB();
  if (!input.companyName || input.companyName.trim().length === 0) {
    throw new Error("Company / Client brand is required");
  }

  const lead = await Lead.create({
    clientName: input.clientName.trim(),
    companyName: input.companyName.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() ?? "",
    stage: "inquiry",
    products: input.products,
    estimatedValue: input.estimatedValue ?? 0,
    currency: input.currency ?? "USD",
    notes: input.notes?.trim() ?? "",
    assignedLeadId: input.assignedLeadId ? new Types.ObjectId(input.assignedLeadId) : null,
  });

  return lead;
}

export async function updateLeadStage(leadId: string, stage: LeadStage) {
  await connectDB();
  return Lead.findByIdAndUpdate(leadId, { $set: { stage } }, { new: true });
}

export async function convertLeadToConfirmedProject(leadId: string, actorId: string) {
  await connectDB();
  const lead = await Lead.findById(leadId);
  if (!lead) throw new Error("Lead not found");

  // Ensure client exists
  let client = await Client.findOne({ name: lead.companyName });
  if (!client) {
    client = await Client.create({
      name: lead.companyName,
      brandName: lead.companyName,
      contacts: [
        {
          name: lead.clientName,
          email: lead.email,
          phone: lead.phone,
          isPrimary: true,
        },
      ],
      paymentTermsDays: 30,
      status: "active",
      relationshipOwnerId: lead.assignedLeadId,
    });
  }

  // Create confirmed project
  const project = await createProject({
    name: `${lead.companyName} Studio Project`,
    clientId: client._id.toString(),
    projectLeadId: lead.assignedLeadId ? lead.assignedLeadId.toString() : actorId,
    products: lead.products.length > 0 ? lead.products : ["turnkey_experience"],
    quotedValue: lead.estimatedValue,
    approvedContractValue: lead.estimatedValue,
    currency: lead.currency,
    brief: lead.notes,
  });

  // Advance project to Stage 04 Confirmation
  await Project.findByIdAndUpdate(project._id, {
    $set: {
      stage: "04_project_confirmation_handover",
      status: "planning",
    },
  });

  lead.stage = "won";
  lead.convertedProjectId = project._id;
  await lead.save();

  return project;
}

export async function getProjectCommercials(projectId: string) {
  await connectDB();
  const projectObjId = new Types.ObjectId(projectId);

  const [project, purchaseOrders, supplierBills, invoices] = await Promise.all([
    Project.findById(projectObjId).lean(),
    PurchaseOrder.find({ projectId: projectObjId })
      .populate("collectiveMemberId", "name type location specialisms")
      .sort({ createdAt: -1 })
      .lean(),
    SupplierBill.find({ projectId: projectObjId })
      .populate("purchaseOrderId", "poNumber scopeDescription")
      .sort({ createdAt: -1 })
      .lean(),
    Invoice.find({ projectId: projectObjId }).sort({ dueDate: 1 }).lean(),
  ]);

  if (!project) throw new Error("Project not found");

  // Invariant 3 & 4 Tri-Partite Financial Calculation
  // Committed costs = active unbilled balance on POs
  let openCommittedPOCosts = 0;
  for (const po of purchaseOrders) {
    if (po.status !== "cancelled") {
      const remainingUnbilled = Math.max(0, po.amount - (po.billedAmount ?? 0));
      openCommittedPOCosts += remainingUnbilled;
    }
  }

  // Actual costs = sum of all received/approved supplier bills
  let actualIncurredCosts = 0;
  for (const bill of supplierBills) {
    actualIncurredCosts += bill.amount;
  }

  // Total Projected Cost = actual incurred + active committed POs
  const projectedTotalCost = actualIncurredCosts + openCommittedPOCosts;
  const contractValue = project.approvedContractValue || project.quotedValue || 0;
  const projectedGrossMargin = contractValue - projectedTotalCost;
  const projectedMarginPercent = contractValue > 0 ? (projectedGrossMargin / contractValue) * 100 : 0;

  // Invoicing progress
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.status !== "not_invoiced" ? inv.amount : 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.status === "paid" ? inv.amount : 0), 0);

  return {
    project,
    purchaseOrders,
    supplierBills,
    invoices,
    financialSummary: {
      currency: project.currency,
      contractValue,
      estimatedBudget: project.estimatedTotalCost || 0,
      openCommittedPOCosts,
      actualIncurredCosts,
      projectedTotalCost,
      projectedGrossMargin,
      projectedMarginPercent,
      totalInvoiced,
      totalCollected,
      outstandingReceivables: totalInvoiced - totalCollected,
    },
  };
}

export async function createPurchaseOrder(input: {
  projectId: string;
  collectiveMemberId: string;
  scopeDescription: string;
  amount: number;
}): Promise<IPurchaseOrder> {
  await connectDB();
  const projObjId = new Types.ObjectId(input.projectId);
  const count = await PurchaseOrder.countDocuments({ projectId: projObjId });
  const project = await Project.findById(projObjId);
  const poCode = `PO-${project?.code ?? "MH"}-${String(count + 1).padStart(2, "0")}`;

  const po = await PurchaseOrder.create({
    projectId: projObjId,
    poNumber: poCode,
    collectiveMemberId: new Types.ObjectId(input.collectiveMemberId),
    scopeDescription: input.scopeDescription.trim(),
    amount: input.amount,
    billedAmount: 0,
    status: "issued",
    issuedAt: new Date(),
  });

  // Increment project committed costs
  await Project.findByIdAndUpdate(projObjId, { $inc: { committedTotalCost: input.amount } });

  return po;
}

export async function recordSupplierBill(input: {
  projectId: string;
  purchaseOrderId: string;
  billNumber: string;
  amount: number;
  notes?: string;
}): Promise<ISupplierBill> {
  await connectDB();
  const projObjId = new Types.ObjectId(input.projectId);
  const poObjId = new Types.ObjectId(input.purchaseOrderId);

  const po = await PurchaseOrder.findById(poObjId);
  if (!po) throw new Error("Purchase Order not found");

  const bill = await SupplierBill.create({
    projectId: projObjId,
    purchaseOrderId: poObjId,
    billNumber: input.billNumber.trim(),
    amount: input.amount,
    status: "approved",
    notes: input.notes?.trim() ?? "",
    receivedAt: new Date(),
  });

  // Invariant 4: Decrement active PO liability by billed amount
  po.billedAmount = (po.billedAmount ?? 0) + input.amount;
  if (po.billedAmount >= po.amount) {
    po.status = "fully_billed";
  } else {
    po.status = "partially_billed";
  }
  await po.save();

  // Increment actual incurred costs on project
  await Project.findByIdAndUpdate(projObjId, {
    $inc: {
      actualTotalCost: input.amount,
      committedTotalCost: -Math.min(input.amount, po.amount),
    },
  });

  return bill;
}

export async function createClientInvoice(input: {
  projectId: string;
  invoiceNumber: string;
  milestoneTitle: string;
  amount: number;
  percentage?: number;
  dueDate?: Date | null;
}): Promise<IInvoice> {
  await connectDB();
  const invoice = await Invoice.create({
    projectId: new Types.ObjectId(input.projectId),
    invoiceNumber: input.invoiceNumber.trim(),
    milestoneTitle: input.milestoneTitle.trim(),
    amount: input.amount,
    percentage: input.percentage,
    status: "invoiced",
    dueDate: input.dueDate ?? null,
  });

  return invoice;
}

export async function markInvoicePaid(invoiceId: string) {
  await connectDB();
  return Invoice.findByIdAndUpdate(
    invoiceId,
    { $set: { status: "paid", paidAt: new Date() } },
    { new: true },
  );
}

export async function listProjectChangeRequests(projectId: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(projectId)) return [];
  return ChangeRequest.find({ projectId: new Types.ObjectId(projectId) })
    .populate("approvedById", "name title")
    .sort({ createdAt: -1 })
    .lean();
}

export async function createManualChangeRequest(input: {
  projectId: string;
  title: string;
  reason: CRReason;
  description: string;
  clientRevenueDelta: number;
  internalCostDelta: number;
  timeDeltaDays: number;
}): Promise<IChangeRequest> {
  await connectDB();
  const projObjId = new Types.ObjectId(input.projectId);
  const count = await ChangeRequest.countDocuments({ projectId: projObjId });
  const code = `CR-${String(count + 1).padStart(3, "0")}`;

  const cr = await ChangeRequest.create({
    projectId: projObjId,
    code,
    title: input.title.trim(),
    reason: input.reason,
    description: input.description.trim(),
    clientRevenueDelta: input.clientRevenueDelta,
    internalCostDelta: input.internalCostDelta,
    timeDeltaDays: input.timeDeltaDays,
    status: "draft",
  });

  return cr;
}

export async function approveChangeRequest(changeRequestId: string, actorId: string) {
  await connectDB();
  const cr = await ChangeRequest.findById(changeRequestId);
  if (!cr) throw new Error("Change Request not found");
  if (cr.status === "client_approved") return cr;

  cr.status = "client_approved";
  cr.approvedById = new Types.ObjectId(actorId);
  cr.approvedAt = new Date();
  await cr.save();

  // Commercial Invariant: Update parent project financials and schedule
  const project = await Project.findById(cr.projectId);
  if (project) {
    project.approvedContractValue = (project.approvedContractValue || 0) + cr.clientRevenueDelta;
    project.estimatedTotalCost = (project.estimatedTotalCost || 0) + cr.internalCostDelta;

    if (cr.timeDeltaDays > 0 && project.deliveryDate) {
      const currentDelivery = new Date(project.deliveryDate);
      currentDelivery.setDate(currentDelivery.getDate() + cr.timeDeltaDays);
      project.deliveryDate = currentDelivery;
    }

    await project.save();
  }

  return cr;
}
