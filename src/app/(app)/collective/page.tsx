import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { Sticker } from "@/components/brand/sticker";
import { Banner, PageFallback } from "@/components/banner";
import { DATA_OFFLINE, orEmpty } from "@/lib/db";
import { readMessage } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { listCollectiveMembers } from "@/services/collective";
import { allCollaborations } from "@/services/studio-ops";
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
    <Suspense fallback={<PageFallback label="Loading Collective" />}>
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
  const loaded = await orEmpty(
    () => Promise.all([listCollectiveMembers(typeFilter), allCollaborations()]),
    null,
  );
  const members = loaded?.[0] ?? [];
  const orders = loaded?.[1] ?? [];

  return (
    <>
      <Banner error={flash.error ?? (loaded ? undefined : DATA_OFFLINE)} notice={flash.notice} />

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

      {members.length === 0 ? (
        <div className="empty empty-illu">
          <Sticker name="dog" className="sticker-plate empty-sticker" />
          <div>
            <p>No collective partners found.</p>
            <p className="hint">Add artisans, suppliers, or specialized contractors to the studio network.</p>
            <Link href="/collective/new" className="btn btn-primary" style={{ marginTop: "0.75rem" }}>Add partner</Link>
          </div>
        </div>
      ) : (
        <div className="card-grid">
          {members.map((m) => (
            <Link
              key={m._id.toString()}
              href={`/collective/${m._id.toString()}`}
              className="card stack"
              style={{ gap: "0.5rem", textDecoration: "none", color: "inherit" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{m.name}</h3>
                <span className="badge">{COLLECTIVE_TYPE_LABELS[m.type]}</span>
              </div>

              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                {m.contactPerson ? `${m.contactPerson} · ` : ""}{m.location || "Regional"}
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", margin: "0.25rem 0" }}>
                {m.specialisms.map((s: string, idx: number) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.15rem 0.4rem",
                      borderRadius: "4px",
                      background: "var(--bg-subtle, var(--surface-2))",
                      border: "1px solid var(--border-subtle, var(--line))",
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

              <p className="hint">
                {m.phone ? `${m.phone} · ` : ""}
                {m.rateAmount ? `Rate ${m.rateAmount}/${m.rateUnit || "day"} · ` : ""}
                {m.availability || "Availability not set"}
              </p>
              {orders.filter((order) => String(order.collectiveMemberId) === String(m._id)).slice(0, 2).map((order) => {
                const project = order.projectId as unknown as { code?: string; name?: string } | null;
                return <p key={String(order._id)} className="hint">Worked on {project?.code} · {order.scopeDescription}</p>;
              })}
              <div style={{ marginTop: "auto", paddingTop: "0.5rem", borderTop: "1px solid var(--line)", fontSize: "0.8rem", color: "var(--muted)" }}>
                Status: <strong style={{ color: "var(--good)" }}>{String(m.status).toUpperCase()}</strong>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
