import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageFallback } from "@/components/banner";
import { formatCurrency } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { clientAccounts } from "@/services/studio-ops";

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="page"><PageFallback label="Loading clients" /></div>}>
      <Clients />
    </Suspense>
  );
}

async function Clients() {
  await connection();
  const [, data] = await Promise.all([getCurrentUser(), clientAccounts()]);

  return (
    <div className="page page-wide">
      <header className="page-header">
        <div>
          <p className="kicker">Accounts</p>
          <h1>Clients</h1>
          <p className="lede">Every account, the projects already delivered, and the opportunities still in the pipeline.</p>
        </div>
        <Link className="btn btn-primary" href="/sales">Open pipeline</Link>
      </header>
      <div className="stack">
        {data.clients.map((client) => {
          const projects = data.projects.filter((project) => String(project.clientId) === String(client._id));
          const leads = data.leads.filter(
            (lead) => lead.companyName.toLowerCase() === client.name.toLowerCase() || lead.companyName.toLowerCase() === (client.brandName ?? "").toLowerCase(),
          );
          const value = projects.reduce((sum, project) => sum + (project.approvedContractValue || 0), 0);
          return (
            <article key={String(client._id)} className="card stack">
              <div className="row">
                <h2 style={{ margin: 0 }}>{client.brandName || client.name}</h2>
                <span className="badge">{client.status}</span>
              </div>
              <p className="muted">{client.industry || "Client"} · payment terms {client.paymentTermsDays} days · lifetime {formatCurrency(value, "USD")}</p>
              <p className="hint">{client.contacts.map((contact) => `${contact.name} <${contact.email}>`).join(" · ") || "No contacts yet"}</p>
              {projects.map((project) => (
                <Link key={String(project._id)} href={`/projects/${project._id}`}>{project.code} · {project.name} · {project.status}</Link>
              ))}
              {leads.filter((lead) => lead.stage !== "won").map((lead) => (
                <p key={String(lead._id)} className="muted">Open lead · {lead.stage} · {formatCurrency(lead.estimatedValue, "USD")}</p>
              ))}
            </article>
          );
        })}
        {data.clients.length === 0 ? <p className="muted">Clients appear when a lead is converted into a project.</p> : null}
      </div>
    </div>
  );
}
