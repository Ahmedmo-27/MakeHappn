import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Types } from "mongoose";
import { PrintButton } from "@/components/print-button";
import { Wordmark } from "@/components/wordmark";
import { formatCurrency, formatDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Invoice, INVOICE_STATUS_LABELS, type InvoiceStatus } from "@/models/Invoice";
import { getProjectById } from "@/services/projects";

export default async function InvoiceSheetPage({
  params,
}: {
  params: Promise<{ id: string; invoiceId: string }>;
}) {
  await connection();
  const { id, invoiceId } = await params;
  if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(invoiceId)) notFound();

  const [user, project] = await Promise.all([getCurrentUser(), getProjectById(id)]);
  if (!project) notFound();

  const lead = project.projectLeadId as unknown as { _id?: unknown } | null;
  const isLead = lead?._id ? lead._id.toString() === user.id : false;
  if (user.role !== "owner" && !user.isExecutive && !isLead) {
    redirect(`/projects/${id}`);
  }

  await connectDB();
  const invoice = await Invoice.findOne({ _id: invoiceId, projectId: id }).lean();
  if (!invoice) notFound();

  const client = project.clientId as unknown as {
    name?: string;
    brandName?: string;
    contacts?: { name?: string; email?: string; isPrimary?: boolean }[];
    billingAddress?: { street?: string; city?: string; country?: string };
  } | null;
  const clientName = client?.brandName || client?.name || "Client";
  const contact = client?.contacts?.find((c) => c.isPrimary) ?? client?.contacts?.[0];
  const address = [client?.billingAddress?.street, client?.billingAddress?.city, client?.billingAddress?.country]
    .filter(Boolean)
    .join(", ");
  const currency = project.currency || "USD";
  const amount = formatCurrency(invoice.amount, currency);

  return (
    <div className="invoice-sheet">
      <div className="invoice-actions">
        <Link href={`/projects/${id}/commercials`}>← Commercials</Link>
        <PrintButton />
      </div>

      <article className="invoice-paper">
        <header className="invoice-top">
          <Wordmark />
          <div>
            <p className="invoice-kicker">Invoice</p>
            <p className="invoice-number">{invoice.invoiceNumber}</p>
          </div>
        </header>

        <div className="invoice-meta">
          <div>
            <p className="invoice-kicker">Bill to</p>
            <p className="invoice-strong">{clientName}</p>
            {address ? <p>{address}</p> : null}
            {contact?.email ? <p>{contact.email}</p> : null}
          </div>
          <div className="invoice-facts">
            <p><span>Project</span> {project.code}</p>
            <p><span>Issued</span> {formatDate(invoice.createdAt)}</p>
            <p><span>Due</span> {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</p>
            <p><span>Status</span> {INVOICE_STATUS_LABELS[invoice.status as InvoiceStatus]}</p>
          </div>
        </div>

        <table className="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{invoice.milestoneTitle}</td>
              <td>{amount}</td>
            </tr>
          </tbody>
        </table>

        <p className="invoice-total">
          <span>Total</span>
          <strong>{amount}</strong>
        </p>
      </article>
    </div>
  );
}
