import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Sticker } from "@/components/brand/sticker";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { readMessage } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { listLeads } from "@/services/commercial";
import {
  createLeadFormAction,
  convertLeadFormAction,
} from "@/app/actions/commercial";
import {
  completeFollowUpFormAction,
  createFollowUpFormAction,
  createProposalFormAction,
  createSalesTargetFormAction,
} from "@/app/actions/studio-ops";
import { listFollowUps, listProposals, listSalesTargets } from "@/services/studio-ops";
import { PROPOSAL_STATUSES } from "@/models/StudioOps";
import {
  STUDIO_PRODUCT_LABELS,
  CURRENCIES,
  type StudioProduct,
} from "@/lib/domain";
import { LEAD_STAGES, LEAD_STAGE_LABELS } from "@/models/Lead";

export default function SalesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<div className="page"><PageFallback label="Loading sales pipeline" /></div>}>
      <SalesPipeline searchParams={searchParams} />
    </Suspense>
  );
}

async function SalesPipeline({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [user, params, leads, proposals, followUps, targets] = await Promise.all([
    getCurrentUser(),
    searchParams,
    listLeads(),
    listProposals(),
    listFollowUps(),
    listSalesTargets(),
  ]);
  const flash = readMessage(params);

  const openLeads = leads.filter((l) => l.stage !== "lost" && l.stage !== "won");
  const totalPipelineValue = openLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  const weights: Record<string, number> = { inquiry: 0.2, discovery: 0.4, proposal: 0.6 };
  const forecast = openLeads.reduce((sum, lead) => sum + (lead.estimatedValue || 0) * (weights[lead.stage] ?? 0), 0);
  const targetTotal = targets.reduce((sum, target) => sum + target.amount, 0);

  const columns = LEAD_STAGES.filter((s) => s !== "lost").map((stage) => ({
    stage,
    title: LEAD_STAGE_LABELS[stage],
    leads: leads.filter((l) => l.stage === stage),
  }));

  return (
    <div className="page page-wide">
      <Banner error={flash.error} notice={flash.notice} />
      <header className="page-header">
        <div>
          <p className="kicker">Studio CRM</p>
          <h1>Sales & Opportunity Pipeline</h1>
          <p className="lede">
            Stages 01–04 commercial progression. Track client discovery, scope proposals, and trigger Stage 04 project confirmation upon agreement.
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <Sticker name="crafting-curating" className="sticker-plate header-oval" />
          <span style={{ fontSize: "0.85rem" }} className="muted">Total In-Flight Pipeline</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent)" }}>
            ${totalPipelineValue.toLocaleString()}
          </div>
          <p className="hint">Forecast ${Math.round(forecast).toLocaleString()} · target ${targetTotal.toLocaleString()}</p>
        </div>
      </header>

      {/* New Opportunity Drawer / Form */}
      <details className="disclosure" style={{ marginBottom: "1.5rem" }}>
        <summary className="btn btn-primary" style={{ cursor: "pointer" }}>
          + Add Client Inquiry / Lead
        </summary>
        <div className="card form-card stack" style={{ maxWidth: "720px", marginTop: "1rem", gap: "1.25rem" }}>
          <div className="form-header">
            <h3 className="form-title">New Client Opportunity</h3>
            <p className="form-subtitle">Capture inbound leads, prospect brand briefs, and commercial expectations.</p>
          </div>
          <form action={createLeadFormAction} className="stack" style={{ gap: "1.15rem" }}>
            <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label>Company / Brand Name *</label>
                <input name="companyName" type="text" required placeholder="e.g. Red Sea Global" className="input" />
              </div>
              <div className="form-group">
                <label>Primary Contact Person *</label>
                <input name="clientName" type="text" required placeholder="e.g. Fahad Al-Saud" className="input" />
              </div>
            </div>

            <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label>Email *</label>
                <input name="email" type="email" required placeholder="contact@brand.com" className="input" />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input name="phone" type="tel" placeholder="+966 ..." className="input" />
              </div>
            </div>

            <div className="form-group">
              <label>Products of Interest</label>
              <div className="check-list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.6rem" }}>
                {(Object.keys(STUDIO_PRODUCT_LABELS) as StudioProduct[]).map((prod) => (
                  <label key={prod}>
                    <input type="checkbox" name="products" value={prod} defaultChecked={prod === "turnkey_experience"} />
                    {STUDIO_PRODUCT_LABELS[prod]}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
              <div className="form-group">
                <label>Currency</label>
                <select name="currency" defaultValue="USD" className="select">
                  {CURRENCIES.map((curr) => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Estimated Value</label>
                <input name="estimatedValue" type="number" step="any" placeholder="100000" className="input" />
              </div>
            </div>

            <div className="form-group">
              <label>Inquiry Notes & Scope Brief</label>
              <textarea name="notes" rows={3} placeholder="Initial conversation notes, event vision, timeline expectations..." className="textarea" />
            </div>

            <div className="form-actions">
              <SubmitButton>Add to Pipeline</SubmitButton>
            </div>
          </form>
        </div>
      </details>

      {/* Pipeline Columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "1.25rem",
          alignItems: "flex-start",
        }}
      >
        {columns.map((col) => (
          <div
            key={col.stage}
            style={{
              background: "var(--bg-subtle, var(--surface-2))",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle, var(--line))",
              padding: "0.75rem",
              minHeight: "450px",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
                {col.title}
              </h3>
              <span className="badge">{col.leads.length}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {col.leads.map((lead) => {
                const convertedProj = lead.convertedProjectId as unknown as { _id?: unknown; code?: string; name?: string } | null;
                return (
                  <div key={lead._id.toString()} className="card" style={{ padding: "0.75rem", background: "var(--surface-2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <strong style={{ fontSize: "1rem" }}>{lead.companyName}</strong>
                      <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--accent)" }}>
                        {lead.currency} {lead.estimatedValue.toLocaleString()}
                      </span>
                    </div>

                    <p className="muted" style={{ fontSize: "0.85rem", margin: "0.25rem 0" }}>
                      {lead.clientName} ({lead.email})
                    </p>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", margin: "0.25rem 0" }}>
                      {lead.products.map((p) => (
                        <span key={p} style={{ fontSize: "0.7rem", padding: "0.1rem 0.35rem", background: "var(--surface-2)", borderRadius: "4px" }}>
                          {STUDIO_PRODUCT_LABELS[p]}
                        </span>
                      ))}
                    </div>

                    {lead.notes ? (
                      <p className="muted" style={{ fontSize: "0.8rem", margin: "0.25rem 0", fontStyle: "italic" }}>
                        &ldquo;{lead.notes}&rdquo;
                      </p>
                    ) : null}

                    {/* Stage 04 Project Confirmation Gate */}
                    {lead.stage === "proposal" || lead.stage === "discovery" ? (
                      <form action={convertLeadFormAction} style={{ marginTop: "0.5rem", borderTop: "1px solid var(--line)", paddingTop: "0.5rem" }}>
                        <input type="hidden" name="leadId" value={lead._id.toString()} />
                        <SubmitButton variant="ghost">
                          ✓ Confirm & Start Project (Gate 04)
                        </SubmitButton>
                      </form>
                    ) : lead.stage === "won" && convertedProj ? (
                      <div style={{ marginTop: "0.5rem", borderTop: "1px solid var(--line)", paddingTop: "0.5rem" }}>
                        <Link href={`/projects/${convertedProj._id?.toString()}`} style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--good)" }}>
                          ✓ Active Project: {convertedProj.code} →
                        </Link>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="split" style={{ marginTop: "1.5rem" }}>
        <section className="panel">
          <div className="section-head">
            <h2>Proposals and quotations</h2>
            <Link href="/clients">Client accounts</Link>
          </div>
          {proposals.map((proposal) => {
            const lead = proposal.leadId as unknown as { companyName?: string } | null;
            return (
              <article key={String(proposal._id)} className="card" style={{ marginBottom: "0.6rem" }}>
                <strong>{proposal.title}</strong>
                <p className="muted">{lead?.companyName} · {proposal.status} · ${proposal.amount.toLocaleString()}</p>
                <p className="hint">In: {proposal.scopeIncluded || "—"} · Out: {proposal.scopeExcluded || "—"}</p>
                <p className="hint">{proposal.paymentTerms}</p>
              </article>
            );
          })}
          <form action={createProposalFormAction} className="stack">
            <label className="field">
              <span>Lead</span>
              <select className="select" name="leadId" required>
                {leads.map((lead) => <option key={lead._id.toString()} value={lead._id.toString()}>{lead.companyName}</option>)}
              </select>
            </label>
            <label className="field"><span>Title</span><input className="input" name="title" required /></label>
            <label className="field"><span>Scope included</span><textarea className="textarea" name="scopeIncluded" rows={2} /></label>
            <label className="field"><span>Scope excluded</span><textarea className="textarea" name="scopeExcluded" rows={2} /></label>
            <label className="field"><span>Assumptions</span><textarea className="textarea" name="assumptions" rows={2} /></label>
            <label className="field"><span>Amount</span><input className="input" name="amount" type="number" min="0" /></label>
            <label className="field"><span>Payment terms</span><input className="input" name="paymentTerms" /></label>
            <label className="field">
              <span>Status</span>
              <select className="select" name="status">
                {PROPOSAL_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <SubmitButton>Save proposal</SubmitButton>
          </form>
        </section>
        <section className="stack">
          <div className="panel">
            <h2>Follow-ups and meetings</h2>
            {followUps.map((item) => (
              <div key={String(item._id)} className="row" style={{ marginBottom: "0.5rem" }}>
                <span>{item.done ? "Done" : "Open"} · {item.title}</span>
                {!item.done ? (
                  <form action={completeFollowUpFormAction}>
                    <input type="hidden" name="id" value={String(item._id)} />
                    <SubmitButton variant="ghost">Complete</SubmitButton>
                  </form>
                ) : null}
              </div>
            ))}
            <form action={createFollowUpFormAction} className="stack">
              <label className="field">
                <span>Lead</span>
                <select className="select" name="leadId">
                  <option value="">General</option>
                  {leads.map((lead) => <option key={lead._id.toString()} value={lead._id.toString()}>{lead.companyName}</option>)}
                </select>
              </label>
              <label className="field"><span>Next action</span><input className="input" name="title" required /></label>
              <label className="field"><span>When</span><input className="input" type="date" name="when" required /></label>
              <label className="field"><span>Notes</span><input className="input" name="notes" /></label>
              <SubmitButton>Schedule</SubmitButton>
            </form>
          </div>
          {user.role === "owner" ? (
            <form action={createSalesTargetFormAction} className="card form-card stack">
              <h2>Sales target</h2>
              <label className="field"><span>Label</span><input className="input" name="label" placeholder="Q4 new business" /></label>
              <label className="field"><span>Year</span><input className="input" name="year" type="number" defaultValue={new Date().getFullYear()} /></label>
              <label className="field"><span>Quarter</span><input className="input" name="quarter" type="number" min="1" max="4" defaultValue={1} /></label>
              <label className="field"><span>Amount</span><input className="input" name="amount" type="number" min="0" required /></label>
              <SubmitButton>Save target</SubmitButton>
            </form>
          ) : null}
        </section>
      </div>
    </div>
  );
}
