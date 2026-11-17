import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { readMessage } from "@/lib/format";
import { DATA_OFFLINE, orEmpty } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { listDirectory } from "@/services/org";
import { createLeadFormAction } from "@/app/actions/commercial";
import { CURRENCIES, STUDIO_PRODUCT_LABELS, type StudioProduct } from "@/lib/domain";

export default function NewLeadPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading lead form" />}>
      <NewLeadForm searchParams={searchParams} />
    </Suspense>
  );
}

async function NewLeadForm({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [user, params, directory] = await Promise.all([
    getCurrentUser(),
    searchParams,
    orEmpty(() => listDirectory(), null),
  ]);
  const flash = readMessage(params);
  const people = directory?.users ?? [];

  return (
    <>
      <Banner error={flash.error ?? (directory ? undefined : DATA_OFFLINE)} notice={flash.notice} />
      <p className="kicker" style={{ marginBottom: "0.75rem" }}>
        <Link href="/sales">← Back to pipeline</Link>
      </p>
      <div className="card form-card stack" style={{ maxWidth: "720px", gap: "1.25rem" }}>
        <div className="form-header">
          <h2 className="form-title">New Client Opportunity</h2>
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
            <label>Lead owner</label>
            <select name="assignedLeadId" defaultValue={user.id} className="select" required>
              {people.map((person) => (
                <option key={String(person._id)} value={String(person._id)}>
                  {person.name}{person.title ? ` (${person.title})` : ""}
                </option>
              ))}
            </select>
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
    </>
  );
}
