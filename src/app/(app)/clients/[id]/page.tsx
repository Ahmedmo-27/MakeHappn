import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageFallback } from "@/components/banner";
import { DATA_OFFLINE, orEmpty } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { clientAccounts } from "@/services/studio-ops";

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="page"><PageFallback label="Loading client" /></div>}>
      <ClientDetail params={params} />
    </Suspense>
  );
}

async function ClientDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const [, loaded] = await Promise.all([getCurrentUser(), orEmpty(() => clientAccounts(), null)]);
  const data = loaded ?? { clients: [], projects: [], leads: [] };
  const client = data.clients.find((item) => String(item._id) === id);
  if (!client) notFound();

  const projects = data.projects.filter((project) => String(project.clientId) === String(client._id));
  const leads = data.leads.filter(
    (lead) => lead.companyName.toLowerCase() === (client.name ?? "").toLowerCase() || lead.companyName.toLowerCase() === (client.brandName ?? "").toLowerCase(),
  );
  const value = projects.reduce((sum, project) => sum + (project.approvedContractValue || 0), 0);

  return (
    <div className="page">
      {!loaded ? <p className="lede">{DATA_OFFLINE}</p> : null}
      <p className="kicker" style={{ marginBottom: "0.75rem" }}>
        <Link href="/clients">← All clients</Link>
      </p>
      <header className="page-header">
        <div>
          <p className="kicker">Account</p>
          <h1>{client.brandName || client.name}</h1>
          <p className="lede">{client.industry || "Client"} · payment terms {client.paymentTermsDays} days · lifetime {formatCurrency(value, "USD")}</p>
        </div>
        <Link className="btn btn-primary" href="/sales">Open pipeline</Link>
      </header>

      <div className="split">
        <section className="panel">
          <h2>Contacts</h2>
          <p className="hint">{client.contacts.map((contact) => `${contact.name} <${contact.email}>`).join(" · ") || "No contacts yet"}</p>
          <p className="muted">Status: {client.status}</p>
        </section>
        <section className="panel">
          <h2>Projects</h2>
          {projects.length === 0 ? <p className="muted">No projects yet.</p> : null}
          {projects.map((project) => (
            <p key={String(project._id)}>
              <Link href={`/projects/${project._id}`}>{project.code} · {project.name}</Link>
              <span className="muted"> · {project.status}</span>
            </p>
          ))}
        </section>
      </div>

      <section className="panel" style={{ marginTop: "1.25rem" }}>
        <h2>Open leads</h2>
        {leads.filter((lead) => lead.stage !== "won").length === 0 ? (
          <p className="muted">No open leads for this account.</p>
        ) : (
          leads.filter((lead) => lead.stage !== "won").map((lead) => (
            <p key={String(lead._id)} className="muted">
              {lead.stage} · {formatCurrency(lead.estimatedValue, "USD")} · <Link href="/sales">View in pipeline</Link>
            </p>
          ))
        )}
      </section>
    </div>
  );
}
