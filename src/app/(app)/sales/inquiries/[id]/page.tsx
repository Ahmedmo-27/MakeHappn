import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { DATA_OFFLINE, orEmpty } from "@/lib/db";
import { formatCurrency, formatDate, formatDateTime, readMessage } from "@/lib/format";
import { canSeeAllSales } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { getInquiry } from "@/services/inquiries";
import { listDirectory } from "@/services/org";
import {
  assignInquiryLeadsFormAction,
  convertInquiryFormAction,
  declineInquiryFormAction,
  scheduleInquiryCallFormAction,
  startProjectPlanningFormAction,
} from "@/app/actions/inquiries";
import { inquiryApology } from "@/lib/inquiry-apology";
import {
  INQUIRY_PRODUCT_LABELS,
  INQUIRY_SOURCE_LABELS,
  inquiryDecisionDue,
  inquiryNeedsAttention,
  inquiryStatusLabel,
} from "@/lib/domain";

type People = Array<{ _id: unknown; name: string; title?: string }>;

function toDateTimeInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function InquiryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading inquiry" />}>
      <InquiryDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function InquiryDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [{ id }, query, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  const loaded = await orEmpty(async () => {
    const [inquiry, directory] = await Promise.all([getInquiry(id), canSeeAllSales(user) ? listDirectory() : null]);
    return { inquiry, people: (directory?.users ?? []) as People };
  }, null);
  if (loaded && !loaded.inquiry) notFound();

  const flash = readMessage(query);
  if (!loaded) return <Banner error={flash.error ?? DATA_OFFLINE} />;

  const { inquiry, people } = loaded;
  const decider = canSeeAllSales(user);
  const needsAttention = inquiryNeedsAttention(inquiry);
  const leadIds = new Set(inquiry.projectLeadIds.map((lead) => String(lead._id)));
  const apology = inquiryApology(inquiry);

  const details: Array<[string, React.ReactNode]> = [
    ["Brand", inquiry.brandName],
    ["Project", inquiry.projectName],
    ["Client", inquiry.clientName],
    ["Contact", inquiry.clientContact],
    ["Product", INQUIRY_PRODUCT_LABELS[inquiry.product]],
    ["Scope", inquiry.scope.length ? inquiry.scope.join(", ") : "—"],
    ["Delivery date", inquiry.deliveryDate ? formatDate(inquiry.deliveryDate) : "—"],
    ["Budget", inquiry.budget ? formatCurrency(inquiry.budget, inquiry.currency) : "—"],
    ["Location", inquiry.location || "—"],
    ["Submitted", `${formatDateTime(inquiry.createdAt)} by ${inquiry.submittedByName || "Unknown"}`],
    ["Source", INQUIRY_SOURCE_LABELS[inquiry.source] ?? "—"],
    ["Notes", inquiry.notes || "—"],
  ];

  const leadPicker = (
    <div className="check-list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.6rem" }}>
      {people.map((person) => (
        <label key={String(person._id)}>
          <input type="checkbox" name="projectLeadIds" value={String(person._id)} defaultChecked={leadIds.has(String(person._id))} />
          {person.name}{person.title ? ` (${person.title})` : ""}
        </label>
      ))}
    </div>
  );

  return (
    <>
      <Banner error={flash.error} notice={flash.notice} />
      <p className="kicker" style={{ marginBottom: "0.75rem" }}>
        <Link href="/sales/inquiries">← Back to inquiries</Link>
      </p>

      <div className="stack" style={{ maxWidth: "820px", gap: "1.25rem" }}>
        <div className="card stack" style={{ gap: "1rem" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 style={{ margin: 0 }}>{inquiry.projectName}</h2>
            <div className="row" style={{ gap: "0.35rem" }}>
              <span className={`badge ${needsAttention || inquiry.status === "declined" ? "badge-danger" : inquiry.status === "pending" ? "badge-review" : "badge-good"}`}>
                {inquiryStatusLabel(inquiry)}
              </span>
            </div>
          </div>
          {inquiry.status === "pending" ? (
            <p className="hint" style={needsAttention ? { color: "var(--danger)" } : undefined}>
              Decision due {formatDateTime(inquiryDecisionDue(inquiry.createdAt))}
              {needsAttention ? ": this inquiry is overdue." : "."}
            </p>
          ) : null}
          <dl style={{ display: "grid", gridTemplateColumns: "10rem 1fr", gap: "0.5rem 1rem", margin: 0 }}>
            {details.map(([label, value]) => (
              <div key={label} style={{ display: "contents" }}>
                <dt className="muted">{label}</dt>
                <dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>{value}</dd>
              </div>
            ))}
          </dl>
          {inquiry.callScheduledAt ? (
            <p className="hint">
              Call scheduled for {formatDateTime(inquiry.callScheduledAt)}
              {inquiry.callNotes ? `: ${inquiry.callNotes}` : ""}
            </p>
          ) : null}
        </div>

        {decider && inquiry.status === "pending" ? (
          <>
            <form action={scheduleInquiryCallFormAction} className="card stack" style={{ gap: "0.85rem" }}>
              <h3 style={{ margin: 0 }}>Schedule Call</h3>
              <input type="hidden" name="inquiryId" value={inquiry._id} />
              <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
                <div className="form-group">
                  <label htmlFor="callAt">Date and time</label>
                  <input id="callAt" name="callAt" type="datetime-local" required defaultValue={toDateTimeInput(inquiry.callScheduledAt)} className="input" />
                </div>
                <div className="form-group">
                  <label htmlFor="callNotes">Call notes</label>
                  <input id="callNotes" name="callNotes" type="text" defaultValue={inquiry.callNotes} placeholder="Agenda or who joins" className="input" />
                </div>
              </div>
              <div className="form-actions">
                <SubmitButton variant="ghost">{inquiry.callScheduledAt ? "Reschedule on Google Meet" : "Schedule on Google Meet"}</SubmitButton>
              </div>
              <p className="hint">Saves the call time, then opens Google Calendar to finish the invite with a Meet link.</p>
            </form>

            <form action={startProjectPlanningFormAction} className="card stack" style={{ gap: "0.85rem" }}>
              <h3 style={{ margin: 0 }}>
                Approved <span style={{ color: "var(--muted)", fontWeight: 400 }}>- Assign Project Lead</span>
              </h3>
              <input type="hidden" name="inquiryId" value={inquiry._id} />
              {leadPicker}
              <div className="form-actions">
                <SubmitButton variant="success">Start Project Planning</SubmitButton>
              </div>
            </form>

            <form action={declineInquiryFormAction} className="card stack" style={{ gap: "0.85rem" }}>
              <h3 style={{ margin: 0 }}>Declined</h3>
              <input type="hidden" name="inquiryId" value={inquiry._id} />
              <div className="form-group">
                <label htmlFor="reason">Reason *</label>
                <textarea id="reason" name="reason" rows={3} required placeholder="The submitter is notified with this explanation" className="textarea" />
              </div>
              <div className="form-actions">
                <SubmitButton variant="danger">Send apology to the client</SubmitButton>
              </div>
            </form>
          </>
        ) : null}

        {inquiry.status === "approved" ? (
          <div className="card stack" style={{ gap: "0.85rem" }}>
            <h3 style={{ margin: 0 }}>Project leads</h3>
            <p className="hint">{inquiry.projectLeadIds.map((lead) => lead.name).join(", ")}</p>
            {decider ? (
              <>
                <form action={assignInquiryLeadsFormAction} className="stack" style={{ gap: "0.85rem" }}>
                  <input type="hidden" name="inquiryId" value={inquiry._id} />
                  {leadPicker}
                  <div className="form-actions">
                    <SubmitButton variant="ghost">Update Project Leads</SubmitButton>
                  </div>
                </form>
                <form action={convertInquiryFormAction}>
                  <input type="hidden" name="inquiryId" value={inquiry._id} />
                  <SubmitButton variant="success">Start Project Planning</SubmitButton>
                </form>
              </>
            ) : null}
          </div>
        ) : null}

        {inquiry.status === "converted" && inquiry.convertedProjectId ? (
          <div className="card">
            <Link href={`/projects/${inquiry.convertedProjectId._id}`} style={{ fontWeight: 600, color: "var(--good)" }}>
              ✓ Project {inquiry.convertedProjectId.code} →
            </Link>
          </div>
        ) : null}

        {inquiry.status === "declined" ? (
          <div className="card stack" style={{ gap: "0.85rem" }}>
            <h3 style={{ margin: 0, color: "var(--danger)" }}>Declined</h3>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{inquiry.declineReason}</p>
            <h4 style={{ margin: 0 }}>Apology to the client by {apology.channel === "email" ? "email" : "WhatsApp"}</h4>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{apology.body}</pre>
            {apology.href ? (
              <div className="form-actions">
                <a className="btn btn-danger" href={apology.href} target="_blank" rel="noreferrer">
                  Send apology to the client
                </a>
              </div>
            ) : (
              <p className="hint">No usable contact on file. Reach the client directly.</p>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}
