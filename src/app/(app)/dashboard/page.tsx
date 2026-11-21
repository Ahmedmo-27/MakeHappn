import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Sticker } from "@/components/brand/sticker";
import { Banner, PageFallback } from "@/components/banner";
import { HealthBadge, StageTrack, loadDashboardBundle, money, pct } from "@/components/dashboard/shared";
import { SubmitButton } from "@/components/submit-button";
import { InquiryCard } from "@/components/inquiry-card";
import { orEmpty } from "@/lib/db";
import { formatDate, readMessage } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { listInquiries } from "@/services/inquiries";
import { createDecisionFormAction, createGoalFormAction, decideFormAction } from "@/app/actions/studio-ops";
import { STAGE_LABELS, inquiryNeedsAttention } from "@/lib/domain";

const LEGACY_VIEWS: Record<string, string> = {
  business: "/dashboard/business",
  project: "/dashboard/projects",
  projects: "/dashboard/projects",
  team: "/dashboard/team",
  finance: "/dashboard/finance",
};

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading studio command center" />}>
      <DashboardOverview searchParams={searchParams} />
    </Suspense>
  );
}

async function DashboardOverview({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  const legacy = typeof params.view === "string" ? LEGACY_VIEWS[params.view] : undefined;
  if (legacy) redirect(legacy);

  const flash = readMessage(params);
  const isExec = user.role === "owner" || !!user.isExecutive;
  const data = await loadDashboardBundle(user);
  const inquiries = await orEmpty(() => listInquiries(), []);
  const checkedAt = new Date();
  const pendingInquiries = inquiries
    .filter((inquiry) => inquiry.status === "pending")
    .sort(
      (a, b) =>
        Number(inquiryNeedsAttention(b, checkedAt)) - Number(inquiryNeedsAttention(a, checkedAt)) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  const {
    now,
    goals,
    decisions,
    activeProjects,
    openLeads,
    pipelineLabel,
    contractedLabel,
    totalProjectedMargin,
    totalContractedValue,
    atRiskProjects,
    overdueInvoices,
    overdueTasks,
    myTasks,
    exceptionCount,
    pendingDeliverables,
    macroPhasesWithProjects,
  } = data;

  return (
    <>
      <Banner error={flash.error} notice={flash.notice} />
      <p className="lede" style={{ marginTop: "-0.5rem", marginBottom: "1.25rem" }}>
        {exceptionCount > 0
          ? `${exceptionCount} thing${exceptionCount === 1 ? "" : "s"} need${exceptionCount === 1 ? "s" : ""} your attention across ${activeProjects.length} live projects.`
          : `Everything is on track across ${activeProjects.length} live projects.`}
      </p>
      <div className="stack" style={{ gap: "1.6rem" }}>
        <div className="kpi-grid">
          <div className="kpi">
            <span className="kpi-label">Active contract value</span>
            <span className="kpi-value">{contractedLabel}</span>
            <span className="kpi-sub">{activeProjects.length} live projects</span>
          </div>
          <div className="kpi">
            <span className="kpi-label">Sales pipeline</span>
            <span className="kpi-value">{pipelineLabel}</span>
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

        {pendingInquiries.length > 0 ? (
          <section>
            <div className="section-head">
              <div>
                <span className="section-index">New inquiries</span>
              </div>
              <Link href="/sales/inquiries" className="btn btn-ghost">All inquiries <span className="arrow">→</span></Link>
            </div>
            <div className="card-grid">
              {pendingInquiries.map((inquiry) => (
                <InquiryCard key={inquiry._id} inquiry={inquiry} />
              ))}
            </div>
          </section>
        ) : null}

        {isExec ? (
          <div className="split">
            <section className="panel">
              <div className="section-head"><h2>Quarterly goals</h2></div>
              {goals.length === 0 ? <p className="muted">No goals for this year yet.</p> : goals.map((goal) => (
                <p key={String(goal._id)}><strong>Q{goal.quarter} {goal.year}</strong> · {goal.title} · {goal.progress}% · {goal.target}</p>
              ))}
              <form action={createGoalFormAction} className="stack">
                <label className="field"><span>Year</span><input className="input" name="year" type="number" defaultValue={now.getFullYear()} /></label>
                <label className="field"><span>Quarter</span><input className="input" name="quarter" type="number" min="1" max="4" defaultValue={Math.floor(now.getMonth() / 3) + 1} /></label>
                <label className="field"><span>Goal</span><input className="input" name="title" required /></label>
                <label className="field"><span>Target</span><input className="input" name="target" /></label>
                <label className="field"><span>Progress %</span><input className="input" name="progress" type="number" min="0" max="100" defaultValue={0} /></label>
                <SubmitButton>Save goal</SubmitButton>
              </form>
            </section>
            <section className="panel">
              <div className="section-head"><h2>Decisions for the founder</h2></div>
              {decisions.filter((item) => item.status === "open").map((item) => (
                <form key={String(item._id)} action={decideFormAction} className="stack" style={{ marginBottom: "0.8rem" }}>
                  <strong>{item.title}</strong>
                  <p className="hint">{item.context}</p>
                  <input type="hidden" name="id" value={String(item._id)} />
                  <input className="input" name="outcome" placeholder="What did we decide?" />
                  <SubmitButton variant="ghost">Record decision</SubmitButton>
                </form>
              ))}
              <form action={createDecisionFormAction} className="stack">
                <label className="field"><span>Decision needed</span><input className="input" name="title" required /></label>
                <label className="field"><span>Context</span><input className="input" name="context" /></label>
                <SubmitButton>Add to queue</SubmitButton>
              </form>
            </section>
          </div>
        ) : null}

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
              <div className="empty empty-illu">
                <Sticker name="laptop" className="sticker-plate empty-sticker" />
                <div><p>Nothing is on fire. Enjoy it.</p></div>
              </div>
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
    </>
  );
}
