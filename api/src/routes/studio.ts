import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { actor, requireUser } from "@/auth/middleware";
import { HttpError } from "@/http";
import {
  canManageProject,
  canSeeAllSales,
  canViewFinance,
  canViewFinancials,
  canViewPerformance,
  canViewProject,
  type SessionUser,
} from "@/lib/permissions";
import { isProjectStage } from "@/lib/domain";
import * as analytics from "@/services/analytics";
import * as collective from "@/services/collective";
import * as commercial from "@/services/commercial";
import * as deliverables from "@/services/deliverables";
import * as org from "@/services/org";
import * as production from "@/services/production";
import * as projects from "@/services/projects";
import * as risks from "@/services/risks";
import * as studio from "@/services/studio-ops";
import * as tasks from "@/services/tasks";
import { validate } from "@/validate";

export const studioRouter = Router();
studioRouter.use(requireUser);

const loose = z.object({}).passthrough();

function send(fn: (req: Request) => Promise<unknown>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json((await fn(req)) ?? null);
    } catch (error) {
      next(error);
    }
  };
}

function q(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

async function loadProject(id: string, user: SessionUser, mode: "view" | "manage" | "finance") {
  const project = await projects.getProjectById(id);
  if (!project || !canViewProject(user, project)) throw new HttpError(404, "Project not found");
  if (mode === "manage" && !canManageProject(user, project)) throw new HttpError(403, "You cannot manage this project");
  if (mode === "finance" && !canViewFinancials(user, project)) throw new HttpError(403, "Finance access required");
  return project;
}

function requireCompany(user: SessionUser, kind: "finance" | "reports") {
  const allowed = kind === "finance" ? canViewFinance(user) : canViewPerformance(user);
  if (!allowed) throw new HttpError(403, "You cannot view this");
}

studioRouter.get("/org/directory", send(async () => org.listDirectory()));
studioRouter.get("/org/people", send(async () => org.listPeople()));
studioRouter.get("/org/teams", send(async () => org.listTeamsWithPeople()));
studioRouter.get("/org/phase-leads", send(async () => org.resolvePhaseLeads()));
studioRouter.post("/org/people", validate(loose), send(async (req) => org.createPerson(req.body)));
studioRouter.patch("/org/people/:id", validate(loose), send(async (req) => org.updatePerson({ ...req.body, id: req.params.id })));
studioRouter.post("/org/teams", validate(z.object({ name: z.string().min(1) })), send(async (req) => org.createTeam(req.body.name)));
studioRouter.patch("/org/teams/:id", validate(z.object({ name: z.string().min(1) })), send(async (req) => org.renameTeam(req.params.id, req.body.name)));
studioRouter.post("/org/teams/:id/leader", validate(z.object({ userId: z.string() })), send(async (req) => {
  await org.promoteLeader(req.params.id, req.body.userId);
  return { ok: true };
}));
studioRouter.post("/clients/ensure", send(async () => org.ensureStudioClient()));
studioRouter.patch("/clients/:id", validate(loose), send(async (req) => org.updateClient(req.params.id, req.body)));

studioRouter.get("/leads", send(async (req) => {
  const user = actor(req);
  const assigned = canSeeAllSales(user) ? q(req.query.assignedLeadId) : user.id;
  return commercial.listLeads({ stage: q(req.query.stage) as never, assignedLeadId: assigned });
}));
studioRouter.get("/leads/count", send(async (req) => ({ count: await commercial.countLeadsAssignedTo(actor(req).id) })));
studioRouter.get("/leads/:id", send(async (req) => commercial.getLeadById(req.params.id)));
studioRouter.post("/leads", validate(loose), send(async (req) => commercial.createLead(req.body)));
studioRouter.patch("/leads/:id", validate(loose), send(async (req) => commercial.updateLead(req.params.id, req.body)));
studioRouter.post("/leads/:id/stage", validate(z.object({ stage: z.string() })), send(async (req) => commercial.updateLeadStage(req.params.id, req.body.stage)));
studioRouter.post("/leads/:id/owner", validate(z.object({ assignedLeadId: z.string() })), send(async (req) => commercial.updateLeadOwner(req.params.id, req.body.assignedLeadId)));
studioRouter.post("/leads/:id/convert", send(async (req) => commercial.convertLeadToConfirmedProject(req.params.id, actor(req).id)));

studioRouter.get("/proposals", send(async () => studio.listProposals()));
studioRouter.post("/proposals", validate(loose), send(async (req) => {
  await studio.createProposal(req.body);
  return { ok: true };
}));
studioRouter.post("/proposals/:id/status", validate(z.object({ status: z.string() })), send(async (req) => studio.setProposalStatus(req.params.id, req.body.status)));

studioRouter.get("/projects", send(async (req) => {
  const user = actor(req);
  return projects.listProjects({
    stage: q(req.query.stage) as never,
    status: q(req.query.status) as never,
    product: q(req.query.product) as never,
    clientId: q(req.query.clientId),
    projectLeadId: q(req.query.projectLeadId),
    userId: user.id,
    isExecutive: user.role === "owner" || !!user.isExecutive,
  });
}));
studioRouter.post("/projects", validate(z.object({ name: z.string().min(1) }).passthrough()), send(async (req) => projects.createProject(req.body)));
studioRouter.get("/projects/:id", send(async (req) => loadProject(req.params.id, actor(req), "view")));
studioRouter.patch("/projects/:id", validate(loose), send(async (req) => {
  await loadProject(req.params.id, actor(req), "manage");
  return projects.updateProject(req.params.id, req.body);
}));
studioRouter.patch("/projects/:id/fields", validate(loose), send(async (req) => {
  await loadProject(req.params.id, actor(req), "manage");
  return projects.patchProjectFields(req.params.id, req.body);
}));
studioRouter.post("/projects/:id/stage", validate(z.object({ targetStage: z.string(), notes: z.string().optional(), override: z.boolean().optional() })), send(async (req) => {
  const user = actor(req);
  await loadProject(req.params.id, user, "manage");
  if (!isProjectStage(req.body.targetStage)) throw new HttpError(400, "Invalid target stage");
  const override = Boolean(req.body.override) && (user.role === "owner" || !!user.isExecutive);
  return projects.advanceProjectStage(req.params.id, req.body.targetStage, user.id, req.body.notes, override);
}));
studioRouter.post("/projects/:id/status", validate(loose), send(async (req) => {
  await loadProject(req.params.id, actor(req), "manage");
  return projects.updateProjectStatus(req.params.id, req.body.status, req.body.health);
}));
studioRouter.post("/projects/:id/closeout", validate(loose), send(async (req) => {
  await loadProject(req.params.id, actor(req), "manage");
  return projects.submitCloseoutAudit({ ...req.body, projectId: req.params.id, actorId: actor(req).id });
}));
studioRouter.put("/projects/:id/milestones", validate(z.object({ dates: z.array(z.object({ stage: z.string(), targetDate: z.string().nullable() })) })), send(async (req) => {
  await loadProject(req.params.id, actor(req), "manage");
  return projects.setMilestoneDates(
    req.params.id,
    req.body.dates.map((entry: { stage: string; targetDate: string | null }) => ({
      stage: entry.stage,
      targetDate: entry.targetDate ? new Date(entry.targetDate) : null,
    })),
  );
}));
studioRouter.get("/projects/:id/activity", send(async (req) => {
  await loadProject(req.params.id, actor(req), "view");
  return projects.listProjectActivity(req.params.id);
}));

studioRouter.get("/projects/:id/tasks", send(async (req) => {
  await loadProject(req.params.id, actor(req), "view");
  return tasks.listProjectBoardTasks(req.params.id);
}));
studioRouter.post("/projects/:id/tasks", validate(loose), send(async (req) => {
  await loadProject(req.params.id, actor(req), "manage");
  return tasks.createProjectTask({ ...req.body, projectId: req.params.id });
}));
studioRouter.patch("/tasks/:id", validate(loose), send(async (req) => tasks.updateProjectTask({ ...req.body, taskId: req.params.id })));
studioRouter.post("/tasks/:id/status", validate(z.object({ status: z.string(), reason: z.string().optional() })), send(async (req) => tasks.moveProjectTaskStatus(req.params.id, req.body.status, actor(req).id, req.body.reason)));
studioRouter.get("/tasks/:id/comments", send(async (req) => tasks.listProjectTaskComments(req.params.id)));
studioRouter.post("/tasks/:id/comments", validate(z.object({ body: z.string().min(1) })), send(async (req) => tasks.addProjectTaskComment(req.params.id, actor(req).id, req.body.body)));

studioRouter.get("/projects/:id/deliverables", send(async (req) => {
  await loadProject(req.params.id, actor(req), "view");
  return deliverables.listDeliverables(req.params.id);
}));
studioRouter.post("/projects/:id/deliverables", validate(loose), send(async (req) => {
  await loadProject(req.params.id, actor(req), "manage");
  return deliverables.createDeliverable({ ...req.body, projectId: req.params.id, submittedById: actor(req).id });
}));
studioRouter.post("/deliverables/:id/reviews", validate(loose), send(async (req) => deliverables.submitDeliverableReview(req.params.id, actor(req).id, req.body.reviewerRole, req.body.decision, req.body.feedback)));
studioRouter.post("/deliverables/:id/versions", validate(loose), send(async (req) => deliverables.submitDeliverableVersion(req.params.id, actor(req).id, req.body.assetUrl, req.body.notes)));
studioRouter.post("/deliverables/:id/send", send(async (req) => deliverables.sendDeliverableToClient(req.params.id)));
studioRouter.post("/deliverables/:id/final", send(async (req) => deliverables.markDeliverableFinal(req.params.id)));

studioRouter.get("/projects/:id/risks", send(async (req) => {
  await loadProject(req.params.id, actor(req), "view");
  return risks.listProjectRisks(req.params.id);
}));
studioRouter.post("/projects/:id/risks", validate(loose), send(async (req) => {
  await loadProject(req.params.id, actor(req), "view");
  return risks.createRiskIssue({ ...req.body, projectId: req.params.id });
}));
studioRouter.post("/risks/:id/resolve", validate(loose), send(async (req) => risks.resolveRiskIssue(req.params.id, req.body.resolution)));

studioRouter.get("/projects/:id/changes", send(async (req) => {
  await loadProject(req.params.id, actor(req), "view");
  return commercial.listProjectChangeRequests(req.params.id);
}));
studioRouter.post("/projects/:id/changes", validate(loose), send(async (req) => {
  await loadProject(req.params.id, actor(req), "manage");
  return commercial.createManualChangeRequest({ ...req.body, projectId: req.params.id });
}));
studioRouter.post("/changes/:id/submit", send(async (req) => commercial.submitChangeRequest(req.params.id)));
studioRouter.post("/changes/:id/approve", validate(loose), send(async (req) => commercial.approveChangeRequest(req.params.id, actor(req).id, req.body.approverName, req.body.evidenceUrl)));
studioRouter.post("/changes/:id/reject", validate(loose), send(async (req) => commercial.rejectChangeRequest(req.params.id, actor(req).id, req.body.approverName, req.body.evidenceUrl)));

studioRouter.get("/projects/:id/commercials", send(async (req) => {
  await loadProject(req.params.id, actor(req), "finance");
  return commercial.getProjectCommercials(req.params.id);
}));
studioRouter.get("/projects/:id/finance-lists", send(async (req) => {
  await loadProject(req.params.id, actor(req), "finance");
  return analytics.projectFinanceLists(req.params.id);
}));
studioRouter.post("/projects/:id/purchase-orders", validate(loose), send(async (req) => {
  await loadProject(req.params.id, actor(req), "finance");
  return commercial.createPurchaseOrder({ ...req.body, projectId: req.params.id });
}));
studioRouter.patch("/purchase-orders/:id", validate(loose), send(async (req) => commercial.updatePurchaseOrder(req.params.id, req.body)));
studioRouter.post("/purchase-orders/:id/cancel", send(async (req) => commercial.cancelPurchaseOrder(req.params.id)));
studioRouter.post("/projects/:id/bills", validate(loose), send(async (req) => {
  await loadProject(req.params.id, actor(req), "finance");
  return commercial.recordSupplierBill({ ...req.body, projectId: req.params.id });
}));
studioRouter.post("/bills/:id/pay", send(async (req) => commercial.markSupplierBillPaid(req.params.id)));
studioRouter.post("/projects/:id/invoices", validate(loose), send(async (req) => {
  await loadProject(req.params.id, actor(req), "finance");
  return commercial.createClientInvoice({ ...req.body, projectId: req.params.id });
}));
studioRouter.post("/invoices/:id/payments", validate(z.object({ amount: z.number().optional() })), send(async (req) => {
  if (req.body.amount == null) return commercial.markInvoicePaid(req.params.id);
  return commercial.recordInvoicePayment(req.params.id, req.body.amount);
}));

studioRouter.get("/projects/:id/quotes", send(async (req) => production.listQuotes(req.params.id)));
studioRouter.post("/projects/:id/quotes", validate(loose), send(async (req) => production.createQuote({ ...req.body, projectId: req.params.id })));
studioRouter.post("/quotes/:id/select", send(async (req) => production.selectQuote(req.params.id)));
studioRouter.get("/projects/:id/cost-sheet", send(async (req) => production.getCostSheet(req.params.id)));
studioRouter.put("/projects/:id/cost-sheet", validate(loose), send(async (req) => production.saveCostSheet(req.params.id, req.body.lines ?? [], req.body.locked)));
studioRouter.get("/projects/:id/engagements", send(async (req) => production.listEngagements(req.params.id)));
studioRouter.post("/projects/:id/engagements", validate(loose), send(async (req) => production.createEngagement({ ...req.body, projectId: req.params.id })));
studioRouter.get("/engagements", send(async (req) => production.listEngagements(q(req.query.projectId))));
studioRouter.get("/collective/:id/engagements", send(async (req) => production.memberEngagements(req.params.id)));

studioRouter.get("/templates", send(async () => production.listTemplates()));
studioRouter.post("/templates", validate(loose), send(async (req) => production.createTemplate(req.body)));
studioRouter.post("/projects/:id/templates/:templateId", send(async (req) => {
  await loadProject(req.params.id, actor(req), "manage");
  return production.applyTemplate(req.params.id, req.params.templateId, actor(req).id);
}));

studioRouter.get("/collective", send(async (req) => collective.listCollectiveMembers(q(req.query.type) as never)));
studioRouter.post("/collective", validate(loose), send(async (req) => collective.createCollectiveMember(req.body)));
studioRouter.patch("/collective/:id", validate(loose), send(async (req) => {
  await studio.updateCollectiveProfile({ ...req.body, id: req.params.id });
  return { ok: true };
}));
studioRouter.get("/collective/collaborations", send(async () => studio.allCollaborations()));

studioRouter.get("/reports", send(async (req) => {
  requireCompany(actor(req), "reports");
  return analytics.getStudioAnalytics();
}));
studioRouter.get("/reports/command-center", send(async (req) => {
  const user = actor(req);
  if (!canViewFinance(user) && user.role !== "owner" && !user.isExecutive) {
    const data = await analytics.loadCommandCenter();
    return { ...data, invoices: [] };
  }
  return analytics.loadCommandCenter();
}));

const opsGet: Array<[string, () => Promise<unknown>]> = [
  ["/ops/goals", studio.listGoals],
  ["/ops/decisions", studio.listDecisions],
  ["/ops/follow-ups", studio.listFollowUps],
  ["/ops/targets", studio.listSalesTargets],
  ["/ops/expenses", studio.listExpenses],
  ["/ops/leave", studio.listLeave],
  ["/ops/reviews", studio.listReviews],
  ["/ops/roster", studio.rosterForOps],
];
for (const [path, fn] of opsGet) studioRouter.get(path, send(async () => fn()));
studioRouter.get("/ops/marketing", send(async (req) => studio.listMarketing(q(req.query.kind) as never)));

studioRouter.get("/ops/production", send(async (req) => studio.listProduction(q(req.query.projectId))));
studioRouter.get("/ops/tasks", send(async () => studio.studioTasks()));
studioRouter.get("/ops/finance", send(async (req) => {
  requireCompany(actor(req), "finance");
  return studio.financeSnapshot();
}));
studioRouter.get("/ops/clients", send(async () => studio.clientAccounts()));

studioRouter.post("/ops/goals", validate(loose), send(async (req) => studio.createGoal(req.body)));
studioRouter.post("/ops/decisions", validate(z.object({ title: z.string(), context: z.string().optional() })), send(async (req) => studio.createDecision(req.body.title, req.body.context ?? "")));
studioRouter.post("/ops/decisions/:id", validate(z.object({ outcome: z.string() })), send(async (req) => studio.decide(req.params.id, req.body.outcome)));
studioRouter.post("/ops/follow-ups", validate(loose), send(async (req) => studio.createFollowUp(req.body)));
studioRouter.post("/ops/follow-ups/:id/complete", send(async (req) => studio.completeFollowUp(req.params.id)));
studioRouter.post("/ops/targets", validate(loose), send(async (req) => studio.createSalesTarget(req.body)));
studioRouter.post("/ops/marketing", validate(loose), send(async (req) => studio.createMarketing(req.body)));
studioRouter.post("/ops/expenses", validate(loose), send(async (req) => {
  const created = await studio.createExpense(req.body);
  if (req.body.projectId) await commercial.syncDerivedCosts(req.body.projectId);
  return created;
}));
studioRouter.post("/ops/leave", validate(loose), send(async (req) => studio.createLeave(req.body)));
studioRouter.post("/ops/leave/:id", validate(z.object({ status: z.enum(["approved", "declined"]) })), send(async (req) => studio.setLeaveStatus(req.params.id, req.body.status)));
studioRouter.post("/ops/reviews", validate(loose), send(async (req) => studio.createReview(req.body)));
studioRouter.post("/ops/production", validate(loose), send(async (req) => studio.createProduction(req.body)));
studioRouter.post("/ops/dependencies", validate(z.object({ taskId: z.string(), dependsOnId: z.string() })), send(async (req) => studio.linkTaskDependency(req.body.taskId, req.body.dependsOnId)));
