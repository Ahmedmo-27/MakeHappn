import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { readMessage } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Client } from "@/models/Client";
import { User } from "@/models/User";
import { createProjectFormAction } from "@/app/actions/projects";
import { ProjectFields } from "@/components/project-fields";

export default function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<div className="page"><PageFallback label="Loading form" /></div>}>
      <NewProjectForm searchParams={searchParams} />
    </Suspense>
  );
}

async function NewProjectForm({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  await connectDB();
  const [currentUser, params, clients, users] = await Promise.all([
    getCurrentUser(),
    searchParams,
    Client.find().sort({ name: 1 }).lean(),
    User.find().sort({ name: 1 }).lean(),
  ]);

  const flash = readMessage(params);

  // If no clients exist yet, seed a default client so the user isn't blocked
  let clientList = clients;
  if (clientList.length === 0) {
    const created = await Client.create({
      name: "MakeHappen Studio Client",
      brandName: "MakeHappen Partner",
      industry: "Experiential & Creative",
      contacts: [{ name: "Studio Contact", email: "client@makehappen.local", isPrimary: true }],
      status: "active",
    });
    clientList = [created.toObject()];
  }

  return (
    <div className="page">
      <Banner error={flash.error} notice={flash.notice} />
      <header className="page-header">
        <div>
          <p className="kicker">Projects</p>
          <h1>Start a new project</h1>
          <p className="lede">
            Configure client, products, project lead, and commercial baseline. Projects are issued a sequential code (e.g. MH-2026-001).
          </p>
        </div>
        <Link className="btn btn-ghost" href="/projects">
          Cancel
        </Link>
      </header>

      <form action={createProjectFormAction} className="card form-card stack" style={{ maxWidth: "800px", gap: "1.35rem" }}>
        <ProjectFields
          clients={clientList}
          users={users}
          defaults={{ projectLeadId: currentUser.id }}
        />

        <div className="form-actions" style={{ marginTop: "0.5rem" }}>
          <SubmitButton>Create Project</SubmitButton>
          <Link className="btn btn-ghost" href="/projects">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
