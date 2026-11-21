import "@/models/Client"; // registers the schema for populate("clientId")
import "@/models/User"; // registers the schema for populate of user refs
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import {
  PROJECT_STAGES,
  PROJECT_SETUP_PHASES,
  NON_BYPASSABLE_STAGES,
  isAvailabilityStatus,
  type ProjectStage,
  type ProjectStatus,
  type StudioProduct,
  type StudioCurrency,
} from "@/lib/domain";
import { Project, type IProject, type IProjectMilestone } from "@/models/Project";
import { Activity } from "@/models/Activity";
import { Task } from "@/models/Task";
import { Deliverable } from "@/models/Deliverable";
import { Invoice } from "@/models/Invoice";
import { PurchaseOrder } from "@/models/PurchaseOrder";
import { SupplierBill } from "@/models/SupplierBill";
import { Team } from "@/models/Team";
import { User } from "@/models/User";

export type CreateProjectInput = {
  name: string;
  clientId: string;
  projectLeadId: string;
  products: StudioProduct[];
  brief?: string;
  objectives?: string;
  audience?: string;
  location?: string;
  currency?: StudioCurrency;
  quotedValue?: number;
  approvedContractValue?: number;
  contractedRevisionRounds?: number;
  startDate?: Date | null;
  deliveryDate?: Date | null;
  bypassedStages?: ProjectStage[];
  estimatedTotalCost?: number;
  teamUserIds?: string[];
  scopeItems?: string[];
};

export async function generateProjectCode(year: number = new Date().getFullYear()): Promise<string> {
  await connectDB();
  const prefix = `MH-${year}-`;
  const latest = await Project.findOne({ code: new RegExp(`^${prefix}`) })
    .sort({ code: -1 })
    .select("code")
    .lean();

  let nextSequence = 1;
  if (latest?.code) {
    const parts = latest.code.split("-");
    const num = parseInt(parts[2], 10);
    if (!isNaN(num)) nextSequence = num + 1;
  }
  return `${prefix}${String(nextSequence).padStart(3, "0")}`;
}

export async function createProject(input: CreateProjectInput): Promise<IProject> {
  await connectDB();

  if (!input.name || input.name.trim().length === 0) {
    throw new Error("Project name is required");
  }
  if (!input.clientId || !Types.ObjectId.isValid(input.clientId)) {
    throw new Error("A valid client is required");
  }
  if (!input.projectLeadId || !Types.ObjectId.isValid(input.projectLeadId)) {
    throw new Error("A valid project lead is required");
  }
  if (!input.products || input.products.length === 0) {
    throw new Error("At least one product must be selected");
  }

  const bypassed = assertBypassable(input.bypassedStages ?? []);

  // Generate unique code
  const code = await generateProjectCode();

  // Initialize all 11 milestone records
  const milestones: IProjectMilestone[] = PROJECT_STAGES.map((st) => ({
    stage: st,
    targetDate: null,
    completedAt: null,
    isGateApproved: false,
    approvedById: null,
    approvalNotes: "",
  }));

  const project = await Project.create({
    code,
    name: input.name.trim(),
    clientId: new Types.ObjectId(input.clientId),
    projectLeadId: new Types.ObjectId(input.projectLeadId),
    products: input.products,
    stage: "01_lead_inquiry",
    bypassedStages: bypassed,
    status: "not_started",
    health: "on_track",
    brief: input.brief?.trim() ?? "",
    objectives: input.objectives?.trim() ?? "",
    scopeItems: input.scopeItems ?? [],
    audience: input.audience?.trim() ?? "",
    location: input.location?.trim() ?? "",
    startDate: input.startDate ?? null,
    deliveryDate: input.deliveryDate ?? null,
    closeDate: null,
    isDelivered: false,
    currency: input.currency ?? "USD",
    quotedValue: input.quotedValue ?? 0,
    approvedContractValue: input.approvedContractValue ?? 0,
    contractedRevisionRounds: input.contractedRevisionRounds ?? 2,
    estimatedTotalCost: Math.max(0, input.estimatedTotalCost ?? 0),
    committedTotalCost: 0,
    actualTotalCost: 0,
    milestones,
    teamUserIds: validIds(input.teamUserIds),
    workstreams: [
      { key: "delivery", name: "Delivery", lane: "project_delivery" },
      { key: "communication", name: "Communication", lane: "communication" },
    ],
  });

  await ensureCommunicationTasks(project._id, actorFromLead(input.projectLeadId));
  return project;
}

function actorFromLead(id: string) {
  return id;
}

async function ensureCommunicationTasks(projectId: Types.ObjectId, ownerFallback: string) {
  const lane = await Team.findOne({ name: "Communication" });
  if (!lane) return;
  const owner = await User.findOne({ functionalRoles: "content_documentation" });
  const ownerId = owner?._id ?? new Types.ObjectId(ownerFallback);
  const existing = await Task.countDocuments({ projectId, workstreamKey: "communication" });
  if (existing > 0) return;
  await Task.insertMany(
    PROJECT_STAGES.map((stage) => ({
      projectId,
      stage,
      teamId: lane._id,
      accountableOwnerId: ownerId,
      assigneeId: ownerId,
      title: `Documentation · ${stage}`,
      description: "Communication runs in parallel with this stage.",
      status: "todo",
      taskCategory: "continuous_support",
      isGatePrerequisite: false,
      workstreamKey: "communication",
      mustBeReadyBefore: [],
    })),
  );
}

export type UpdateProjectInput = CreateProjectInput;

function assertBypassable(bypassed: ProjectStage[]) {
  const invalidBypass = bypassed.filter((stage) => (NON_BYPASSABLE_STAGES as readonly string[]).includes(stage));
  if (invalidBypass.length > 0) {
    throw new Error(`Cannot bypass mandatory governance stages: ${invalidBypass.join(", ")}`);
  }
  return bypassed;
}

function validIds(ids: string[] = []) {
  return [...new Set(ids)].filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
}

/** Edit a project's details after creation. Stage, status, financial actuals and closeout keep their own flows. */
export async function updateProject(projectId: string, input: UpdateProjectInput) {
  await connectDB();
  if (!Types.ObjectId.isValid(projectId)) throw new Error("Project not found");
  if (!input.name?.trim()) throw new Error("Project name is required");
  if (!input.clientId || !Types.ObjectId.isValid(input.clientId)) {
    throw new Error("A valid client is required");
  }
  if (!input.projectLeadId || !Types.ObjectId.isValid(input.projectLeadId)) {
    throw new Error("A valid project lead is required");
  }
  if (!input.products?.length) throw new Error("At least one product must be selected");
  if (input.startDate && input.deliveryDate && input.deliveryDate < input.startDate) {
    throw new Error("Delivery date can't be before the start date");
  }
  const bypassed = assertBypassable(input.bypassedStages ?? []);

  const project = await Project.findByIdAndUpdate(
    projectId,
    {
      $set: {
        name: input.name.trim(),
        clientId: new Types.ObjectId(input.clientId),
        projectLeadId: new Types.ObjectId(input.projectLeadId),
        products: input.products,
        brief: input.brief?.trim() ?? "",
        objectives: input.objectives?.trim() ?? "",
        audience: input.audience?.trim() ?? "",
        location: input.location?.trim() ?? "",
        startDate: input.startDate ?? null,
        deliveryDate: input.deliveryDate ?? null,
        currency: input.currency ?? "USD",
        quotedValue: Math.max(0, input.quotedValue ?? 0),
        approvedContractValue: Math.max(0, input.approvedContractValue ?? 0),
        contractedRevisionRounds: Math.max(1, Math.round(input.contractedRevisionRounds ?? 2)),
        estimatedTotalCost: Math.max(0, input.estimatedTotalCost ?? 0),
        bypassedStages: bypassed,
        teamUserIds: validIds(input.teamUserIds),
      },
    },
    { returnDocument: "after", runValidators: true },
  );
  if (!project) throw new Error("Project not found");
  return project;
}

/** Overview & Scope tab: brief, creative lead, and the selected scope items. */
export async function updateProjectSetup(
  projectId: string,
  input: {
    brief?: string;
    creativeLeadId?: string | null;
    scopeItems?: string[];
  },
) {
  await connectDB();
  if (input.creativeLeadId && !Types.ObjectId.isValid(input.creativeLeadId)) {
    throw new Error("Choose a valid creative lead");
  }

  const update: Record<string, unknown> = {
    brief: input.brief?.trim() ?? "",
    creativeLeadId: input.creativeLeadId ? new Types.ObjectId(input.creativeLeadId) : null,
    scopeItems: [...new Set(input.scopeItems ?? [])],
  };
  const project = await Project.findByIdAndUpdate(projectId, { $set: update }, { returnDocument: "after" });
  if (!project) throw new Error("Project not found");
  return project;
}

export async function updateProjectTimeline(
  projectId: string,
  input: {
    startDate?: string | null;
    deliveryDate?: string | null;
    phases: Array<{ name: string; durationDays: number; ownerId?: string | null }>;
  },
) {
  await connectDB();
  const start = input.startDate ? new Date(input.startDate) : null;
  const delivery = input.deliveryDate ? new Date(input.deliveryDate) : null;
  if (!start || !delivery) throw new Error("Set both the project start date and delivery date");
  if ((start && Number.isNaN(start.getTime())) || (delivery && Number.isNaN(delivery.getTime()))) {
    throw new Error("Enter valid dates");
  }
  if (start && delivery && delivery < start) throw new Error("Delivery date can't be before the start date");
  if (input.phases.length !== PROJECT_SETUP_PHASES.length) throw new Error("All project phases are required");

  const project = await Project.findById(projectId).select("teamUserIds projectLeadId setupPhases").lean();
  if (!project) throw new Error("Project not found");
  const eligibleOwners = new Set([String(project.projectLeadId), ...project.teamUserIds.map(String)]);
  const existingPhases = new Map((project.setupPhases ?? []).map((phase) => [phase.name, phase]));
  const phases = input.phases.map((phase, index) => {
    if (phase.name !== PROJECT_SETUP_PHASES[index]) throw new Error("Project phases can't be changed");
    if (!Number.isInteger(phase.durationDays) || phase.durationDays < 0 || phase.durationDays > 3650) {
      throw new Error(`Enter a valid duration for ${phase.name}`);
    }
    if (phase.ownerId && (!Types.ObjectId.isValid(phase.ownerId) || !eligibleOwners.has(phase.ownerId))) {
      throw new Error(`Choose a project member to own ${phase.name}`);
    }
    const saved = existingPhases.get(phase.name);
    return {
      name: phase.name,
      durationDays: phase.durationDays,
      ownerId: phase.ownerId ? new Types.ObjectId(phase.ownerId) : null,
      deliverables: saved?.deliverables ?? "",
    };
  });

  const updated = await Project.findByIdAndUpdate(
    projectId,
    { $set: { startDate: start, deliveryDate: delivery, setupPhases: phases } },
    { returnDocument: "after", runValidators: true },
  );
  if (!updated) throw new Error("Project not found");
  return updated;
}

export async function updateProjectSetupDeliverables(
  projectId: string,
  input: { phases: Array<{ name: string; deliverables: string }> },
) {
  await connectDB();
  if (input.phases.length !== PROJECT_SETUP_PHASES.length) throw new Error("All project phases are required");
  const project = await Project.findById(projectId).select("setupPhases").lean();
  if (!project) throw new Error("Project not found");
  const existing = new Map((project.setupPhases ?? []).map((phase) => [phase.name, phase]));
  const phases = input.phases.map((phase, index) => {
    if (phase.name !== PROJECT_SETUP_PHASES[index]) throw new Error("Project phases can't be changed");
    const saved = existing.get(phase.name);
    return {
      name: phase.name,
      durationDays: saved?.durationDays ?? 0,
      ownerId: saved?.ownerId ?? null,
      deliverables: phase.deliverables.trim().slice(0, 5000),
    };
  });
  const updated = await Project.findByIdAndUpdate(
    projectId,
    { $set: { setupPhases: phases } },
    { returnDocument: "after", runValidators: true },
  );
  if (!updated) throw new Error("Project not found");
  return updated;
}

export async function updateProjectKickoff(projectId: string, kickoffAt: string) {
  await connectDB();
  const date = new Date(kickoffAt);
  if (Number.isNaN(date.getTime())) throw new Error("Choose a valid kick-off date and time");
  const project = await Project.findByIdAndUpdate(
    projectId,
    { $set: { kickoffAt: date } },
    { returnDocument: "after", runValidators: true },
  );
  if (!project) throw new Error("Project not found");
  return project;
}

/** Team tab: everyone on the project with their title and availability, plus people who can still be added. */
export async function getProjectTeam(projectId: string) {
  await connectDB();
  const project = await Project.findById(projectId).select("projectLeadId teamUserIds").lean();
  if (!project) throw new Error("Project not found");

  const users = await User.find({ isActive: { $ne: false }, isVacant: { $ne: true } })
    .select("name title availability availabilityNote availabilityUpdatedAt +profileImage")
    .sort({ name: 1 })
    .lean();
  const leadId = String(project.projectLeadId);
  const memberIds = new Set([leadId, ...project.teamUserIds.map(String)]);
  const view = (u: (typeof users)[number]) => ({
    id: String(u._id),
    name: u.name,
    title: u.title ?? "",
    profileImage: u.profileImage ?? "",
    availability: u.availability ?? "available",
    availabilityNote: u.availabilityNote ?? "",
    availabilityUpdatedAt: u.availabilityUpdatedAt ? u.availabilityUpdatedAt.toISOString() : null,
    isLead: String(u._id) === leadId,
  });

  const members = users
    .filter((u) => memberIds.has(String(u._id)))
    .map(view)
    .sort((a, b) => Number(b.isLead) - Number(a.isLead));
  const candidates = users.filter((u) => !memberIds.has(String(u._id))).map(view);
  return { members, candidates };
}

export async function addProjectMember(projectId: string, userId: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(userId)) throw new Error("Choose a team member");
  if (!(await User.exists({ _id: userId, isActive: { $ne: false }, isVacant: { $ne: true } }))) {
    throw new Error("That person is no longer available to add");
  }
  const project = await Project.findByIdAndUpdate(
    projectId,
    { $addToSet: { teamUserIds: new Types.ObjectId(userId) } },
    { returnDocument: "after" },
  );
  if (!project) throw new Error("Project not found");
  return project;
}

export async function removeProjectMember(projectId: string, userId: string) {
  await connectDB();
  const project = await Project.findById(projectId).select("projectLeadId");
  if (!project) throw new Error("Project not found");
  if (String(project.projectLeadId) === userId) throw new Error("The project lead can't be removed from the team");
  await Project.updateOne({ _id: projectId }, { $pull: { teamUserIds: new Types.ObjectId(userId) } });
  return { ok: true };
}

/** A person updates their own status. Test roster accounts are matched by email. */
export async function setOwnAvailability(
  actor: { id: string; email: string },
  status: string,
  note: string,
) {
  await connectDB();
  if (!isAvailabilityStatus(status)) throw new Error("Choose a valid status");
  const match: Record<string, unknown>[] = [];
  if (Types.ObjectId.isValid(actor.id)) match.push({ _id: new Types.ObjectId(actor.id) });
  if (actor.email) match.push({ email: actor.email.toLowerCase() });
  const user = await User.findOneAndUpdate(
    { $or: match },
    {
      $set: {
        availability: status,
        availabilityNote: status === "available" ? "" : note.trim().slice(0, 120),
        availabilityUpdatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );
  if (!user) throw new Error("Your profile could not be found");
  return { availability: user.availability, availabilityNote: user.availabilityNote };
}

export async function getOwnAvailability(actor: { id: string; email: string }) {
  await connectDB();
  const match: Record<string, unknown>[] = [];
  if (Types.ObjectId.isValid(actor.id)) match.push({ _id: new Types.ObjectId(actor.id) });
  if (actor.email) match.push({ email: actor.email.toLowerCase() });
  const user = await User.findOne({ $or: match }).select("availability availabilityNote").lean();
  return { availability: user?.availability ?? "available", availabilityNote: user?.availabilityNote ?? "" };
}

export async function getProjectById(id: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(id)) return null;

  return Project.findById(id)
    .populate("clientId", "name brandName contacts billingAddress")
    .populate("projectLeadId", "name email title role functionalRoles")
    .populate("creativeLeadId", "name title")
    .populate("teamUserIds", "name email title role laneIds functionalRoles")
    .lean();
}

export async function listProjects(filter: {
  stage?: ProjectStage;
  status?: ProjectStatus;
  product?: StudioProduct;
  clientId?: string;
  projectLeadId?: string;
  userId?: string;
  isExecutive?: boolean;
} = {}) {
  await connectDB();
  const query: Record<string, unknown> = {};

  if (filter.stage) query.stage = filter.stage;
  if (filter.status) query.status = filter.status;
  if (filter.product) query.products = filter.product;
  if (filter.clientId && Types.ObjectId.isValid(filter.clientId)) {
    query.clientId = new Types.ObjectId(filter.clientId);
  }
  if (filter.projectLeadId && Types.ObjectId.isValid(filter.projectLeadId)) {
    query.projectLeadId = new Types.ObjectId(filter.projectLeadId);
  }

  // Non-executive visibility: must be on teamUserIds or projectLeadId
  if (filter.userId && !filter.isExecutive) {
    const userObjId = new Types.ObjectId(filter.userId);
    query.$or = [{ projectLeadId: userObjId }, { teamUserIds: userObjId }];
  }

  return Project.find(query)
    .populate("clientId", "name brandName")
    .populate("projectLeadId", "name title")
    .sort({ createdAt: -1 })
    .lean();
}

function nextOpenStage(current: ProjectStage, bypassed: ProjectStage[]): ProjectStage | null {
  let index = PROJECT_STAGES.indexOf(current) + 1;
  while (index < PROJECT_STAGES.length && bypassed.includes(PROJECT_STAGES[index])) index += 1;
  return index < PROJECT_STAGES.length ? PROJECT_STAGES[index] : null;
}

async function assertStageGate(project: IProject & { _id: Types.ObjectId }, override: boolean) {
  if (override) return;
  const openGates = await Task.countDocuments({
    projectId: project._id,
    stage: project.stage,
    isGatePrerequisite: true,
    status: { $nin: ["done", "approved"] },
  });
  if (openGates > 0) throw new Error("Gate tasks for this stage are still open");

  const needsDesign = project.stage === "06_creative_concept_development" || project.stage === "07_design_development_refinement" || project.stage === "08_planning_pre_production";
  if (needsDesign) {
    const approved = await Deliverable.countDocuments({
      projectId: project._id,
      stage: project.stage === "08_planning_pre_production" ? "07_design_development_refinement" : project.stage,
      status: { $in: ["approved", "final"] },
    });
    if (approved === 0) throw new Error("An approved deliverable is required before this stage can move");
  }
  if (project.stage === "04_project_confirmation_handover" && !project.depositReceived && !project.confirmationNotes) {
    throw new Error("Stage 05 needs a deposit or written confirmation");
  }
  if (project.stage === "08_planning_pre_production" && !project.budgetApproved) {
    throw new Error("Production needs an approved budget");
  }
}

export async function advanceProjectStage(
  projectId: string,
  targetStage: ProjectStage,
  actorId: string,
  notes?: string,
  override = false,
) {
  await connectDB();
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  const targetIndex = PROJECT_STAGES.indexOf(targetStage);
  const expected = nextOpenStage(project.stage, project.bypassedStages);

  if (targetIndex < 0) throw new Error("Invalid target stage");
  if (!expected) throw new Error("This project is already at the last stage");
  const rawNext = PROJECT_STAGES[PROJECT_STAGES.indexOf(project.stage) + 1];
  if (targetStage !== expected && targetStage !== rawNext) {
    throw new Error(`The next stage is ${expected}`);
  }
  targetStage = expected;
  await assertStageGate(project, override);

  const currentMilestone = project.milestones.find((m) => m.stage === project.stage);
  if (currentMilestone) {
    currentMilestone.isGateApproved = true;
    currentMilestone.approvedById = new Types.ObjectId(actorId);
    currentMilestone.completedAt = new Date();
    if (notes) currentMilestone.approvalNotes = notes;
  }

  await Activity.create({
    projectId: project._id,
    actorId: new Types.ObjectId(actorId),
    type: "decision",
    detail: override
      ? `Owner override from ${project.stage} to ${targetStage}. ${notes ?? ""}`.trim()
      : `Advanced from ${project.stage} to ${targetStage}. ${notes ?? ""}`.trim(),
  });

  project.stage = targetStage;
  if (project.status === "not_started") project.status = "in_progress";

  // Invariant 2 (Digital Delivery Trigger):
  // If Stages 08-10 are bypassed (e.g. pure brand design or curation) and Stage 07 is approved,
  // or if targetStage is 11, set isDelivered = true
  const physicalStages = ["08_planning_pre_production", "09_production_execution", "10_delivery_live_operations"];
  const isPhysicalBypassed = physicalStages.every((s) => project.bypassedStages.includes(s as ProjectStage));

  if (isPhysicalBypassed && (targetIndex >= PROJECT_STAGES.indexOf("08_planning_pre_production") || targetStage === "11_financial_project_close")) {
    project.isDelivered = true;
    if (project.status !== "closed") project.status = "delivered";
  }

  if (targetStage === "11_financial_project_close") {
    project.isDelivered = true;
    project.status = "delivered";
  }

  await project.save();
  return project;
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
  health?: "on_track" | "at_risk" | "blocked",
) {
  await connectDB();
  const update: Record<string, unknown> = { status };
  if (health) update.health = health;
  if (status === "delivered") update.isDelivered = true;
  if (status === "closed") update.closeDate = new Date();

  return Project.findByIdAndUpdate(projectId, { $set: update }, { new: true });
}

export async function submitCloseoutAudit(input: {
  projectId: string;
  actorId: string;
  clientWalkthroughSigned: boolean;
  punchListCleared: boolean;
  postMortemCompleted: boolean;
  archiveDelivered: boolean;
  archivedAssetsUrl?: string;
  lessonsLearned?: string;
}) {
  await connectDB();
  const project = await Project.findById(input.projectId);
  if (!project) throw new Error("Project not found");

  project.closeoutChecklist = {
    clientWalkthroughSigned: input.clientWalkthroughSigned,
    punchListCleared: input.punchListCleared,
    postMortemCompleted: input.postMortemCompleted,
    archiveDelivered: input.archiveDelivered,
    archivedAssetsUrl: input.archivedAssetsUrl?.trim() ?? "",
    lessonsLearned: input.lessonsLearned?.trim() ?? "",
    closedById: new Types.ObjectId(input.actorId),
    closedAt: new Date(),
  };

  const readyToClose =
    input.clientWalkthroughSigned &&
    input.punchListCleared &&
    input.postMortemCompleted &&
    input.archiveDelivered;
  if (readyToClose) {
    const [openInvoices, openOrders, unpaidBills] = await Promise.all([
      Invoice.countDocuments({ projectId: project._id, status: { $nin: ["paid"] } }),
      PurchaseOrder.countDocuments({ projectId: project._id, status: { $nin: ["cancelled", "fully_billed"] } }),
      SupplierBill.countDocuments({ projectId: project._id, status: { $ne: "paid" } }),
    ]);
    if (openInvoices + openOrders + unpaidBills > 0) {
      throw new Error("Closeout needs invoices paid, purchase orders closed, and supplier bills paid");
    }
    project.status = "closed";
    project.stage = "11_financial_project_close";
    project.closeDate = new Date();

    const m11 = project.milestones.find((m) => m.stage === "11_financial_project_close");
    if (m11) {
      m11.isGateApproved = true;
      m11.completedAt = new Date();
      m11.approvedById = new Types.ObjectId(input.actorId);
      m11.approvalNotes = "Final closeout audit completed and assets archived.";
    }
  }

  await project.save();
  return project;
}

export async function setMilestoneDates(
  projectId: string,
  dates: Array<{ stage: ProjectStage; targetDate: Date | null }>,
) {
  await connectDB();
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");
  for (const entry of dates) {
    const milestone = project.milestones.find((item) => item.stage === entry.stage);
    if (milestone) milestone.targetDate = entry.targetDate;
  }
  await project.save();
  return project;
}

export async function listProjectActivity(projectId: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(projectId)) return [];
  return Activity.find({ projectId: new Types.ObjectId(projectId) }).sort({ createdAt: -1 }).limit(100).lean();
}

export async function patchProjectFields(projectId: string, fields: Record<string, unknown>) {
  await connectDB();
  const allowed = [
    "projectType", "keyRequirements", "scopeIncluded", "scopeExcluded", "mainContactName",
    "leadSource", "paymentTerms", "contingencyAmount", "internalEffortHours", "externalCostEstimate",
    "depositReceived", "budgetApproved", "confirmationNotes", "fxRateToBase", "revisionFeeRevenue",
    "revisionFeeCost", "revisionFeeDays", "creativeLeadId", "clientFeedback", "assetLinks", "qualityChecklist",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in fields) update[key] = fields[key];
  }
  const project = await Project.findByIdAndUpdate(projectId, { $set: update }, { new: true });
  if (!project) throw new Error("Project not found");
  return project;
}
