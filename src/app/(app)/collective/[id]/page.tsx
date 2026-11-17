import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { DATA_OFFLINE, orEmpty } from "@/lib/db";
import { readMessage } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { listCollectiveMembers } from "@/services/collective";
import { allCollaborations } from "@/services/studio-ops";
import { updateCollectiveFormAction } from "@/app/actions/studio-ops";
import {
  COLLECTIVE_TYPES,
  COLLECTIVE_TYPE_LABELS,
} from "@/models/CollectiveMember";

export default function CollectiveDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading partner" />}>
      <CollectiveDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CollectiveDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const { id } = await params;
  const [, sParams] = await Promise.all([getCurrentUser(), searchParams]);
  const flash = readMessage(sParams);
  const loaded = await orEmpty(
    () => Promise.all([listCollectiveMembers(), allCollaborations()]),
    null,
  );
  const members = loaded?.[0] ?? [];
  const orders = loaded?.[1] ?? [];
  const member = members.find((m) => m._id.toString() === id);
  if (!member) notFound();

  const collaborations = orders.filter((order) => String(order.collectiveMemberId) === String(member._id));

  return (
    <>
      <Banner error={flash.error ?? (loaded ? undefined : DATA_OFFLINE)} notice={flash.notice} />
      <p className="kicker" style={{ marginBottom: "0.75rem" }}>
        <Link href="/collective">← Back to directory</Link>
      </p>
      <div className="split">
        <section className="panel stack">
          <div className="row">
            <h2 style={{ margin: 0 }}>{member.name}</h2>
            <span className="badge">{COLLECTIVE_TYPE_LABELS[member.type]}</span>
          </div>
          <p className="muted">
            {member.contactPerson ? `${member.contactPerson} · ` : ""}
            {member.email ? `${member.email} · ` : ""}
            {member.location || "Regional"}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
            {member.specialisms.map((s: string, idx: number) => (
              <span key={idx} className="badge">{s}</span>
            ))}
          </div>
          {member.notes ? <p className="hint">{member.notes}</p> : null}
          <p className="hint">
            {member.phone ? `${member.phone} · ` : ""}
            {member.rateAmount ? `Rate ${member.rateAmount}/${member.rateUnit || "day"} · ` : ""}
            {member.availability || "Availability not set"}
          </p>
          {member.commercialTerms ? <p className="hint">{member.commercialTerms}</p> : null}
          {member.pastWorkNotes ? <p className="hint">{member.pastWorkNotes}</p> : null}
          <p className="muted">Status: <strong>{String(member.status).toUpperCase()}</strong></p>
          <h3>Collaborations</h3>
          {collaborations.length === 0 ? <p className="muted">No recorded collaborations yet.</p> : null}
          {collaborations.map((order) => {
            const project = order.projectId as unknown as { code?: string; name?: string } | null;
            return <p key={String(order._id)} className="hint">Worked on {project?.code} · {order.scopeDescription}</p>;
          })}
        </section>
        <section className="card form-card">
          <h2>Edit profile</h2>
          <form action={updateCollectiveFormAction} className="stack">
            <input type="hidden" name="id" value={member._id.toString()} />
            <select className="select" name="type" defaultValue={member.type}>
              {COLLECTIVE_TYPES.map((t) => <option key={t} value={t}>{COLLECTIVE_TYPE_LABELS[t]}</option>)}
            </select>
            <select className="select" name="status" defaultValue={member.status}>
              <option value="vetted">Vetted</option>
              <option value="active">Active</option>
              <option value="on_hold">On hold</option>
            </select>
            <input className="input" name="phone" defaultValue={member.phone} placeholder="Phone" />
            <input className="input" name="rateAmount" type="number" defaultValue={member.rateAmount} />
            <input className="input" name="rateUnit" defaultValue={member.rateUnit} />
            <input className="input" name="availability" defaultValue={member.availability} placeholder="Availability" />
            <input className="input" name="commercialTerms" defaultValue={member.commercialTerms} placeholder="Terms" />
            <textarea className="textarea" name="pastWorkNotes" defaultValue={member.pastWorkNotes} rows={2} />
            <SubmitButton>Save profile</SubmitButton>
          </form>
        </section>
      </div>
    </>
  );
}
