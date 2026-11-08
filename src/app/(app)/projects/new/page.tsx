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
import {
  STUDIO_PRODUCT_LABELS,
  CURRENCIES,
  type StudioProduct,
} from "@/lib/domain";

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
        <div className="form-group">
          <label htmlFor="name">Project Name *</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. Red Sea Horizon Pavilion & Brand Identity"
            className="input"
          />
        </div>

        <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-group">
            <label htmlFor="clientId">Client *</label>
            <select id="clientId" name="clientId" required className="select">
              {clientList.map((c) => (
                <option key={c._id.toString()} value={c._id.toString()}>
                  {c.brandName ? `${c.brandName} (${c.name})` : c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="projectLeadId">Project Lead *</label>
            <select id="projectLeadId" name="projectLeadId" defaultValue={currentUser.id} required className="select">
              {users.map((u) => (
                <option key={u._id.toString()} value={u._id.toString()}>
                  {u.name} {u.title ? `(${u.title})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>
            Studio Products * <span className="muted" style={{ fontWeight: "normal" }}>(Select one or more)</span>
          </label>
          <div
            className="check-list"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
              gap: "0.6rem",
            }}
          >
            {(Object.keys(STUDIO_PRODUCT_LABELS) as StudioProduct[]).map((prod) => (
              <label
                key={prod}
              >
                <input
                  type="checkbox"
                  name="products"
                  value={prod}
                  defaultChecked={prod === "turnkey_experience"}
                />
                {STUDIO_PRODUCT_LABELS[prod]}
              </label>
            ))}
          </div>
        </div>

        <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-group">
            <label htmlFor="startDate">Target Start Date</label>
            <input id="startDate" name="startDate" type="date" className="input" />
          </div>
          <div className="form-group">
            <label htmlFor="deliveryDate">Target Delivery Date</label>
            <input id="deliveryDate" name="deliveryDate" type="date" className="input" />
          </div>
        </div>

        <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <div className="form-group">
            <label htmlFor="currency">Currency</label>
            <select id="currency" name="currency" defaultValue="USD" className="select">
              {CURRENCIES.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="quotedValue">Quoted Value</label>
            <input
              id="quotedValue"
              name="quotedValue"
              type="number"
              step="any"
              defaultValue="0"
              placeholder="0.00"
              className="input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="approvedContractValue">Approved Value</label>
            <input
              id="approvedContractValue"
              name="approvedContractValue"
              type="number"
              step="any"
              defaultValue="0"
              placeholder="0.00"
              className="input"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="brief">Brief & Objectives</label>
          <textarea
            id="brief"
            name="brief"
            rows={3}
            placeholder="Key design goals, client requirements, creative vision..."
            className="textarea"
          />
        </div>

        <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-group">
            <label htmlFor="audience">Target Audience</label>
            <input id="audience" name="audience" type="text" placeholder="e.g. VIP guests, design public" className="input" />
          </div>
          <div className="form-group">
            <label htmlFor="location">Location / Venue</label>
            <input id="location" name="location" type="text" placeholder="e.g. Riyadh Cultural District" className="input" />
          </div>
        </div>

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
