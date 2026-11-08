import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import {
  PROJECT_STAGES,
  NON_BYPASSABLE_STAGES,
  type ProjectStage,
  type ProjectStatus,
  type StudioProduct,
  type StudioCurrency,
} from "@/lib/domain";
import { Project, type IProject, type IProjectMilestone } from "@/models/Project";

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
  teamUserIds?: string[];
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

  // Validate non-bypassable stages
  const bypassed = input.bypassedStages ?? [];
  const invalidBypass = bypassed.filter((s) => (NON_BYPASSABLE_STAGES as readonly string[]).includes(s));
  if (invalidBypass.length > 0) {
    throw new Error(`Cannot bypass mandatory governance stages: ${invalidBypass.join(", ")}`);
  }

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
    estimatedTotalCost: 0,
    committedTotalCost: 0,
    actualTotalCost: 0,
    milestones,
    teamUserIds: (input.teamUserIds ?? []).map((id) => new Types.ObjectId(id)),
  });

  return project;
}

export async function getProjectById(id: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(id)) return null;

  return Project.findById(id)
    .populate("clientId", "name brandName contacts billingAddress")
    .populate("projectLeadId", "name email title role functionalRoles")
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

export async function advanceProjectStage(
  projectId: string,
  targetStage: ProjectStage,
  actorId: string,
  notes?: string,
) {
  await connectDB();
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  const targetIndex = PROJECT_STAGES.indexOf(targetStage);

  if (targetIndex < 0) throw new Error("Invalid target stage");
  if (project.bypassedStages.includes(targetStage)) {
    throw new Error(`Stage ${targetStage} is marked as bypassed for this project`);
  }

  // Approve current stage milestone before advancing
  const currentMilestone = project.milestones.find((m) => m.stage === project.stage);
  if (currentMilestone) {
    currentMilestone.isGateApproved = true;
    currentMilestone.approvedById = new Types.ObjectId(actorId);
    currentMilestone.completedAt = new Date();
    if (notes) currentMilestone.approvalNotes = notes;
  }

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

  // If all key items are satisfied, transition project to closed
  if (
    input.clientWalkthroughSigned &&
    input.punchListCleared &&
    input.postMortemCompleted &&
    input.archiveDelivered
  ) {
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
