import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageFallback } from "@/components/banner";
import { HealthBadge, StageTrack, loadDashboardBundle, money } from "@/components/dashboard/shared";
import { formatDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { STAGE_LABELS } from "@/lib/domain";

export default function DashboardProjectsPage() {
  return (
    <Suspense fallback={<PageFallback label="Loading projects view" />}>
      <ProjectsView />
    </Suspense>
  );
}

async function ProjectsView() {
  await connection();
  const user = await getCurrentUser();
  const { activeProjects } = await loadDashboardBundle(user);

  return (
    <section>
      <div className="section-head">
        <div>
          <span className="section-index">Portfolio</span>
          <h2>Every live project, every gate</h2>
        </div>
        <Link href="/projects" className="btn btn-ghost">Full list <span className="arrow">→</span></Link>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Project</th>
              <th>Client</th>
              <th style={{ minWidth: 180 }}>Progress</th>
              <th>Health</th>
              <th>Value</th>
              <th>Delivery</th>
            </tr>
          </thead>
          <tbody>
            {activeProjects.map((p) => {
              const client = p.clientId as unknown as { name?: string; brandName?: string } | null;
              return (
                <tr key={p._id.toString()}>
                  <td className="mono accent-text">{p.code}</td>
                  <td>
                    <Link href={`/projects/${p._id.toString()}`} className="row-link">{p.name}</Link>
                  </td>
                  <td className="muted">{client?.brandName || client?.name || "Client"}</td>
                  <td>
                    <StageTrack stage={p.stage} />
                    <span className="tiny muted">{STAGE_LABELS[p.stage].number} · {STAGE_LABELS[p.stage].short}</span>
                  </td>
                  <td><HealthBadge health={p.health} /></td>
                  <td className="mono">{money(p.approvedContractValue || p.quotedValue || 0)}</td>
                  <td className="muted">{p.deliveryDate ? formatDate(p.deliveryDate) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
