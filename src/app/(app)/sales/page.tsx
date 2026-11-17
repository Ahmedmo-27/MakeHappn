import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { AutoSubmitSelect } from "@/components/auto-submit-select";
import { SubmitButton } from "@/components/submit-button";
import { readMessage } from "@/lib/format";
import { DATA_OFFLINE, orEmpty } from "@/lib/db";
import { canSeeAllSales } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { listLeads } from "@/services/commercial";
import { listDirectory } from "@/services/org";
import { listProposals } from "@/services/studio-ops";
import {
  convertLeadFormAction,
  updateLeadOwnerFormAction,
  updateLeadStageFormAction,
} from "@/app/actions/commercial";
import { STUDIO_PRODUCT_LABELS } from "@/lib/domain";
import { LEAD_STAGES, LEAD_STAGE_LABELS } from "@/models/Lead";

function leadIdOf(lead: unknown) {
  if (lead && typeof lead === "object" && "_id" in lead) return String((lead as { _id: unknown })._id);
  return lead ? String(lead) : "";
}

function ownerName(owner: unknown) {
  if (owner && typeof owner === "object" && "name" in owner && typeof (owner as { name: unknown }).name === "string") {
    return (owner as { name: string }).name;
  }
  return "Unassigned";
}

export default function SalesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading sales pipeline" />}>
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
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  const seesAll = canSeeAllSales(user);
  const loaded = await orEmpty(async () => {
    const [proposals, leads, directory] = await Promise.all([
      listProposals(),
      listLeads(seesAll ? undefined : { assignedLeadId: user.id }),
      listDirectory(),
    ]);
    return { proposals, leads, people: directory.users };
  }, null);
  const proposals = loaded?.proposals ?? [];
  const leads = loaded?.leads ?? [];
  const people = loaded?.people ?? [];
  const visibleLeadIds = new Set(leads.map((lead) => lead._id.toString()));
  const visibleProposals = seesAll
    ? proposals
    : proposals.filter((proposal) => visibleLeadIds.has(leadIdOf(proposal.leadId)));
  const approvedLeadIds = new Set(
    visibleProposals.filter((proposal) => proposal.status === "approved").map((proposal) => leadIdOf(proposal.leadId)),
  );
  const movableStages = LEAD_STAGES.filter((stage) => stage !== "won");
  const flash = readMessage(params);

  const openLeads = leads.filter((l) => l.stage !== "lost" && l.stage !== "won");
  const totalPipelineValue = openLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  const weights: Record<string, number> = { inquiry: 0.2, discovery: 0.4, proposal: 0.6 };
  const forecast = openLeads.reduce((sum, lead) => sum + (lead.estimatedValue || 0) * (weights[lead.stage] ?? 0), 0);

  const columns = LEAD_STAGES.filter((s) => s !== "lost").map((stage) => ({
    stage,
    title: LEAD_STAGE_LABELS[stage],
    leads: leads.filter((l) => l.stage === stage),
  }));

  return (
    <>
      <Banner error={flash.error ?? (loaded ? undefined : DATA_OFFLINE)} notice={flash.notice} />
      <div className="row" style={{ marginBottom: "1.25rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <span style={{ fontSize: "0.85rem" }} className="muted">Total In-Flight Pipeline</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent)" }}>
            ${totalPipelineValue.toLocaleString()}
          </div>
          <p className="hint">Forecast ${Math.round(forecast).toLocaleString()}</p>
        </div>
        <Link href="/sales/leads/new" className="btn btn-primary" style={{ marginLeft: "auto" }}>
          + Add Client Inquiry / Lead
        </Link>
      </div>

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
                    <p className="muted" style={{ fontSize: "0.8rem", margin: "0.15rem 0" }}>
                      Owner: {ownerName(lead.assignedLeadId)}
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

                    {lead.stage !== "won" ? (
                      <div className="stack" style={{ marginTop: "0.5rem", gap: "0.4rem", borderTop: "1px solid var(--line)", paddingTop: "0.5rem" }}>
                        <form action={updateLeadStageFormAction}>
                          <input type="hidden" name="leadId" value={lead._id.toString()} />
                          <AutoSubmitSelect name="stage" defaultValue={lead.stage} className="select" style={{ width: "100%", fontSize: "0.8rem" }}>
                            {movableStages.map((stage) => (
                              <option key={stage} value={stage}>{LEAD_STAGE_LABELS[stage]}</option>
                            ))}
                          </AutoSubmitSelect>
                        </form>
                        <form action={updateLeadOwnerFormAction}>
                          <input type="hidden" name="leadId" value={lead._id.toString()} />
                          <AutoSubmitSelect name="assignedLeadId" defaultValue={leadIdOf(lead.assignedLeadId)} className="select" style={{ width: "100%", fontSize: "0.8rem" }}>
                            {people.map((person) => (
                              <option key={String(person._id)} value={String(person._id)}>{person.name}</option>
                            ))}
                          </AutoSubmitSelect>
                        </form>
                      </div>
                    ) : null}

                    {lead.stage === "proposal" && approvedLeadIds.has(lead._id.toString()) ? (
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
    </>
  );
}
