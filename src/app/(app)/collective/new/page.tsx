import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { readMessage } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { createCollectiveMemberFormAction } from "@/app/actions/collective";
import {
  COLLECTIVE_TYPES,
  COLLECTIVE_TYPE_LABELS,
} from "@/models/CollectiveMember";

export default function NewCollectivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading form" />}>
      <NewCollective searchParams={searchParams} />
    </Suspense>
  );
}

async function NewCollective({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [, params] = await Promise.all([getCurrentUser(), searchParams]);
  const flash = readMessage(params);

  return (
    <>
      <Banner error={flash.error} notice={flash.notice} />
      <p className="kicker" style={{ marginBottom: "0.75rem" }}>
        <Link href="/collective">← Back to directory</Link>
      </p>
      <div className="card form-card stack" style={{ maxWidth: "720px", gap: "1.25rem" }}>
        <div className="form-header">
          <h2 className="form-title">New Collective Partner</h2>
          <p className="form-subtitle">Register a specialist fabricator, maker atelier, or venue to the studio network.</p>
        </div>
        <form action={createCollectiveMemberFormAction} className="stack" style={{ gap: "1.15rem" }}>
          <div className="form-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Company / Artisan Name *</label>
              <input name="name" type="text" required placeholder="e.g. Damascus Woodcraft Atelier" className="input" />
            </div>
            <div className="form-group">
              <label>Partner Type *</label>
              <select name="type" required className="select">
                {COLLECTIVE_TYPES.map((t) => (
                  <option key={t} value={t}>{COLLECTIVE_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Specialisms (comma separated)</label>
            <input name="specialismInput" type="text" placeholder="e.g. Kinetic Lighting, Heavy Timber, CNC Metalwork" className="input" />
          </div>

          <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Contact Person</label>
              <input name="contactPerson" type="text" placeholder="e.g. Tariq Mansour" className="input" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" placeholder="tariq@workshop.local" className="input" />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input name="phone" type="text" className="input" />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input name="location" type="text" placeholder="e.g. Cairo / Riyadh" className="input" />
            </div>
          </div>
          <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Rate</label>
              <input name="rateAmount" type="number" min="0" className="input" />
            </div>
            <div className="form-group">
              <label>Rate unit</label>
              <input name="rateUnit" type="text" placeholder="day" className="input" />
            </div>
            <div className="form-group">
              <label>Availability</label>
              <input name="availability" type="text" placeholder="Available from May" className="input" />
            </div>
          </div>
          <div className="form-group">
            <label>Commercial terms</label>
            <input name="commercialTerms" type="text" className="input" />
          </div>
          <div className="form-group">
            <label>Past collaborations</label>
            <textarea name="pastWorkNotes" rows={2} className="textarea" />
          </div>

          <div className="form-group">
            <label>Vetting Notes & Capabilities</label>
            <textarea name="notes" rows={3} placeholder="Past project performance, workshop capacity, equipment..." className="textarea" />
          </div>

          <div className="form-actions">
            <SubmitButton>Add to Collective</SubmitButton>
          </div>
        </form>
      </div>
    </>
  );
}
