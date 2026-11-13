import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { formatDate, readMessage } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { createMarketingFormAction } from "@/app/actions/studio-ops";
import { listMarketing } from "@/services/studio-ops";
import { MARKETING_KINDS, MARKETING_KIND_LABELS, type MarketingKind } from "@/models/StudioOps";

export default function MarketingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<div className="page"><PageFallback label="Loading marketing" /></div>}>
      <Marketing searchParams={searchParams} />
    </Suspense>
  );
}

async function Marketing({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [, params] = await Promise.all([getCurrentUser(), searchParams]);
  const flash = readMessage(params);
  const kind = typeof params.kind === "string" && (MARKETING_KINDS as readonly string[]).includes(params.kind)
    ? (params.kind as MarketingKind)
    : undefined;
  const items = await listMarketing(kind);

  return (
    <div className="page page-wide">
      <Banner error={flash.error} notice={flash.notice} />
      <header className="page-header">
        <div>
          <p className="kicker">Brand growth</p>
          <h1>Marketing</h1>
          <p className="lede">Calendar, content, campaigns, case studies, assets, PR, and the digital presence in one pipeline.</p>
        </div>
      </header>
      <div className="card" style={{ marginBottom: "1.5rem", padding: "0.75rem 1rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link href="/marketing" className={`badge ${!kind ? "badge-active" : ""}`}>All</Link>
          {MARKETING_KINDS.map((item) => (
            <Link key={item} href={`/marketing?kind=${item}`} className={`badge ${kind === item ? "badge-active" : ""}`}>
              {MARKETING_KIND_LABELS[item]}
            </Link>
          ))}
        </div>
      </div>
      <details className="disclosure" style={{ marginBottom: "1.5rem" }}>
        <summary className="btn btn-primary">+ Add marketing item</summary>
        <form action={createMarketingFormAction} className="card form-card stack" style={{ marginTop: "1rem" }}>
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
      </details>
      {items.length === 0 ? <p className="muted">Nothing on the calendar yet.</p> : (
        <div className="card-grid">
          {items.map((item) => (
            <article key={String(item._id)} className="card stack">
              <div className="row">
                <h2 style={{ margin: 0 }}>{item.title}</h2>
                <span className="badge">{MARKETING_KIND_LABELS[item.kind]}</span>
              </div>
              <p className="muted">{item.channel || "Studio"} · {item.status}{item.startsOn ? ` · ${formatDate(item.startsOn)}` : ""}</p>
              {item.metric ? <p>{item.metric}</p> : null}
              {item.notes ? <p className="hint">{item.notes}</p> : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
