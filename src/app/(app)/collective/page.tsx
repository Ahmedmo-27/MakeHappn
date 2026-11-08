import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { readMessage } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { listCollectiveMembers } from "@/services/collective";
import { createCollectiveMemberFormAction } from "@/app/actions/collective";
import {
  COLLECTIVE_TYPES,
  COLLECTIVE_TYPE_LABELS,
  type CollectiveType,
} from "@/models/CollectiveMember";

export default function CollectivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<div className="page"><PageFallback label="Loading Collective" /></div>}>
      <CollectiveList searchParams={searchParams} />
    </Suspense>
  );
}

async function CollectiveList({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [, params] = await Promise.all([getCurrentUser(), searchParams]);
  const flash = readMessage(params);

  const typeFilter = typeof params.type === "string" ? (params.type as CollectiveType) : undefined;
  const members = await listCollectiveMembers(typeFilter);

  return (
    <div className="page page-wide">
      <Banner error={flash.error} notice={flash.notice} />
      <header className="page-header">
        <div>
          <p className="kicker">Studio Network</p>
          <h1>The Collective</h1>
          <p className="lede">
            MakeHappen&apos;s master directory of artisans, spatial makers, specialized fabricators, venue partners, and technical contractors.
          </p>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="card" style={{ marginBottom: "1.5rem", padding: "0.75rem 1rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <span className="muted" style={{ fontWeight: 600, fontSize: "0.85rem" }}>Filter by Specialty:</span>
          <Link
            href="/collective"
            className={`badge ${!typeFilter ? "badge-active" : ""}`}
            style={{ textDecoration: "none" }}
          >
            All Members ({members.length})
          </Link>
          {COLLECTIVE_TYPES.map((t) => (
            <Link
              key={t}
              href={`/collective?type=${t}`}
              className={`badge ${typeFilter === t ? "badge-active" : ""}`}
              style={{ textDecoration: "none" }}
            >
              {COLLECTIVE_TYPE_LABELS[t]}
            </Link>
          ))}
        </div>
      </div>

      {/* Add Partner Form */}
      <details className="disclosure" style={{ marginBottom: "1.5rem" }}>
        <summary className="btn btn-primary" style={{ cursor: "pointer" }}>
          + Add Collective Partner / Maker
        </summary>
        <div className="card form-card stack" style={{ maxWidth: "720px", marginTop: "1rem", gap: "1.25rem" }}>
          <div className="form-header">
            <h3 className="form-title">New Collective Partner</h3>
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
                <label>Location</label>
                <input name="location" type="text" placeholder="e.g. Cairo / Riyadh" className="input" />
              </div>
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
      </details>

      {/* Grid of Collective Partners */}
      {members.length === 0 ? (
        <div className="empty">
          <p>No collective partners found.</p>
          <p className="hint">Add artisans, suppliers, or specialized contractors to the studio network.</p>
        </div>
      ) : (
        <div className="card-grid">
          {members.map((m) => (
            <div key={m._id.toString()} className="card stack" style={{ gap: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{m.name}</h3>
                <span className="badge">{COLLECTIVE_TYPE_LABELS[m.type]}</span>
              </div>

              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                {m.contactPerson ? `${m.contactPerson} · ` : ""}{m.location || "Regional"}
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", margin: "0.25rem 0" }}>
                {m.specialisms.map((s, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.15rem 0.4rem",
                      borderRadius: "4px",
                      background: "var(--bg-subtle, #f3f4f6)",
                      border: "1px solid var(--border-subtle, #e5e7eb)",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>

              {m.notes ? (
                <p className="hint" style={{ margin: "0.25rem 0", fontSize: "0.8rem" }}>
                  {m.notes}
                </p>
              ) : null}

              <div style={{ marginTop: "auto", paddingTop: "0.5rem", borderTop: "1px solid #eee", fontSize: "0.8rem", color: "var(--muted)" }}>
                Status: <strong style={{ color: "#16a34a" }}>{m.status.toUpperCase()}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
