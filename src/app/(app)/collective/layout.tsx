import { ModuleTabs } from "@/components/module-tabs";

const tabs = [
  { href: "/collective", label: "Directory", exact: true },
  { href: "/collective/new", label: "Add partner" },
];

export default function CollectiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page page-wide">
      <header className="page-header">
        <div>
          <p className="kicker">Studio Network</p>
          <h1>The Collective</h1>
          <p className="lede">
            MakeHappen&apos;s master directory of artisans, spatial makers, specialized fabricators, venue partners, and technical contractors.
          </p>
        </div>
      </header>
      <ModuleTabs tabs={tabs} ariaLabel="Collective sections" style={{ marginBottom: "1.5rem" }} />
      {children}
    </div>
  );
}
