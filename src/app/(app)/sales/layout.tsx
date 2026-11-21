import { connection } from "next/server";
import { Sticker } from "@/components/brand/sticker";
import { ModuleTabs } from "@/components/module-tabs";

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const tabs = [
    { href: "/sales/inquiries", label: "Inquiries", exact: true },
    { href: "/sales/inquiries/new", label: "New Inquiry" },
  ];

  return (
    <div className="page page-wide">
      <header className="page-header">
        <div>
          <p className="kicker">Studio CRM</p>
          <h1>New Opportunity</h1>
          <p className="lede">
            Log new client inquiries and decide on them within one working day.
          </p>
        </div>
        <Sticker name="crafting-curating" className="sticker-plate header-oval" />
      </header>
      <ModuleTabs tabs={tabs} ariaLabel="Sales sections" style={{ marginBottom: "1.5rem" }} />
      {children}
    </div>
  );
}
