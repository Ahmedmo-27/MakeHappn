import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { formatDate, readMessage } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { listProjects } from "@/services/projects";
import { listLeads } from "@/services/commercial";
import { connectDB } from "@/lib/db";
import { Task } from "@/models/Task";
import { Invoice } from "@/models/Invoice";
import { User } from "@/models/User";
import { Team } from "@/models/Team";
import { Deliverable } from "@/models/Deliverable";
import {
  MACRO_PHASES,
  PROJECT_STAGES,
  STAGE_LABELS,
  STUDIO_PRODUCTS,
  STUDIO_PRODUCT_LABELS,
  type StudioProduct,
} from "@/lib/domain";

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<div className="page"><PageFallback label="Loading studio command center" /></div>}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

function HealthBadge({ health }: { health: string }) {
  const cls = health === "on_track" ? "badge badge-good" : health === "blocked" ? "badge badge-danger" : "badge badge-at-risk";
  return <span className={cls}>{health.replace("_", " ")}</span>;
}

function StageTrack({ stage }: { stage: string }) {
  const current = PROJECT_STAGES.indexOf(stage as (typeof PROJECT_STAGES)[number]);
  return (
    <div className="stage-track" aria-label={`Stage ${current + 1} of 11`}>
      {PROJECT_STAGES.map((s, i) => (
        <span key={s} className={`seg${i < current ? " done" : ""}${i === current ? " current" : ""}`} />
      ))}
    </div>
  );
}

async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  await connectDB();
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  const flash = readMessage(params);
  const view = typeof params.view === "string" ? params.view : "overview";
  const isExec = user.role === "owner" || !!user.isExecutive;

  const [projects, leads, allInvoices, activeTasks, rosterUsers, pendingDeliverables, lanes] = await Promise.all([
    listProjects(),
    listLeads(),
    Invoice.find().populate("projectId", "code name").lean(),
    Task.find({ status: { $nin: ["done"] } })
      .populate("projectId", "code name")
      .populate("accountableOwnerId", "name title email")
      .sort({ dueDate: 1 })
      .lean(),
    User.find({ isActive: { $ne: false } }).sort({ role: 1, name: 1 }).lean(),
    Deliverable.find({ status: { $in: ["internal_review", "revision_required"] } })
      .populate("projectId", "code name contractedRevisionRounds")
      .sort({ updatedAt: -1 })
      .lean(),
    Team.find().sort({ createdAt: 1 }).lean(),
  ]);

  const activeProjects = projects.filter((p) => p.status !== "closed");
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // KPIs
  const openLeads = leads.filter((l) => l.stage !== "lost" && l.stage !== "won");
  const totalPipelineRevenue = openLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  const totalContractedValue = activeProjects.reduce((sum, p) => sum + (p.approvedContractValue || p.quotedValue || 0), 0);
  const totalActualCost = activeProjects.reduce((sum, p) => sum + (p.actualTotalCost || 0), 0);
  const totalCommittedCost = activeProjects.reduce((sum, p) => sum + (p.committedTotalCost || 0), 0);
  const totalProjectedMargin = totalContractedValue - (totalActualCost + totalCommittedCost);

  const totalInvoiced = allInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalCollected = allInvoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const overdueInvoices = allInvoices.filter((inv) => inv.status !== "paid" && inv.dueDate && new Date(inv.dueDate) < now);

  // Exceptions
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

  const views = [
    { id: "overview", label: "Overview" },
    { id: "business", label: "Business" },
    { id: "project", label: "Projects" },
    { id: "team", label: "Team" },
    ...(isExec ? [{ id: "finance", label: "Finance" }] : []),
  ];

  return (
    <div className="page page-wide">
      <Banner error={flash.error} notice={flash.notice} />

      <header className="page-header">
        <div>
          <p className="kicker">Command center · {formatDate(now)}</p>
          <h1>
            {greeting}, <span className="accent-text">{user.name.split(" ")[0]}.</span>
          </h1>
          <p className="lede">
            {exceptionCount > 0
              ? `${exceptionCount} thing${exceptionCount === 1 ? "" : "s"} need${exceptionCount === 1 ? "s" : ""} your attention across ${activeProjects.length} live projects.`
              : `Everything is on track across ${activeProjects.length} live projects.`}
          </p>
        </div>
        <Link className="btn btn-primary" href="/projects/new">
          New project <span className="arrow" aria-hidden="true">→</span>
        </Link>
      </header>

      <nav className="segmented" aria-label="Dashboard perspective">
        {views.map((v) => (
          <Link key={v.id} href={`/dashboard?view=${v.id}`} className={view === v.id ? "active" : undefined} aria-current={view === v.id ? "page" : undefined}>
            {v.label}
          </Link>
        ))}
      </nav>

      {/* ============================== OVERVIEW ============================== */}
      {view === "overview" && (
        <div className="stack" style={{ gap: "1.6rem" }}>
          <div className="kpi-grid">
            <div className="kpi">
              <span className="kpi-label">Active contract value</span>
              <span className="kpi-value">{money(totalContractedValue)}</span>
              <span className="kpi-sub">{activeProjects.length} live projects</span>
            </div>
            <div className="kpi">
              <span className="kpi-label">Sales pipeline</span>
              <span className="kpi-value">{money(totalPipelineRevenue)}</span>
              <span className="kpi-sub">{openLeads.length} open opportunities</span>
            </div>
            <div className={`kpi ${atRiskProjects.length > 0 ? "is-danger" : "is-good"}`}>
              <span className="kpi-label">Portfolio health</span>
              <span className="kpi-value">{atRiskProjects.length > 0 ? `${atRiskProjects.length} at risk` : "On track"}</span>
              <span className="kpi-sub">{activeProjects.length - atRiskProjects.length} of {activeProjects.length} healthy</span>
            </div>
            {isExec ? (
              <div className="kpi is-accent">
                <span className="kpi-label">Projected margin <span>{pct(totalProjectedMargin, totalContractedValue)}%</span></span>
                <span className="kpi-value">{money(totalProjectedMargin)}</span>
                <span className="kpi-sub">After committed and actual costs</span>
              </div>
            ) : (
              <div className="kpi is-accent">
                <span className="kpi-label">My open tasks</span>
                <span className="kpi-value">{myTasks.length}</span>
                <span className="kpi-sub">You are the accountable owner</span>
              </div>
            )}
          </div>

          <div className="split">
            <section className="panel">
              <div className="section-head">
                <div>
                  <span className="section-index">01 / Attention</span>
                  <h2>Needs attention</h2>
                </div>
                <span className="badge badge-at-risk">{exceptionCount} open</span>
              </div>
              {exceptionCount === 0 ? (
                <p className="empty">Nothing is on fire. Enjoy it.</p>
              ) : (
                <ul className="attn-list">
                  {atRiskProjects.map((p) => (
                    <li key={p._id.toString()}>
                      <Link href={`/projects/${p._id.toString()}`} className="attn-row tone-danger">
                        <span className="attn-dot" />
                        <span className="attn-main">
                          <strong>{p.name}</strong>
                          <span>{p.code} · Stage {STAGE_LABELS[p.stage].number} {STAGE_LABELS[p.stage].short}</span>
                        </span>
                        <HealthBadge health={p.health} />
                      </Link>
                    </li>
                  ))}
                  {overdueInvoices.slice(0, 3).map((inv) => {
                    const p = inv.projectId as unknown as { _id?: unknown; code?: string } | null;
                    return (
                      <li key={inv._id.toString()}>
                        <Link href={p?._id ? `/projects/${String(p._id)}/commercials` : "/projects"} className="attn-row tone-danger">
                          <span className="attn-dot" />
                          <span className="attn-main">
                            <strong>{inv.invoiceNumber} · {money(inv.amount)}</strong>
                            <span>{p?.code ?? "Invoice"} · was due {inv.dueDate ? formatDate(inv.dueDate) : "earlier"}</span>
                          </span>
                          <span className="badge badge-danger">Payment overdue</span>
                        </Link>
                      </li>
                    );
                  })}
                  {overdueTasks.slice(0, 4).map((t) => {
                    const p = t.projectId as unknown as { _id?: unknown; code?: string } | null;
                    const owner = t.accountableOwnerId as unknown as { name?: string } | null;
                    return (
                      <li key={t._id.toString()}>
                        <Link href={p?._id ? `/projects/${String(p._id)}/board` : "/projects"} className="attn-row tone-warn">
                          <span className="attn-dot" />
                          <span className="attn-main">
                            <strong>{t.title}</strong>
                            <span>{p?.code ?? "Task"} · {owner?.name ?? "Unassigned"} · due {t.dueDate ? formatDate(t.dueDate) : "earlier"}</span>
                          </span>
                          <span className="badge badge-overdue">Overdue</span>
                        </Link>
                      </li>
                    );
                  })}
                  {pendingDeliverables.slice(0, 3).map((d) => {
                    const p = d.projectId as unknown as { _id?: unknown; code?: string } | null;
                    return (
                      <li key={d._id.toString()}>
                        <Link href={p?._id ? `/projects/${String(p._id)}/deliverables` : "/projects"} className="attn-row tone-info">
                          <span className="attn-dot" />
                          <span className="attn-main">
                            <strong>{d.title}</strong>
                            <span>{p?.code ?? "Deliverable"} · v{d.currentVersion} · round {d.revisionRound}</span>
                          </span>
                          <span className="badge badge-info">{d.status === "internal_review" ? "Awaiting review" : "Revision"}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="panel">
              <div className="section-head">
                <div>
                  <span className="section-index">02 / Mine</span>
                  <h2>My tasks</h2>
                </div>
                <span className="badge">{myTasks.length}</span>
              </div>
              {myTasks.length === 0 ? (
                <p className="empty">No tasks where you are the accountable owner.</p>
              ) : (
                <ul className="task-list">
                  {myTasks.slice(0, 8).map((t) => {
                    const p = t.projectId as unknown as { _id?: unknown; code?: string } | null;
                    const late = t.dueDate && new Date(t.dueDate) < now;
                    return (
                      <li key={t._id.toString()}>
                        <Link href={p?._id ? `/projects/${String(p._id)}/board` : "/projects"} className="task-row">
                          <span className={`status status-${t.status}`}>{t.status.replace("_", " ")}</span>
                          <span className="task-row-title">{t.title}</span>
                          <span className={late ? "task-row-due late" : "task-row-due"}>
                            {p?.code} {t.dueDate ? `· ${formatDate(t.dueDate)}` : ""}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <section>
            <div className="section-head">
              <div>
                <span className="section-index">03 / Workflow</span>
                <h2>The studio, phase by phase</h2>
                <p>One project lead · one creative direction · clear handovers · no step moves forward without alignment.</p>
              </div>
              <Link href="/projects" className="btn btn-ghost">All projects <span className="arrow">→</span></Link>
            </div>
            <div className="phase-grid">
              {macroPhasesWithProjects.map((phase) => (
                <div key={phase.id} className="phase-col spot">
                  <div className="phase-head">
                    <span className="phase-num">{phase.number}</span>
                    <span className="phase-count">{phase.projects.length}</span>
                  </div>
                  <h3>{phase.title}</h3>
                  <p className="phase-sum">{phase.summary}</p>
                  <p className="phase-leads">{phase.leads}</p>
                  <div className="phase-projects">
                    {phase.projects.length === 0 ? (
                      <span className="phase-empty">No live projects</span>
                    ) : (
                      phase.projects.map((p) => (
                        <Link key={p._id.toString()} href={`/projects/${p._id.toString()}`} className="proj-chip">
                          <span className="proj-chip-top">
                            <span className="mono accent-text">{p.code}</span>
                            <HealthBadge health={p.health} />
                          </span>
                          <strong>{p.name}</strong>
                          <StageTrack stage={p.stage} />
                          <span className="proj-chip-stage">
                            {STAGE_LABELS[p.stage].number} · {STAGE_LABELS[p.stage].short}
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ============================== BUSINESS ============================== */}
      {view === "business" && (
        <div className="stack" style={{ gap: "1.6rem" }}>
          <div className="kpi-grid">
            <div className="kpi">
              <span className="kpi-label">Open leads</span>
              <span className="kpi-value">{openLeads.length}</span>
              <span className="kpi-sub">Inquiry → proposal</span>
            </div>
            <div className="kpi is-accent">
              <span className="kpi-label">Pipeline value</span>
              <span className="kpi-value">{money(totalPipelineRevenue)}</span>
              <span className="kpi-sub">Not yet contracted</span>
            </div>
            <div className="kpi is-good">
              <span className="kpi-label">Won</span>
              <span className="kpi-value">{leads.filter((l) => l.stage === "won").length}</span>
              <span className="kpi-sub">Converted into projects</span>
            </div>
            <div className="kpi">
              <span className="kpi-label">Avg. deal size</span>
              <span className="kpi-value">{money(openLeads.length ? totalPipelineRevenue / openLeads.length : 0)}</span>
              <span className="kpi-sub">Across open leads</span>
            </div>
          </div>

          <section className="panel">
            <div className="section-head">
              <div>
                <span className="section-index">Products</span>
                <h2>Where the business comes from</h2>
                <p>Contracted value (solid) and pipeline (outline) for each of the six studio products.</p>
              </div>
              <Link href="/sales" className="btn btn-primary">Open pipeline <span className="arrow">→</span></Link>
            </div>
            <div className="product-bars">
              {productMetrics.map((pm) => (
                <Link key={pm.product} href={`/projects?product=${pm.product}`} className="product-bar">
                  <span className="product-name">{pm.label}</span>
                  <span className="product-track">
                    <span className="product-fill" style={{ width: `${(pm.contractedSum / maxProduct) * 100}%` }} />
                    <span className="product-pipe" style={{ width: `${(pm.pipelineSum / maxProduct) * 100}%` }} />
                  </span>
                  <span className="product-nums">
                    <strong>{money(pm.contractedSum)}</strong>
                    <span>{pm.projectsCount} projects · {pm.leadsCount} leads</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ============================== PROJECTS ============================== */}
      {view === "project" && (
        <section>
          <div className="section-head">
            <div>
              <span className="section-index">Portfolio</span>
              <h2>Every live project, every gate</h2>
            </div>
            <Link href="/projects" className="btn btn-ghost">Full list <span className="arrow">→</span></Link>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Project</th>
                  <th>Client</th>
                  <th style={{ minWidth: 180 }}>Progress</th>
                  <th>Health</th>
                  <th>Value</th>
                  <th>Delivery</th>
                </tr>
              </thead>
              <tbody>
                {activeProjects.map((p) => {
                  const client = p.clientId as unknown as { name?: string; brandName?: string } | null;
                  return (
                    <tr key={p._id.toString()}>
                      <td className="mono accent-text">{p.code}</td>
                      <td>
                        <Link href={`/projects/${p._id.toString()}`} className="row-link">{p.name}</Link>
                      </td>
                      <td className="muted">{client?.brandName || client?.name || "Client"}</td>
                      <td>
                        <StageTrack stage={p.stage} />
                        <span className="tiny muted">{STAGE_LABELS[p.stage].number} · {STAGE_LABELS[p.stage].short}</span>
                      </td>
                      <td><HealthBadge health={p.health} /></td>
                      <td className="mono">{money(p.approvedContractValue || p.quotedValue || 0)}</td>
                      <td className="muted">{p.deliveryDate ? formatDate(p.deliveryDate) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ============================== TEAM ============================== */}
      {view === "team" && (
        <section>
          <div className="section-head">
            <div>
              <span className="section-index">Structure</span>
              <h2>Everyone has a lane</h2>
              <p>Projects move across lanes. Bars show each person&apos;s open accountable tasks.</p>
            </div>
            <span className="badge badge-active">{rosterUsers.length} people</span>
          </div>
          <div className="lane-grid">
            {lanes.map((lane, i) => {
              const members = rosterUsers.filter((u) => u.laneIds?.some((id) => id.toString() === lane._id.toString()));
              return (
                <div key={lane._id.toString()} className={`panel lane-col lane-${i % 3}`}>
                  <div className="lane-head">
                    <span className="lane-dot" />
                    <h3>{lane.name}</h3>
                    <span className="mono muted">{String(members.length).padStart(2, "0")}</span>
                  </div>
                  <ul className="person-list">
                    {members.map((m) => {
                      const load = tasksByOwner.get(m._id.toString()) ?? 0;
                      return (
                        <li key={m._id.toString()} className="person-row">
                          <span className="avatar sm">{m.name.split(/\s+/).map((x) => x[0]).join("").slice(0, 2)}</span>
                          <span className="person-meta">
                            <strong>{m.name}</strong>
                            <span>{m.title || "Studio member"}</span>
                            <span className="load"><i style={{ width: `${(load / maxLoad) * 100}%` }} /></span>
                          </span>
                          <span className="mono muted">{load}</span>
                        </li>
                      );
                    })}
                    {members.length === 0 ? <li className="muted">Nobody in this lane yet.</li> : null}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================== FINANCE ============================== */}
      {view === "finance" && isExec && (
        <div className="stack" style={{ gap: "1.6rem" }}>
          <section>
            <div className="section-head">
              <div>
                <span className="section-index">Money</span>
                <h2>From contract to cash</h2>
                <p>Estimated, committed and actual costs stay separate. Never one blended number.</p>
              </div>
            </div>
            <div className="kpi-grid kpi-grid-3">
              <div className="kpi is-accent">
                <span className="kpi-label">01 · Contracted</span>
                <span className="kpi-value">{money(totalContractedValue)}</span>
                <span className="kpi-sub">Client-approved scope</span>
              </div>
              <div className="kpi">
                <span className="kpi-label">02 · Invoiced <span>{pct(totalInvoiced, totalContractedValue)}%</span></span>
                <span className="kpi-value">{money(totalInvoiced)}</span>
                <span className="kpi-sub">Of contracted value</span>
              </div>
              <div className="kpi is-good">
                <span className="kpi-label">03 · Collected <span>{pct(totalCollected, totalInvoiced)}%</span></span>
                <span className="kpi-value">{money(totalCollected)}</span>
                <span className="kpi-sub">Of invoiced value</span>
              </div>
              <div className="kpi">
                <span className="kpi-label">04 · Committed</span>
                <span className="kpi-value">{money(totalCommittedCost)}</span>
                <span className="kpi-sub">Open supplier POs</span>
              </div>
              <div className="kpi is-danger">
                <span className="kpi-label">05 · Actual spend</span>
                <span className="kpi-value">{money(totalActualCost)}</span>
                <span className="kpi-sub">Billed supplier costs</span>
              </div>
              <div className="kpi is-good">
                <span className="kpi-label">06 · Projected profit <span>{pct(totalProjectedMargin, totalContractedValue)}%</span></span>
                <span className="kpi-value">{money(totalProjectedMargin)}</span>
                <span className="kpi-sub">Contract − (committed + actual)</span>
              </div>
            </div>
          </section>

          <section>
            <div className="section-head">
              <div>
                <span className="section-index">Cash alerts</span>
                <h2>Overdue payments</h2>
              </div>
              <span className={overdueInvoices.length ? "badge badge-danger" : "badge badge-good"}>
                {overdueInvoices.length ? `${overdueInvoices.length} overdue` : "All clear"}
              </span>
            </div>
            {overdueInvoices.length === 0 ? (
              <p className="empty">All client invoices and payment milestones are up to date.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Project</th>
                      <th>Milestone</th>
                      <th>Amount</th>
                      <th>Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueInvoices.map((inv) => {
                      const p = inv.projectId as unknown as { _id?: unknown; code?: string; name?: string } | null;
                      return (
                        <tr key={inv._id.toString()}>
                          <td className="mono">{inv.invoiceNumber}</td>
                          <td>
                            {p ? (
                              <Link href={`/projects/${p._id?.toString()}/commercials`} className="row-link">
                                {p.code} · {p.name}
                              </Link>
                            ) : "—"}
                          </td>
                          <td className="muted">{inv.milestoneTitle}</td>
                          <td className="mono danger-text">{money(inv.amount)}</td>
                          <td className="muted">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
