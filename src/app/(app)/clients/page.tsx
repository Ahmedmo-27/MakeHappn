import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageFallback } from "@/components/banner";
import { DATA_OFFLINE, orEmpty } from "@/lib/db";
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
  const [, loaded] = await Promise.all([getCurrentUser(), orEmpty(() => clientAccounts(), null)]);
  const data = loaded ?? { clients: [], projects: [], leads: [] };

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
      {loaded ? null : <p className="lede">{DATA_OFFLINE}</p>}
      <div className="stack">
        {data.clients.map((client) => {
          const projects = data.projects.filter((project) => String(project.clientId) === String(client._id));
          const leads = data.leads.filter(
            (lead) => lead.companyName.toLowerCase() === (client.name ?? "").toLowerCase() || lead.companyName.toLowerCase() === (client.brandName ?? "").toLowerCase(),
          );
          const openLeads = leads.filter((lead) => lead.stage !== "won");
          const value = projects.reduce((sum, project) => sum + (project.approvedContractValue || 0), 0);
          return (
            <Link
              key={String(client._id)}
              href={`/clients/${client._id}`}
              className="card stack"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="row">
                <h2 style={{ margin: 0 }}>{client.brandName || client.name}</h2>
                <span className="badge">{client.status}</span>
              </div>
              <p className="muted">{client.industry || "Client"} · payment terms {client.paymentTermsDays} days · lifetime {formatCurrency(value, "USD")}</p>
              <p className="hint">{projects.length} project{projects.length === 1 ? "" : "s"} · {openLeads.length} open lead{openLeads.length === 1 ? "" : "s"}</p>
            </Link>
          );
        })}
        {data.clients.length === 0 ? <p className="muted">Clients appear when a lead is converted into a project.</p> : null}
      </div>
    </div>
  );
}
