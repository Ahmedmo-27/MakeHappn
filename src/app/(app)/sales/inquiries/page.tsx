import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { DATA_OFFLINE, orEmpty } from "@/lib/db";
import { formatCurrency, formatDate, formatDateTime, readMessage } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { listInquiries, type InquiryRecord } from "@/services/inquiries";
import {
  INQUIRY_PRODUCT_LABELS,
  inquiryDecisionDue,
  inquiryNeedsAttention,
  inquiryStatusLabel,
} from "@/lib/domain";

const STATUS_BADGE: Record<InquiryRecord["status"], string> = {
  pending: "badge-review",
  approved: "badge-good",
  declined: "badge-danger",
  converted: "badge-done",
};

export default function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading inquiries" />}>
      <Inquiries searchParams={searchParams} />
    </Suspense>
  );
}

async function Inquiries({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  const inquiries = await orEmpty(() => listInquiries(), null);
  const list = inquiries ?? [];
  const flash = readMessage(params);
  const now = new Date();
  const attention = list.filter((inquiry) => inquiryNeedsAttention(inquiry, now));
  const declinedForMe = list.filter(
    (inquiry) => inquiry.status === "declined" && String(inquiry.submittedById) === user.id,
  );

  return (
    <>
      <Banner error={flash.error ?? (inquiries ? undefined : DATA_OFFLINE)} notice={flash.notice} />
      <div className="row" style={{ marginBottom: "1.25rem" }}>
        <div>
          {attention.length > 0 ? (
            <p className="hint" style={{ color: "var(--danger)", margin: 0 }}>
              {attention.length} need{attention.length === 1 ? "s" : ""} your attention: past the one working day decision window
            </p>
          ) : null}
        </div>
        <Link href="/sales/inquiries/new" className="btn btn-primary" style={{ marginLeft: "auto" }}>
          + New Inquiry
        </Link>
      </div>

      {declinedForMe.map((inquiry) => (
        <div key={inquiry._id} className="banner banner-error" role="alert" style={{ marginBottom: "0.75rem" }}>
          <strong>Project declined:</strong> {inquiry.projectName} ({inquiry.brandName}). {inquiry.declineReason}{" "}
          <Link href={`/sales/inquiries/${inquiry._id}`}>View response steps →</Link>
        </div>
      ))}

      {list.length === 0 ? (
        <div className="empty">
          <p>No inquiries yet.</p>
          <p><Link className="btn btn-primary" href="/sales/inquiries/new">Submit the first inquiry</Link></p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Product</th>
                <th>Budget</th>
                <th>Delivery</th>
                <th>Submitted</th>
                <th>Status</th>
                <th aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {list.map((inquiry) => {
                const needsAttention = inquiryNeedsAttention(inquiry, now);
                return (
                  <tr key={inquiry._id}>
                    <td>
                      <Link className="row-link" href={`/sales/inquiries/${inquiry._id}`}>{inquiry.projectName}</Link>
                      <div className="muted" style={{ fontSize: "0.8rem" }}>{inquiry.brandName} · {inquiry.clientName}</div>
                    </td>
                    <td>{INQUIRY_PRODUCT_LABELS[inquiry.product]}</td>
                    <td>{inquiry.budget ? formatCurrency(inquiry.budget, inquiry.currency) : "—"}</td>
                    <td>{inquiry.deliveryDate ? formatDate(inquiry.deliveryDate) : "—"}</td>
                    <td>
                      {formatDateTime(inquiry.createdAt)}
                      <div className="muted" style={{ fontSize: "0.8rem" }}>by {inquiry.submittedByName || "Unknown"}</div>
                    </td>
                    <td>
                      <div className="row" style={{ gap: "0.35rem" }}>
                        <span className={`badge ${needsAttention ? "badge-danger" : STATUS_BADGE[inquiry.status]}`}>
                          {inquiryStatusLabel(inquiry, now)}
                        </span>
                      </div>
                      {inquiry.status === "pending" ? (
                        <div className="muted" style={{ fontSize: "0.78rem", marginTop: "0.25rem" }}>
                          Decide by {formatDateTime(inquiryDecisionDue(inquiry.createdAt))}
                        </div>
                      ) : null}
                      {inquiry.callScheduledAt && inquiry.status === "pending" ? (
                        <div className="muted" style={{ fontSize: "0.78rem" }}>
                          Call {formatDateTime(inquiry.callScheduledAt)}
                        </div>
                      ) : null}
                    </td>
                    <td><Link className="btn btn-ghost" href={`/sales/inquiries/${inquiry._id}`}>Open</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
