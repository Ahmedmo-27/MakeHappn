import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { readMessage } from "@/lib/format";
import { DATA_OFFLINE, orEmpty } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { createSalesTargetFormAction } from "@/app/actions/studio-ops";
import { listSalesTargets } from "@/services/studio-ops";

export default function SalesTargetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading targets" />}>
      <Targets searchParams={searchParams} />
    </Suspense>
  );
}

async function Targets({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (user.role !== "owner") redirect("/sales");
  const targets = await orEmpty(() => listSalesTargets(), null);
  const flash = readMessage(params);
  const list = targets ?? [];
  const targetTotal = list.reduce((sum, target) => sum + target.amount, 0);

  return (
    <>
      <Banner error={flash.error ?? (targets ? undefined : DATA_OFFLINE)} notice={flash.notice} />
      <section className="panel" style={{ marginBottom: "1.25rem" }}>
        <h2>Current targets</h2>
        <p className="muted">Combined target ${targetTotal.toLocaleString()}</p>
        {list.map((target) => (
          <p key={String(target._id)} className="muted">
            {target.label || `${target.year} Q${target.quarter}`} · ${target.amount.toLocaleString()}
          </p>
        ))}
      </section>
      <form action={createSalesTargetFormAction} className="card form-card stack">
        <h2>Sales target</h2>
        <label className="field"><span>Label</span><input className="input" name="label" placeholder="Q4 new business" /></label>
        <label className="field"><span>Year</span><input className="input" name="year" type="number" defaultValue={new Date().getFullYear()} /></label>
        <label className="field"><span>Quarter</span><input className="input" name="quarter" type="number" min="1" max="4" defaultValue={1} /></label>
        <label className="field"><span>Amount</span><input className="input" name="amount" type="number" min="0" required /></label>
        <SubmitButton>Save target</SubmitButton>
      </form>
    </>
  );
}
