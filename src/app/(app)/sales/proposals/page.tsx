import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { readMessage } from "@/lib/format";
import { DATA_OFFLINE, orEmpty } from "@/lib/db";
import { canSeeAllSales } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { listLeads } from "@/services/commercial";
import { createProposalFormAction } from "@/app/actions/studio-ops";
import { listProposals } from "@/services/studio-ops";
import { PROPOSAL_STATUSES } from "@/models/StudioOps";

function leadIdOf(lead: unknown) {
  if (lead && typeof lead === "object" && "_id" in lead) return String((lead as { _id: unknown })._id);
  return lead ? String(lead) : "";
}

export default function SalesProposalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading proposals" />}>
      <Proposals searchParams={searchParams} />
    </Suspense>
  );
}

async function Proposals({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  const seesAll = canSeeAllSales(user);
  const loaded = await orEmpty(async () => {
    const [proposals, leads] = await Promise.all([
      listProposals(),
      listLeads(seesAll ? undefined : { assignedLeadId: user.id }),
    ]);
    return { proposals, leads };
  }, null);
  const proposals = loaded?.proposals ?? [];
  const leads = loaded?.leads ?? [];
  const visibleLeadIds = new Set(leads.map((lead) => lead._id.toString()));
  const visibleProposals = seesAll
    ? proposals
    : proposals.filter((proposal) => visibleLeadIds.has(leadIdOf(proposal.leadId)));
  const flash = readMessage(params);

  return (
    <>
      <Banner error={flash.error ?? (loaded ? undefined : DATA_OFFLINE)} notice={flash.notice} />
      <section className="panel">
        <div className="section-head">
          <h2>Proposals and quotations</h2>
          <Link href="/clients">Client accounts</Link>
        </div>
        {visibleProposals.map((proposal) => {
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
        <form action={createProposalFormAction} className="stack" style={{ marginTop: "1rem" }}>
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
    </>
  );
}
