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
import { Deliverable } from "@/models/Deliverable";
import {
  MACRO_PHASES,
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

  const [projects, leads, allInvoices, activeTasks, rosterUsers, pendingDeliverables] = await Promise.all([
    listProjects(),
    listLeads(),
    Invoice.find().populate("projectId", "code name").lean(),
    Task.find({ status: { $nin: ["done"] } })
      .populate("projectId", "code name")
      .populate("accountableOwnerId", "name title email")
      .sort({ dueDate: 1 })
      .lean(),
    User.find().sort({ role: 1, name: 1 }).lean(),
    Deliverable.find({ status: { $in: ["internal_review", "revision_required"] } })
      .populate("projectId", "code name contractedRevisionRounds")
      .sort({ updatedAt: -1 })
      .lean(),
  ]);

  const activeProjects = projects.filter((p) => p.status !== "closed");
  const now = new Date();

  // 1. Executive KPI Calculations
  const totalPipelineRevenue = leads
    .filter((l) => l.stage !== "lost" && l.stage !== "won")
    .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

  const totalContractedValue = activeProjects.reduce(
    (sum, p) => sum + (p.approvedContractValue || p.quotedValue || 0),
    0,
  );

  const totalActualCost = activeProjects.reduce((sum, p) => sum + (p.actualTotalCost || 0), 0);
  const totalCommittedCost = activeProjects.reduce((sum, p) => sum + (p.committedTotalCost || 0), 0);
  const totalProjectedMargin = totalContractedValue - (totalActualCost + totalCommittedCost);

  // Invoiced & Cash In
  const totalInvoiced = allInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalCollected = allInvoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const overdueInvoices = allInvoices.filter(
    (inv) => inv.status !== "paid" && inv.dueDate && new Date(inv.dueDate) < now,
  );

  // 2. Exception Radar (Section 14: "The dashboard should show exceptions that need attention")
  const atRiskProjects = activeProjects.filter((p) => p.health === "at_risk" || p.health === "blocked");
  const overdueTasks = activeTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now);
  const myTasks = activeTasks.filter(
    (t) =>
      (t.accountableOwnerId as unknown as { _id?: unknown } | null)?._id?.toString() === user.id ||
      t.assigneeId?.toString() === user.id,
  );

  // 3. Macro 4-Stage Workflow Matrix (MH Workflow & Operating Structure Page 1)
  const macroPhasesWithProjects = MACRO_PHASES.map((phase) => ({
    ...phase,
    projects: activeProjects.filter((p) => (phase.stages as readonly string[]).includes(p.stage)),
  }));

  // 4. Product Breakdown for Business Perspective
  const productMetrics = (STUDIO_PRODUCTS as readonly StudioProduct[]).map((prod) => {
    const prodLeads = leads.filter((l) => l.products?.includes(prod));
    const prodProjects = activeProjects.filter((p) => p.products?.includes(prod));
    const pipelineSum = prodLeads.reduce((s, l) => s + (l.estimatedValue || 0), 0);
    const contractedSum = prodProjects.reduce(
      (s, p) => s + (p.approvedContractValue || p.quotedValue || 0),
      0,
    );
    return {
      product: prod,
      label: STUDIO_PRODUCT_LABELS[prod],
      leadsCount: prodLeads.length,
      pipelineSum,
      projectsCount: prodProjects.length,
      contractedSum,
    };
  });

  return (
    <div className="page page-wide">
      <Banner error={flash.error} notice={flash.notice} />

      <header className="page-header">
        <div>
          <p className="kicker">Creative Studio Operating System</p>
          <h1 className="title-compact">Executive Command Center</h1>
          <p className="lede">
            Welcome back, {user.name.split(" ")[0]}. {user.title ? `(${user.title})` : ""}
            Portfolio pipeline, 4-stage workflow velocity, multidisciplinary lanes, and margin analytics.
          </p>
        </div>
        <div>
          <Link className="btn btn-primary" href="/projects/new">
            + Start New Project
          </Link>
        </div>
      </header>

      {/* Perspective Navigation Bar (Section 13) */}
      <nav className="tabs" style={{ marginBottom: "1.5rem" }}>
        <Link href="/dashboard?view=overview" className={`tab ${view === "overview" ? "active" : ""}`}>
          Studio Overview
        </Link>
        <Link href="/dashboard?view=business" className={`tab ${view === "business" ? "active" : ""}`}>
          Business Perspective (Sales & Products)
        </Link>
        <Link href="/dashboard?view=project" className={`tab ${view === "project" ? "active" : ""}`}>
          Project Perspective (11 Gates & Health)
        </Link>
        <Link href="/dashboard?view=team" className={`tab ${view === "team" ? "active" : ""}`}>
          Team Perspective (3 Lanes & Capacity)
        </Link>
        {user.role === "owner" || user.isExecutive ? (
          <Link href="/dashboard?view=finance" className={`tab ${view === "finance" ? "active" : ""}`}>
            Financial Perspective (Tri-Partite Margins)
          </Link>
        ) : null}
      </nav>

      {/* =========================================================================
          VIEW 1: STUDIO OVERVIEW
          ========================================================================= */}
      {view === "overview" && (
        <div className="stack" style={{ gap: "1.5rem" }}>
          {/* Executive KPI Ribbon */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "1rem",
            }}
          >
            <div className="card" style={{ background: "#f8fafc" }}>
              <span className="muted" style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.04em" }}>
                ACTIVE CONTRACT VALUE
              </span>
              <div style={{ fontSize: "1.65rem", fontWeight: 700, margin: "0.3rem 0", color: "var(--accent)" }}>
                ${totalContractedValue.toLocaleString()}
              </div>
              <span className="muted" style={{ fontSize: "0.75rem" }}>
                Across {activeProjects.length} in-flight studio projects
              </span>
            </div>

            <div className="card" style={{ background: "#f8fafc" }}>
              <span className="muted" style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.04em" }}>
                SALES PIPELINE
              </span>
              <div style={{ fontSize: "1.65rem", fontWeight: 700, margin: "0.3rem 0", color: "#4f46e5" }}>
                ${totalPipelineRevenue.toLocaleString()}
              </div>
              <span className="muted" style={{ fontSize: "0.75rem" }}>
                {leads.filter((l) => l.stage !== "lost" && l.stage !== "won").length} active opportunities in Stages 01–03
              </span>
            </div>

            <div className="card" style={{ background: atRiskProjects.length > 0 ? "#fef2f2" : "#f8fafc" }}>
              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  color: atRiskProjects.length > 0 ? "#dc2626" : "var(--muted)",
                }}
              >
                PORTFOLIO HEALTH
              </span>
              <div
                style={{
                  fontSize: "1.65rem",
                  fontWeight: 700,
                  margin: "0.3rem 0",
                  color: atRiskProjects.length > 0 ? "#dc2626" : "#16a34a",
                }}
              >
                {atRiskProjects.length > 0 ? `${atRiskProjects.length} At Risk / Blocked` : "All On Track"}
              </div>
              <span className="muted" style={{ fontSize: "0.75rem" }}>
                {activeProjects.length - atRiskProjects.length} healthy of {activeProjects.length} total
              </span>
            </div>

            {user.role === "owner" || user.isExecutive ? (
              <div className="card" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#166534", letterSpacing: "0.04em" }}>
                  PROJECTED GROSS MARGIN
                </span>
                <div style={{ fontSize: "1.65rem", fontWeight: 700, margin: "0.3rem 0", color: "#15803d" }}>
                  ${totalProjectedMargin.toLocaleString()}
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#15803d" }}>
                  {totalContractedValue > 0 ? ((totalProjectedMargin / totalContractedValue) * 100).toFixed(1) : 0}% Realization
                </span>
              </div>
            ) : (
              <div className="card" style={{ background: "#f8fafc" }}>
                <span className="muted" style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.04em" }}>
                  MY ACCOUNTABLE TASKS
                </span>
                <div style={{ fontSize: "1.65rem", fontWeight: 700, margin: "0.3rem 0", color: "var(--accent)" }}>
                  {myTasks.length} Open
                </div>
                <span className="muted" style={{ fontSize: "0.75rem" }}>
                  Assigned single-ownership tasks
                </span>
              </div>
            )}
          </div>

          {/* Exceptions Needing Attention (Section 14: Exceptions Radar) */}
          {(atRiskProjects.length > 0 || overdueTasks.length > 0 || overdueInvoices.length > 0 || pendingDeliverables.length > 0) ? (
            <div
              className="card"
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                padding: "1rem 1.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "1.1rem" }}>⚠️</span>
                <strong style={{ fontSize: "0.95rem", color: "#92400e" }}>
                  Attention Required — Operational & Commercial Exceptions
                </strong>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "0.75rem",
                }}
              >
                {atRiskProjects.map((p) => (
                  <div
                    key={p._id.toString()}
                    style={{
                      background: "#fff",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "6px",
                      borderLeft: "3px solid #dc2626",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                      <strong style={{ color: "#dc2626" }}>Project {p.code}</strong>
                      <span className="badge" style={{ background: "#fee2e2", color: "#dc2626" }}>
                        {p.health.toUpperCase()}
                      </span>
                    </div>
                    <Link
                      href={`/projects/${p._id.toString()}`}
                      style={{ fontWeight: 600, fontSize: "0.85rem", textDecoration: "none", color: "inherit", display: "block", marginTop: "0.2rem" }}
                    >
                      {p.name}
                    </Link>
                    <span className="muted" style={{ fontSize: "0.75rem" }}>
                      Stage {STAGE_LABELS[p.stage].number}: {STAGE_LABELS[p.stage].short}
                    </span>
                  </div>
                ))}

                {overdueTasks.slice(0, 3).map((t) => {
                  const p = t.projectId as unknown as { code?: string; name?: string } | null;
                  const owner = t.accountableOwnerId as unknown as { name?: string } | null;
                  return (
                    <div
                      key={t._id.toString()}
                      style={{
                        background: "#fff",
                        padding: "0.6rem 0.8rem",
                        borderRadius: "6px",
                        borderLeft: "3px solid #d97706",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                        <span className="muted">{p?.code ?? "Task"}</span>
                        <span style={{ color: "#dc2626", fontWeight: 600 }}>OVERDUE</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem", margin: "0.2rem 0" }}>{t.title}</div>
                      <span className="muted" style={{ fontSize: "0.75rem" }}>
                        Owner: {owner?.name ?? "Unassigned"} · Due {t.dueDate ? formatDate(t.dueDate) : "Past"}
                      </span>
                    </div>
                  );
                })}

                {overdueInvoices.slice(0, 2).map((inv) => {
                  const p = inv.projectId as unknown as { code?: string; name?: string } | null;
                  return (
                    <div
                      key={inv._id.toString()}
                      style={{
                        background: "#fff",
                        padding: "0.6rem 0.8rem",
                        borderRadius: "6px",
                        borderLeft: "3px solid #b91c1c",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                        <span className="muted">{p?.code ?? "Invoice"}</span>
                        <span style={{ color: "#b91c1c", fontWeight: 700 }}>PAYMENT OVERDUE</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem", margin: "0.2rem 0" }}>
                        {inv.invoiceNumber}: ${inv.amount.toLocaleString()}
                      </div>
                      <span className="muted" style={{ fontSize: "0.75rem" }}>
                        Due {inv.dueDate ? formatDate(inv.dueDate) : "Past due"}
                      </span>
                    </div>
                  );
                })}

                {pendingDeliverables.slice(0, 2).map((d) => {
                  const p = d.projectId as unknown as { code?: string; name?: string } | null;
                  return (
                    <div
                      key={d._id.toString()}
                      style={{
                        background: "#fff",
                        padding: "0.6rem 0.8rem",
                        borderRadius: "6px",
                        borderLeft: "3px solid #2563eb",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                        <span className="muted">{p?.code ?? "Deliverable"}</span>
                        <span className="badge" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                          {d.status === "internal_review" ? "Awaiting Review" : "Revision Round"}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem", margin: "0.2rem 0" }}>{d.title}</div>
                      <span className="muted" style={{ fontSize: "0.75rem" }}>
                        Version {d.currentVersion} · Round {d.revisionRound}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* 4-Stage Studio Workflow Matrix (From MH Operating Structure PDF Page 1) */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Studio 4-Stage Project Workflow</h2>
                <p className="hint" style={{ margin: "0.2rem 0 0" }}>
                  &ldquo;One project lead · One creative direction · Clear handovers · No step moves forward without alignment&rdquo;
                </p>
              </div>
              <span className="muted" style={{ fontSize: "0.8rem" }}>
                {activeProjects.length} Active In-Flight Projects
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "1rem",
              }}
            >
              {macroPhasesWithProjects.map((phase) => (
                <div
                  key={phase.id}
                  style={{
                    background: "var(--bg-subtle, #f9fafb)",
                    padding: "1rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-subtle, #e5e7eb)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.35rem" }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--accent)",
                      }}
                    >
                      Stage {phase.number}
                    </span>
                    <span className="badge">{phase.projects.length}</span>
                  </div>

                  <strong style={{ fontSize: "0.95rem", marginBottom: "0.25rem" }}>{phase.title}</strong>
                  <p className="muted" style={{ fontSize: "0.78rem", margin: "0 0 0.5rem", lineHeight: 1.35 }}>
                    {phase.summary}
                  </p>

                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 600, marginBottom: "0.75rem" }}>
                    Leads: {phase.leads}
                  </div>

                  {phase.projects.length === 0 ? (
                    <div
                      style={{
                        marginTop: "auto",
                        padding: "0.75rem",
                        textAlign: "center",
                        background: "#fff",
                        borderRadius: "6px",
                        border: "1px dashed #e5e7eb",
                        color: "var(--muted)",
                        fontSize: "0.78rem",
                      }}
                    >
                      No active projects in this stage
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "auto" }}>
                      {phase.projects.map((p) => {
                        const stageInfo = STAGE_LABELS[p.stage];
                        return (
                          <Link
                            key={p._id.toString()}
                            href={`/projects/${p._id.toString()}`}
                            style={{
                              background: "#fff",
                              padding: "0.5rem 0.75rem",
                              borderRadius: "6px",
                              border: "1px solid #e5e7eb",
                              textDecoration: "none",
                              color: "inherit",
                              display: "block",
                              transition: "border-color 0.15s ease",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                              <span style={{ fontWeight: 700, color: "var(--accent)" }}>{p.code}</span>
                              <span
                                style={{
                                  color: p.health === "at_risk" ? "#dc2626" : p.health === "blocked" ? "#b91c1c" : "#16a34a",
                                  fontWeight: 600,
                                }}
                              >
                                {p.health.toUpperCase()}
                              </span>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: "0.85rem", margin: "0.2rem 0" }}>
                              {p.name}
                            </div>
                            <div className="muted" style={{ fontSize: "0.75rem" }}>
                              Gate {stageInfo.number}: {stageInfo.short}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Operating Footnotes from PDF Page 1 */}
            <div
              style={{
                marginTop: "1.25rem",
                padding: "0.75rem 1rem",
                background: "var(--bg-subtle, #f9fafb)",
                borderRadius: "6px",
                fontSize: "0.78rem",
                color: "var(--muted)",
                display: "grid",
                gap: "0.25rem",
              }}
            >
              <div>• <strong>Mariam documents throughout every stage in parallel</strong> — Communication is where that work is packaged and shared externally, not the only point she is involved.</div>
              <div>• <strong>Sara M. contributes to vision development</strong> — She is the bridge between concept and delivery.</div>
            </div>
          </div>

          {/* My Accountable Deliverable Tasks */}
          {myTasks.length > 0 ? (
            <div className="card">
              <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.15rem" }}>My Accountable Deliverable Tasks</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
                {myTasks.map((t) => {
                  const p = t.projectId as unknown as { _id?: unknown; code?: string; name?: string } | null;
                  return (
                    <div
                      key={t._id.toString()}
                      style={{
                        padding: "0.75rem",
                        background: "var(--bg-subtle, #f9fafb)",
                        borderRadius: "6px",
                        borderLeft: "3px solid var(--accent)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                        <span style={{ fontWeight: 700, color: "var(--accent)" }}>{p?.code ?? "Project"}</span>
                        <span className="badge">{t.priority}</span>
                      </div>
                      <h4 style={{ margin: "0.25rem 0", fontSize: "0.95rem" }}>{t.title}</h4>
                      {t.dueDate ? (
                        <span className="muted" style={{ fontSize: "0.75rem" }}>Due: {formatDate(t.dueDate)}</span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* =========================================================================
          VIEW 2: BUSINESS PERSPECTIVE (SALES & PRODUCTS)
          Section 13: "How much business is in the pipeline? What has been won?
          What revenue is expected? Which products and clients generate business?"
          ========================================================================= */}
      {view === "business" && (
        <div className="stack" style={{ gap: "1.5rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Commercial & Sales Performance</h2>
                <p className="hint" style={{ margin: "0.25rem 0 0" }}>
                  Managing Director view: Pipeline progression, conversion velocity, and revenue distribution across the 6 core MakeHappn studio products.
                </p>
              </div>
              <Link href="/sales" className="btn btn-primary">
                Open Sales CRM Pipeline →
              </Link>
            </div>

            {/* Sales Metrics Strip */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "1rem",
                marginTop: "1.25rem",
              }}
            >
              <div style={{ padding: "0.85rem", background: "var(--bg-subtle, #f9fafb)", borderRadius: "6px" }}>
                <span className="muted" style={{ fontSize: "0.78rem", fontWeight: 600 }}>Active In-Flight Leads</span>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.2rem 0" }}>
                  {leads.filter((l) => l.stage !== "lost" && l.stage !== "won").length}
                </div>
                <span className="muted" style={{ fontSize: "0.75rem" }}>Stages 01–03 qualification</span>
              </div>

              <div style={{ padding: "0.85rem", background: "var(--bg-subtle, #f9fafb)", borderRadius: "6px" }}>
                <span className="muted" style={{ fontSize: "0.78rem", fontWeight: 600 }}>Total Pipeline Value</span>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#4f46e5", margin: "0.2rem 0" }}>
                  ${totalPipelineRevenue.toLocaleString()}
                </div>
                <span className="muted" style={{ fontSize: "0.75rem" }}>Uncontracted opportunity value</span>
              </div>

              <div style={{ padding: "0.85rem", background: "var(--bg-subtle, #f9fafb)", borderRadius: "6px" }}>
                <span className="muted" style={{ fontSize: "0.78rem", fontWeight: 600 }}>Won & Converted Projects</span>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#16a34a", margin: "0.2rem 0" }}>
                  {leads.filter((l) => l.stage === "won").length}
                </div>
                <span className="muted" style={{ fontSize: "0.75rem" }}>Moved into Stage 04 delivery</span>
              </div>

              <div style={{ padding: "0.85rem", background: "var(--bg-subtle, #f9fafb)", borderRadius: "6px" }}>
                <span className="muted" style={{ fontSize: "0.78rem", fontWeight: 600 }}>Avg Deal Size</span>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.2rem 0" }}>
                  ${leads.length > 0 ? Math.round(totalPipelineRevenue / (leads.length || 1)).toLocaleString() : 0}
                </div>
                <span className="muted" style={{ fontSize: "0.75rem" }}>Across all active products</span>
              </div>
            </div>
          </div>

          {/* Breakdown by the 6 Studio Products (Section 3 of PDF) */}
          <div className="card">
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem" }}>
              Revenue & Demand across the 6 MakeHappn Products & Services
            </h3>
            <p className="hint" style={{ marginBottom: "1rem" }}>
              MakeHappn sells 6 modular products. A project can combine multiple products or run as a standalone service.
            </p>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", textAlign: "left", fontSize: "0.85rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ padding: "0.6rem 0.5rem" }}>Studio Product</th>
                    <th style={{ padding: "0.6rem 0.5rem" }}>Active Projects</th>
                    <th style={{ padding: "0.6rem 0.5rem" }}>Contracted Value</th>
                    <th style={{ padding: "0.6rem 0.5rem" }}>Sales Leads</th>
                    <th style={{ padding: "0.6rem 0.5rem" }}>Pipeline Value</th>
                  </tr>
                </thead>
                <tbody>
                  {productMetrics.map((pm) => (
                    <tr key={pm.product} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "0.6rem 0.5rem", fontWeight: 600 }}>
                        <Link href={`/projects?product=${pm.product}`} style={{ textDecoration: "none", color: "var(--accent)" }}>
                          {pm.label}
                        </Link>
                      </td>
                      <td style={{ padding: "0.6rem 0.5rem" }}>
                        <span className="badge">{pm.projectsCount}</span>
                      </td>
                      <td style={{ padding: "0.6rem 0.5rem", fontWeight: 700 }}>
                        ${pm.contractedSum.toLocaleString()}
                      </td>
                      <td style={{ padding: "0.6rem 0.5rem" }}>
                        <span className="badge">{pm.leadsCount}</span>
                      </td>
                      <td style={{ padding: "0.6rem 0.5rem", color: "#4f46e5", fontWeight: 600 }}>
                        ${pm.pipelineSum.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: PROJECT PERSPECTIVE (11 GATES & HEALTH)
          Section 13: "What stage is each project in? What is due next?
          Which projects are delayed, waiting for approval or at risk? Are projects within budget?"
          ========================================================================= */}
      {view === "project" && (
        <div className="stack" style={{ gap: "1.5rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Studio Active Project Portfolio Matrix</h2>
                <p className="hint" style={{ margin: "0.25rem 0 0" }}>
                  Tracking the 11 sequential lifecycle gates, health indicators, accountable owners, and delivery targets.
                </p>
              </div>
              <Link href="/projects" className="btn btn-primary">
                Full Projects List →
              </Link>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", textAlign: "left", fontSize: "0.85rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ padding: "0.6rem 0.5rem" }}>Code</th>
                    <th style={{ padding: "0.6rem 0.5rem" }}>Project Name</th>
                    <th style={{ padding: "0.6rem 0.5rem" }}>Client</th>
                    <th style={{ padding: "0.6rem 0.5rem" }}>Stage Gate</th>
                    <th style={{ padding: "0.6rem 0.5rem" }}>Health</th>
                    <th style={{ padding: "0.6rem 0.5rem" }}>Contract Value</th>
                    <th style={{ padding: "0.6rem 0.5rem" }}>Target Delivery</th>
                    <th style={{ padding: "0.6rem 0.5rem" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeProjects.map((p) => {
                    const stageInfo = STAGE_LABELS[p.stage];
                    const client = p.clientId as unknown as { name?: string; brandName?: string } | null;
                    return (
                      <tr key={p._id.toString()} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "0.6rem 0.5rem", fontWeight: 700, color: "var(--accent)" }}>
                          {p.code}
                        </td>
                        <td style={{ padding: "0.6rem 0.5rem", fontWeight: 600 }}>{p.name}</td>
                        <td style={{ padding: "0.6rem 0.5rem" }}>{client?.brandName || client?.name || "Client"}</td>
                        <td style={{ padding: "0.6rem 0.5rem" }}>
                          <span className="badge badge-active" style={{ fontSize: "0.75rem" }}>
                            Stage {stageInfo.number}: {stageInfo.short}
                          </span>
                        </td>
                        <td style={{ padding: "0.6rem 0.5rem" }}>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              padding: "0.15rem 0.45rem",
                              borderRadius: "999px",
                              background: p.health === "at_risk" ? "#fee2e2" : p.health === "blocked" ? "#fef2f2" : "#dcfce7",
                              color: p.health === "at_risk" ? "#dc2626" : p.health === "blocked" ? "#b91c1c" : "#15803d",
                            }}
                          >
                            {p.health.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "0.6rem 0.5rem", fontWeight: 600 }}>
                          ${(p.approvedContractValue || p.quotedValue || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: "0.6rem 0.5rem" }}>
                          {p.deliveryDate ? formatDate(p.deliveryDate) : "—"}
                        </td>
                        <td style={{ padding: "0.6rem 0.5rem" }}>
                          <Link href={`/projects/${p._id.toString()}`} style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                            Workspace →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 4: TEAM PERSPECTIVE (3 LANES & CAPACITY)
          MH Workflow & Operating Structure PDF Page 2:
          "A multidisciplinary team built around three connected functions — vision, delivery, and communication."
          "Everyone has a lane · Projects move across lanes · Ownership is clear at every handover"
          ========================================================================= */}
      {view === "team" && (
        <div className="stack" style={{ gap: "1.5rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Studio Multidisciplinary Operating Structure</h2>
                <p className="hint" style={{ margin: "0.25rem 0 1.25rem" }}>
                  Three connected functions working around project owners and creative leads. Single accountable task ownership with cross-lane collaboration.
                </p>
              </div>
              <span className="badge badge-active">
                {rosterUsers.length} Active Studio Roles
              </span>
            </div>

            {/* Founder Box at Top (Page 2) */}
            <div
              style={{
                background: "#0f172a",
                color: "#fff",
                padding: "1rem 1.25rem",
                borderRadius: "8px",
                marginBottom: "1.5rem",
                maxWidth: "480px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "1.05rem" }}>Sara Dawoud</strong>
                <span className="badge" style={{ background: "#334155", color: "#f8fafc" }}>FOUNDER & MANAGING DIRECTOR</span>
              </div>
              <p style={{ margin: "0.4rem 0 0", fontSize: "0.82rem", color: "#94a3b8" }}>
                Business • Strategy • Clients • Final decisions
              </p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#cbd5e1", fontStyle: "italic" }}>
                *Sara Dawoud contributes to initial Art direction alongside Nadine.
              </p>
            </div>

            {/* 3 Connected Lanes */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1.25rem",
              }}
            >
              {/* Lane 1: Vision & Design */}
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "8px",
                  border: "2px solid #312e81",
                  padding: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <span style={{ display: "inline-block", width: "12px", height: "12px", borderRadius: "50%", background: "#312e81" }} />
                  <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#1e1b4b" }}>Vision & Design Lane</h3>
                </div>

                <div className="stack" style={{ gap: "0.6rem" }}>
                  <div style={{ background: "#fff", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>Sama</strong>
                      <span className="badge">Creative Lead</span>
                    </div>
                    <span className="muted" style={{ fontSize: "0.75rem" }}>
                      Concept • Experience • Storytelling • Client Management
                    </span>
                  </div>

                  <div style={{ background: "#fff", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>Nadine</strong>
                      <span className="badge">Senior Graphic Designer</span>
                    </div>
                    <span className="muted" style={{ fontSize: "0.75rem" }}>
                      Branding • 2D • Visual identity • Visual direction
                    </span>
                  </div>

                  <div style={{ background: "#fff", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>Sohila</strong>
                      <span className="badge">Art Director / Senior 3D</span>
                    </div>
                    <span className="muted" style={{ fontSize: "0.75rem" }}>
                      3D • Spatial thinking • Art direction
                    </span>
                  </div>

                  <div style={{ background: "#fff", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>Hamdy</strong>
                      <span className="badge">Spatial / 3D Visualizer</span>
                    </div>
                    <span className="muted" style={{ fontSize: "0.75rem" }}>
                      Spatial design • 3D • Renders • Technical development
                    </span>
                  </div>
                </div>
              </div>

              {/* Lane 2: Project & Delivery */}
              <div
                style={{
                  background: "#f0fdf4",
                  borderRadius: "8px",
                  border: "2px solid #0f766e",
                  padding: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <span style={{ display: "inline-block", width: "12px", height: "12px", borderRadius: "50%", background: "#0f766e" }} />
                  <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#064e3b" }}>Project & Delivery Lane</h3>
                </div>

                <div className="stack" style={{ gap: "0.6rem" }}>
                  <div style={{ background: "#fff", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #d1fae5" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>Sara M.</strong>
                      <span className="badge" style={{ background: "#0f766e", color: "#fff" }}>Project & Delivery Lead</span>
                    </div>
                    <span className="muted" style={{ fontSize: "0.75rem" }}>
                      Vision development • Briefing • Timelines • Budgeting
                    </span>
                    <div style={{ fontSize: "0.72rem", color: "#0f766e", fontStyle: "italic", marginTop: "0.2rem" }}>
                      *Bridge between concept and delivery
                    </div>
                  </div>

                  <div style={{ background: "#fff", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #d1fae5" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>Mai</strong>
                      <span className="badge">Design & Production Executive</span>
                    </div>
                    <span className="muted" style={{ fontSize: "0.75rem" }}>
                      Production • Fabrication • Suppliers • Site • Procurement
                    </span>
                  </div>

                  <div style={{ background: "#fff", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px dashed #0f766e" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>Production Intern</strong>
                      <span className="badge" style={{ background: "#fef3c7", color: "#92400e" }}>Open Role</span>
                    </div>
                    <span className="muted" style={{ fontSize: "0.75rem" }}>
                      Production support • Site operations • Supplier follow-up
                    </span>
                  </div>
                </div>
              </div>

              {/* Lane 3: Communication */}
              <div
                style={{
                  background: "#fffbeb",
                  borderRadius: "8px",
                  border: "2px solid #b45309",
                  padding: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <span style={{ display: "inline-block", width: "12px", height: "12px", borderRadius: "50%", background: "#b45309" }} />
                  <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#78350f" }}>Communication Lane</h3>
                </div>

                <div className="stack" style={{ gap: "0.6rem" }}>
                  <div style={{ background: "#fff", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #fef3c7" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>Mariam</strong>
                      <span className="badge" style={{ background: "#b45309", color: "#fff" }}>Social Media Specialist</span>
                    </div>
                    <span className="muted" style={{ fontSize: "0.75rem" }}>
                      Content • Social media • Project storytelling & documentation
                    </span>
                    <div style={{ fontSize: "0.72rem", color: "#b45309", fontStyle: "italic", marginTop: "0.2rem" }}>
                      *Mariam runs in parallel across every project stage
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 5: FINANCIAL PERSPECTIVE (TRI-PARTITE MARGINS)
          MakeHappn [Dashboard].pdf Section 9 & 13:
          "What has been quoted, approved, committed, spent, invoiced and collected?
          What is the expected and actual project profit?"
          "The dashboard should clearly distinguish estimated, committed and actual costs.
          These are different figures and should not be combined into one number."
          ========================================================================= */}
      {view === "finance" && (user.role === "owner" || user.isExecutive) && (
        <div className="stack" style={{ gap: "1.5rem" }}>
          <div className="card">
            <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Tri-Partite Financial Engine & Cashflow Control</h2>
            <p className="hint" style={{ margin: "0.25rem 0 1.25rem" }}>
              Mandatory 3-tier financial model separating Estimated Budget, Committed PO Liabilities, and Incurred Actual Expenses. Zero double-counting.
            </p>

            {/* 6 Key Tri-Partite Pillars */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "1rem",
              }}
            >
              <div style={{ padding: "0.85rem", background: "#f8fafc", borderRadius: "6px" }}>
                <span className="muted" style={{ fontSize: "0.78rem", fontWeight: 700 }}>1. APPROVED CONTRACT VALUE</span>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.2rem 0", color: "var(--accent)" }}>
                  ${totalContractedValue.toLocaleString()}
                </div>
                <span className="muted" style={{ fontSize: "0.75rem" }}>Client approved scope</span>
              </div>

              <div style={{ padding: "0.85rem", background: "#f8fafc", borderRadius: "6px" }}>
                <span className="muted" style={{ fontSize: "0.78rem", fontWeight: 700 }}>2. INVOICED TO CLIENTS</span>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.2rem 0", color: "#2563eb" }}>
                  ${totalInvoiced.toLocaleString()}
                </div>
                <span className="muted" style={{ fontSize: "0.75rem" }}>
                  {totalContractedValue > 0 ? ((totalInvoiced / totalContractedValue) * 100).toFixed(0) : 0}% of contracted
                </span>
              </div>

              <div style={{ padding: "0.85rem", background: "#f0fdf4", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#166534" }}>3. CASH COLLECTED</span>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.2rem 0", color: "#15803d" }}>
                  ${totalCollected.toLocaleString()}
                </div>
                <span className="muted" style={{ fontSize: "0.75rem" }}>Settled client receipts</span>
              </div>

              <div style={{ padding: "0.85rem", background: "#f8fafc", borderRadius: "6px" }}>
                <span className="muted" style={{ fontSize: "0.78rem", fontWeight: 700 }}>4. COMMITTED PO LIABILITIES</span>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.2rem 0", color: "#d97706" }}>
                  ${totalCommittedCost.toLocaleString()}
                </div>
                <span className="muted" style={{ fontSize: "0.75rem" }}>Open supplier commitments</span>
              </div>

              <div style={{ padding: "0.85rem", background: "#f8fafc", borderRadius: "6px" }}>
                <span className="muted" style={{ fontSize: "0.78rem", fontWeight: 700 }}>5. ACTUAL INCURRED EXPENSES</span>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.2rem 0", color: "#dc2626" }}>
                  ${totalActualCost.toLocaleString()}
                </div>
                <span className="muted" style={{ fontSize: "0.75rem" }}>Billed supplier costs & expenses</span>
              </div>

              <div style={{ padding: "0.85rem", background: "#f0fdf4", borderRadius: "6px", border: "1px solid #86efac" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#15803d" }}>6. PROJECTED GROSS PROFIT</span>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.2rem 0", color: "#15803d" }}>
                  ${totalProjectedMargin.toLocaleString()}
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#15803d" }}>
                  {totalContractedValue > 0 ? ((totalProjectedMargin / totalContractedValue) * 100).toFixed(1) : 0}% Realized margin
                </span>
              </div>
            </div>
          </div>

          {/* Cash & Payment Alerts (Section 10: Cash / Payment Alerts) */}
          <div className="card">
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem" }}>Cashflow & Payment Milestones Status</h3>
            <p className="hint" style={{ marginBottom: "1rem" }}>
              Tracking client invoicing, deposit payments, and overdue balances.
            </p>

            {overdueInvoices.length === 0 ? (
              <p className="notice">All client invoices and payment milestones are currently up to date.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", textAlign: "left", fontSize: "0.85rem", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                      <th style={{ padding: "0.6rem 0.5rem" }}>Invoice #</th>
                      <th style={{ padding: "0.6rem 0.5rem" }}>Project</th>
                      <th style={{ padding: "0.6rem 0.5rem" }}>Milestone Title</th>
                      <th style={{ padding: "0.6rem 0.5rem" }}>Amount</th>
                      <th style={{ padding: "0.6rem 0.5rem" }}>Due Date</th>
                      <th style={{ padding: "0.6rem 0.5rem" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueInvoices.map((inv) => {
                      const p = inv.projectId as unknown as { _id?: unknown; code?: string; name?: string } | null;
                      return (
                        <tr key={inv._id.toString()} style={{ borderBottom: "1px solid #fee2e2" }}>
                          <td style={{ padding: "0.6rem 0.5rem", fontWeight: 700 }}>{inv.invoiceNumber}</td>
                          <td style={{ padding: "0.6rem 0.5rem" }}>
                            {p ? (
                              <Link href={`/projects/${p._id?.toString()}/commercials`} style={{ fontWeight: 600 }}>
                                {p.code}: {p.name}
                              </Link>
                            ) : "—"}
                          </td>
                          <td style={{ padding: "0.6rem 0.5rem" }}>{inv.milestoneTitle}</td>
                          <td style={{ padding: "0.6rem 0.5rem", fontWeight: 700, color: "#dc2626" }}>
                            ${inv.amount.toLocaleString()}
                          </td>
                          <td style={{ padding: "0.6rem 0.5rem" }}>
                            {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                          </td>
                          <td style={{ padding: "0.6rem 0.5rem" }}>
                            <span className="badge" style={{ background: "#fee2e2", color: "#dc2626" }}>
                              OVERDUE
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}