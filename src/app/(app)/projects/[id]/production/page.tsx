import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { getCurrentUser } from "@/lib/session";
import { getProjectById } from "@/services/projects";
import { listProduction } from "@/services/studio-ops";
import { createProductionFormAction } from "@/app/actions/studio-ops";

export default function ProjectProductionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading production" />}>
      <ProjectProduction params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ProjectProduction({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const { id } = await params;
  const resolvedSearchParams = searchParams
    ? ((await searchParams) as Record<string, string | string[] | undefined>)
    : ({} as Record<string, string | string[] | undefined>);

  const [user, project, production] = await Promise.all([
    getCurrentUser(),
    getProjectById(id),
    listProduction(id),
  ]);

  if (!project) notFound();

  const notice = typeof resolvedSearchParams.notice === "string" ? resolvedSearchParams.notice : undefined;
  const error = typeof resolvedSearchParams.error === "string" ? resolvedSearchParams.error : undefined;

  const lead = project.projectLeadId as unknown as { _id?: unknown; name?: string; title?: string } | null;
  const isLeadOrOwner = user.role === "owner" || (lead?._id ? lead._id.toString() === user.id : false);

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <Banner error={error} notice={notice} />

      <section className="card stack">
        <h2 style={{ margin: 0 }}>Production and installation</h2>
        {production.length === 0 ? (
          <p className="muted">No fabrication, installation, or handover updates yet.</p>
        ) : (
          production.map((item) => (
            <p key={String(item._id)} className="muted">
              {item.area} · {item.percent}% · {item.note}
            </p>
          ))
        )}
        {isLeadOrOwner ? (
          <form action={createProductionFormAction} className="stack">
            <input type="hidden" name="projectId" value={id} />
            <label className="field">
              <span>Area</span>
              <select className="select" name="area">
                <option value="fabrication">Fabrication</option>
                <option value="installation">Installation</option>
                <option value="handover">Handover</option>
              </select>
            </label>
            <label className="field">
              <span>Percent complete</span>
              <input className="input" name="percent" type="number" min="0" max="100" required />
            </label>
            <label className="field">
              <span>Note</span>
              <input className="input" name="note" />
            </label>
            <SubmitButton>Save progress</SubmitButton>
          </form>
        ) : null}
      </section>
    </div>
  );
}