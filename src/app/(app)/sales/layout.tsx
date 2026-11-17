import { connection } from "next/server";
import { Sticker } from "@/components/brand/sticker";
import { ModuleTabs } from "@/components/module-tabs";
import { getCurrentUser } from "@/lib/session";

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await getCurrentUser();
  const tabs = [
    { href: "/sales", label: "Pipeline", exact: true },
    { href: "/sales/proposals", label: "Proposals" },
    { href: "/sales/activities", label: "Activities" },
    ...(user.role === "owner" ? [{ href: "/sales/targets", label: "Targets" }] : []),
  ];

  return (
    <div className="page page-wide">
      <header className="page-header">
        <div>
          <p className="kicker">Studio CRM</p>
          <h1>Sales & Opportunity Pipeline</h1>
          <p className="lede">
            Stages 01–04 commercial progression. Track client discovery, scope proposals, and trigger Stage 04 project confirmation upon agreement.
          </p>
        </div>
        <Sticker name="crafting-curating" className="sticker-plate header-oval" />
      </header>
      <ModuleTabs tabs={tabs} ariaLabel="Sales sections" style={{ marginBottom: "1.5rem" }} />
      {children}
    </div>
  );
}
