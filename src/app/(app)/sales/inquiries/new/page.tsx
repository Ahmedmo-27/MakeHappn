import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { createInquiryFormAction } from "@/app/actions/inquiries";
import { SubmitButton } from "@/components/submit-button";
import { readMessage } from "@/lib/format";
import { CURRENCIES, INQUIRY_PRODUCTS, INQUIRY_PRODUCT_LABELS, INQUIRY_SCOPES, INQUIRY_SOURCES, INQUIRY_SOURCE_LABELS } from "@/lib/domain";

export default function NewInquiryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading inquiry form" />}>
      <NewInquiryForm searchParams={searchParams} />
    </Suspense>
  );
}

async function NewInquiryForm({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const flash = readMessage(await searchParams);

  return (
    <>
      <Banner error={flash.error} notice={flash.notice} />
      <p className="kicker" style={{ marginBottom: "0.75rem" }}>
        <Link href="/sales/inquiries">← Back to inquiries</Link>
      </p>
      <div className="card form-card stack" style={{ maxWidth: "720px", gap: "1.25rem" }}>
        <div className="form-header">
          <h2 className="form-title">New Inquiry</h2>
          <p className="form-subtitle">
            Log the brief as it came in. Leadership approves or declines it within one working day.
          </p>
        </div>
        <form action={createInquiryFormAction} className="stack" style={{ gap: "1.15rem" }}>
          <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label htmlFor="brandName">Brand Name *</label>
              <input id="brandName" name="brandName" type="text" required maxLength={120} placeholder="e.g. Red Sea Global" className="input" />
            </div>
            <div className="form-group">
              <label htmlFor="projectName">Project Name *</label>
              <input id="projectName" name="projectName" type="text" required maxLength={160} placeholder="e.g. Summer Pop-Up" className="input" />
            </div>
          </div>

          <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label htmlFor="clientName">Client Name *</label>
              <input id="clientName" name="clientName" type="text" required maxLength={120} placeholder="e.g. Fahad Al-Saud" className="input" />
            </div>
            <div className="form-group">
              <label htmlFor="clientContact">Client Contact *</label>
              <input id="clientContact" name="clientContact" type="text" required maxLength={160} placeholder="Email or WhatsApp number" className="input" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="product">Product *</label>
            <select id="product" name="product" required defaultValue="" className="select">
              <option value="" disabled>Select a product</option>
              {INQUIRY_PRODUCTS.map((product) => (
                <option key={product} value={product}>{INQUIRY_PRODUCT_LABELS[product]}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Scope</label>
            <div className="check-list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.6rem" }}>
              {INQUIRY_SCOPES.map((scope) => (
                <label key={scope}>
                  <input type="checkbox" name="scope" value={scope} />
                  {scope}
                </label>
              ))}
            </div>
          </div>

          <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label htmlFor="deliveryDate">Delivery Date</label>
              <input id="deliveryDate" name="deliveryDate" type="date" className="input" />
            </div>
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input id="location" name="location" type="text" maxLength={160} placeholder="e.g. Riyadh" className="input" />
            </div>
          </div>

          <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
            <div className="form-group">
              <label htmlFor="currency">Currency</label>
              <select id="currency" name="currency" defaultValue="USD" className="select">
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="budget">Budget</label>
              <input id="budget" name="budget" type="number" min="0" step="any" placeholder="100000" className="input" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="source">Inquiry Source *</label>
            <select id="source" name="source" required defaultValue="" className="select">
              <option value="" disabled>Select a source</option>
              {INQUIRY_SOURCES.map((source) => (
                <option key={source} value={source}>{INQUIRY_SOURCE_LABELS[source]}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" rows={4} placeholder="Anything the team should know about the brief" className="textarea" />
          </div>

          <div className="form-actions">
            <SubmitButton>Submit New Inquiry</SubmitButton>
            <Link className="btn btn-ghost" href="/sales/inquiries">Cancel</Link>
          </div>
        </form>
      </div>
    </>
  );
}
