import {
  MACRO_PHASES,
  PROJECT_STAGES,
  STUDIO_PRODUCTS,
  STUDIO_PRODUCT_LABELS,
  type StudioProduct,
} from "@/lib/domain";
import { TEST_LANES, TEST_ROSTER } from "@/lib/test-roster";
import { loadCommandCenter } from "@/services/analytics";
import { listLeads } from "@/services/commercial";
import { resolvePhaseLeads } from "@/services/org";
import { listProjects } from "@/services/projects";
import { listDecisions, listGoals } from "@/services/studio-ops";
import { orEmpty } from "@/lib/db";
import type { SessionUser } from "@/lib/permissions";

export const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export function moneyByCurrency(rows: Array<{ currency?: string; amount: number }>) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const currency = row.currency || "USD";
    totals.set(currency, (totals.get(currency) ?? 0) + row.amount);
  }
  if (totals.size === 0) return money(0);
  return [...totals.entries()].map(([currency, amount]) => `${currency} ${Math.round(amount).toLocaleString()}`).join(" · ");
}

export const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

export function HealthBadge({ health }: { health: string }) {
  const cls = health === "on_track" ? "badge badge-good" : health === "blocked" ? "badge badge-danger" : "badge badge-at-risk";
  return <span className={cls}>{health.replace("_", " ")}</span>;
}

export function StageTrack({ stage }: { stage: string }) {
  const current = PROJECT_STAGES.indexOf(stage as (typeof PROJECT_STAGES)[number]);
  return (
    <div className="stage-track" aria-label={`Stage ${current + 1} of 11`}>
      {PROJECT_STAGES.map((s, i) => (
        <span key={s} className={`seg${i < current ? " done" : ""}${i === current ? " current" : ""}`} />
      ))}
    </div>
  );
}

export async function loadDashboardBundle(user: SessionUser) {
  const [projects, leads, center, goals, decisions, phaseLeads] = await orEmpty(async () => {
    return Promise.all([
      listProjects(),
      listLeads(),
      loadCommandCenter(),
      listGoals(),
      listDecisions(),
      resolvePhaseLeads(),
    ]);
  }, [[], [], { invoices: [], tasks: [], users: [], deliverables: [], teams: [] }, [], [], {}]);

  const allInvoices = center.invoices ?? [];
  const activeTasks = center.tasks ?? [];
  const rosterUsers = center.users?.length
    ? center.users
    : TEST_ROSTER.map((person) => ({ _id: person.id, name: person.name, title: person.title, role: person.role }));
  const pendingDeliverables = center.deliverables ?? [];
  const lanes = center.teams?.length
    ? center.teams
    : TEST_LANES.map((lane) => ({ _id: lane.id, name: lane.name }));

  const activeProjects = projects.filter((p) => p.status !== "closed");
  const now = new Date();
  const openLeads = leads.filter((l) => l.stage !== "lost" && l.stage !== "won");
  const pipelineLabel = moneyByCurrency(openLeads.map((lead) => ({ currency: lead.currency, amount: lead.estimatedValue || 0 })));
  const contractedLabel = moneyByCurrency(activeProjects.map((project) => ({ currency: project.currency, amount: project.approvedContractValue || project.quotedValue || 0 })));
  const committedLabel = moneyByCurrency(activeProjects.map((project) => ({ currency: project.currency, amount: project.committedTotalCost || 0 })));
  const totalPipelineRevenue = openLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  const totalContractedValue = activeProjects.reduce((sum, p) => sum + (p.approvedContractValue || p.quotedValue || 0), 0);
  const totalActualCost = activeProjects.reduce((sum, p) => sum + (p.actualTotalCost || 0), 0);
  const totalCommittedCost = activeProjects.reduce((sum, p) => sum + (p.committedTotalCost || 0), 0);
  const singleCurrency = new Set(activeProjects.map((project) => project.currency || "USD")).size <= 1;
  const totalProjectedMargin = singleCurrency ? totalContractedValue - (totalActualCost + totalCommittedCost) : 0;
  const totalInvoiced = allInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalCollected = allInvoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const overdueInvoices = allInvoices.filter((inv) => inv.status !== "paid" && inv.dueDate && new Date(inv.dueDate) < now);
  const atRiskProjects = activeProjects.filter((p) => p.health === "at_risk" || p.health === "blocked");
  const overdueTasks = activeTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now);
  const myTasks = activeTasks.filter(
    (t) =>
      (t.accountableOwnerId as unknown as { _id?: unknown } | null)?._id?.toString() === user.id ||
      t.assigneeId?.toString() === user.id,
  );
  const exceptionCount = atRiskProjects.length + overdueTasks.length + overdueInvoices.length + pendingDeliverables.length;

  const macroPhasesWithProjects = MACRO_PHASES.map((phase) => ({
    ...phase,
    leads: phaseLeads[phase.id] || phase.leads,
    projects: activeProjects.filter((p) => (phase.stages as readonly string[]).includes(p.stage)),
  }));

  const productMetrics = (STUDIO_PRODUCTS as readonly StudioProduct[]).map((prod) => {
    const prodLeads = leads.filter((l) => l.products?.includes(prod));
    const prodProjects = activeProjects.filter((p) => p.products?.includes(prod));
    return {
      product: prod,
      label: STUDIO_PRODUCT_LABELS[prod],
      leadsCount: prodLeads.length,
      pipelineSum: prodLeads.reduce((s, l) => s + (l.estimatedValue || 0), 0),
      projectsCount: prodProjects.length,
      contractedSum: prodProjects.reduce((s, p) => s + (p.approvedContractValue || p.quotedValue || 0), 0),
    };
  });
  const maxProduct = Math.max(1, ...productMetrics.map((p) => p.contractedSum + p.pipelineSum));

  const tasksByOwner = new Map<string, number>();
  for (const t of activeTasks) {
    const id = (t.accountableOwnerId as unknown as { _id?: unknown } | null)?._id?.toString();
    if (id) tasksByOwner.set(id, (tasksByOwner.get(id) ?? 0) + 1);
  }
  const maxLoad = Math.max(1, ...tasksByOwner.values());

  return {
    now,
    leads,
    goals,
    decisions,
    allInvoices,
    activeTasks,
    rosterUsers,
    pendingDeliverables,
    lanes,
    activeProjects,
    openLeads,
    pipelineLabel,
    contractedLabel,
    committedLabel,
    totalPipelineRevenue,
    totalContractedValue,
    totalActualCost,
    totalProjectedMargin,
    totalInvoiced,
    totalCollected,
    overdueInvoices,
    atRiskProjects,
    overdueTasks,
    myTasks,
    exceptionCount,
    macroPhasesWithProjects,
    productMetrics,
    maxProduct,
    tasksByOwner,
    maxLoad,
  };
}

export type DashboardBundle = Awaited<ReturnType<typeof loadDashboardBundle>>;
