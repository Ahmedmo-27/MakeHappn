import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { readMessage } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { createMarketingFormAction } from "@/app/actions/studio-ops";
import { MARKETING_KINDS, MARKETING_KIND_LABELS } from "@/models/StudioOps";

export default function NewMarketingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<div className="page"><PageFallback label="Loading form" /></div>}>
      <NewMarketing searchParams={searchParams} />
    </Suspense>
  );
}

async function NewMarketing({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [, params] = await Promise.all([getCurrentUser(), searchParams]);
  const flash = readMessage(params);

  return (
    <div className="page">
      <Banner error={flash.error} notice={flash.notice} />
      <p className="kicker" style={{ marginBottom: "0.75rem" }}>
        <Link href="/marketing">← Back to marketing</Link>
      </p>
      <header className="page-header">
        <div>
          <p className="kicker">Brand growth</p>
          <h1>Add marketing item</h1>
        </div>
      </header>
      <form action={createMarketingFormAction} className="card form-card stack" style={{ maxWidth: "640px" }}>
        <label className="field">
          <span>Type</span>
          <select className="select" name="kind">
            {MARKETING_KINDS.map((item) => <option key={item} value={item}>{MARKETING_KIND_LABELS[item]}</option>)}
          </select>
        </label>
        <label className="field"><span>Title</span><input className="input" name="title" required /></label>
        <label className="field"><span>Channel</span><input className="input" name="channel" placeholder="Instagram, press, site" /></label>
        <label className="field"><span>Status</span><input className="input" name="status" placeholder="planned, in progress, published" /></label>
        <label className="field"><span>Date</span><input className="input" type="date" name="startsOn" /></label>
        <label className="field"><span>Performance note</span><input className="input" name="metric" placeholder="Reach, leads, press hits" /></label>
        <label className="field"><span>Notes</span><textarea className="textarea" name="notes" rows={3} /></label>
        <SubmitButton>Save</SubmitButton>
      </form>
    </div>
  );
}
