import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { readMessage } from "@/lib/format";
import { DATA_OFFLINE, orEmpty } from "@/lib/db";
import { canSeeAllSales } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { listLeads } from "@/services/commercial";
import { completeFollowUpFormAction, createFollowUpFormAction } from "@/app/actions/studio-ops";
import { listFollowUps } from "@/services/studio-ops";

function leadIdOf(lead: unknown) {
  if (lead && typeof lead === "object" && "_id" in lead) return String((lead as { _id: unknown })._id);
  return lead ? String(lead) : "";
}

export default function SalesActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading activities" />}>
      <Activities searchParams={searchParams} />
    </Suspense>
  );
}

async function Activities({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  const seesAll = canSeeAllSales(user);
  const loaded = await orEmpty(async () => {
    const [followUps, leads] = await Promise.all([
      listFollowUps(),
      listLeads(seesAll ? undefined : { assignedLeadId: user.id }),
    ]);
    return { followUps, leads };
  }, null);
  const followUps = loaded?.followUps ?? [];
  const leads = loaded?.leads ?? [];
  const visibleLeadIds = new Set(leads.map((lead) => lead._id.toString()));
  const visibleFollowUps = seesAll
    ? followUps
    : followUps.filter((item) => !item.leadId || visibleLeadIds.has(leadIdOf(item.leadId)));
  const flash = readMessage(params);

  return (
    <>
      <Banner error={flash.error ?? (loaded ? undefined : DATA_OFFLINE)} notice={flash.notice} />
      <section className="panel">
        <h2>Follow-ups and meetings</h2>
        {visibleFollowUps.map((item) => (
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
        <form action={createFollowUpFormAction} className="stack" style={{ marginTop: "1rem" }}>
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
      </section>
    </>
  );
}
