import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { ProjectFields } from "@/components/project-fields";
import { SubmitButton } from "@/components/submit-button";
import { readMessage } from "@/lib/format";
import { connectDB } from "@/lib/db";
import { canManageProject } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { Client } from "@/models/Client";
import { User } from "@/models/User";
import { getProjectById } from "@/services/projects";
import { updateProjectFormAction } from "@/app/actions/projects";

export default function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading project details" />}>
      <EditProjectForm params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const idOf = (v: unknown) =>
  v && typeof v === "object" && "_id" in v ? String((v as { _id: unknown })._id) : String(v ?? "");

async function EditProjectForm({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  await connectDB();
  const [{ id }, query, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  const project = await getProjectById(id);
  if (!project) notFound();
  if (!canManageProject(user, project)) redirect(`/projects/${id}/scope`);

  const [clients, users] = await Promise.all([
    Client.find().sort({ name: 1 }).select("name brandName").lean(),
    User.find().sort({ name: 1 }).select("name title").lean(),
  ]);
  const flash = readMessage(query);

  return (
    <div className="stack" style={{ gap: "1rem", maxWidth: "800px" }}>
      <Banner error={flash.error} notice={flash.notice} />
      <form action={updateProjectFormAction} className="card form-card stack" style={{ gap: "1.35rem" }}>
        <input type="hidden" name="projectId" value={id} />
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Edit project details</h2>
        <ProjectFields
          clients={clients}
          users={users}
          defaults={{
            name: project.name,
            clientId: idOf(project.clientId),
            projectLeadId: idOf(project.projectLeadId),
            products: project.products,
            teamUserIds: (project.teamUserIds ?? []).map(idOf),
            startDate: project.startDate,
            deliveryDate: project.deliveryDate,
            currency: project.currency,
            quotedValue: project.quotedValue,
            approvedContractValue: project.approvedContractValue,
            contractedRevisionRounds: project.contractedRevisionRounds,
            brief: project.brief,
            objectives: project.objectives,
            audience: project.audience,
            location: project.location,
          }}
        />
        <div className="form-actions" style={{ marginTop: "0.5rem" }}>
          <SubmitButton>Save changes</SubmitButton>
          <Link className="btn btn-ghost" href={`/projects/${id}/scope`}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
