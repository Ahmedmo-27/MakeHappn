import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
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
  const [, params, leads] = await Promise.all([
    getCurrentUser(),
    searchParams,
    listLeads(),
  ]);
  const flash = readMessage(params);

  const totalPipelineValue = leads
    .filter((l) => l.stage !== "lost" && l.stage !== "won")
    .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

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
          <span style={{ fontSize: "0.85rem" }} className="muted">Total In-Flight Pipeline</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent)" }}>
            ${totalPipelineValue.toLocaleString()}
          </div>
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
    </div>
  );
}
