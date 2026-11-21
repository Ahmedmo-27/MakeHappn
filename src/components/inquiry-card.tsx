import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { INQUIRY_PRODUCT_LABELS, inquiryNeedsAttention, inquiryStatusLabel } from "@/lib/domain";
import type { InquiryRecord } from "@/services/inquiries";

const STATUS_BADGE: Record<InquiryRecord["status"], string> = {
  pending: "badge-review",
  approved: "badge-good",
  declined: "badge-danger",
  converted: "badge-done",
};

export function InquiryCard({ inquiry }: { inquiry: InquiryRecord }) {
  const attention = inquiryNeedsAttention(inquiry);
  const rows: Array<[string, string]> = [
    ["Product", INQUIRY_PRODUCT_LABELS[inquiry.product]],
    ["Delivery date", inquiry.deliveryDate ? formatDate(inquiry.deliveryDate) : "—"],
    ["Budget", inquiry.budget ? formatCurrency(inquiry.budget, inquiry.currency) : "—"],
    ["Location", inquiry.location || "—"],
  ];

  return (
    <Link
      href={`/sales/inquiries/${inquiry._id}`}
      className="card stack"
      style={{
        gap: "0.65rem",
        color: "inherit",
        borderColor: attention ? "var(--danger)" : undefined,
      }}
    >
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <strong style={{ fontSize: "1.05rem" }}>{inquiry.brandName}</strong>
          <div className="muted" style={{ fontSize: "0.9rem" }}>{inquiry.projectName}</div>
        </div>
        <span className={`badge ${attention ? "badge-danger" : STATUS_BADGE[inquiry.status]}`}>
          {inquiryStatusLabel(inquiry)}
        </span>
      </div>
      <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.3rem 0.9rem", margin: 0, fontSize: "0.85rem" }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: "contents" }}>
            <dt className="muted">{label}</dt>
            <dd style={{ margin: 0 }}>{value}</dd>
          </div>
        ))}
      </dl>
    </Link>
  );
}
