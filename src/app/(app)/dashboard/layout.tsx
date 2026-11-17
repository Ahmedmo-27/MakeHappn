import Link from "next/link";
import { connection } from "next/server";
import { ModuleTabs } from "@/components/module-tabs";
import { formatDate } from "@/lib/format";
import { canCreateProjectDirectly } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await getCurrentUser();
  const isExec = user.role === "owner" || !!user.isExecutive;
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const tabs = [
    { href: "/dashboard", label: "Overview", exact: true },
    { href: "/dashboard/business", label: "Business" },
    { href: "/dashboard/projects", label: "Projects" },
    { href: "/dashboard/team", label: "Team" },
    ...(isExec ? [{ href: "/dashboard/finance", label: "Finance" }] : []),
  ];

  return (
    <div className="page page-wide">
      <header className="page-header">
        <div>
          <p className="kicker">Command center · {formatDate(now)}</p>
          <h1>
            {greeting}, <span className="accent-text">{user.name.split(" ")[0]}.</span>
          </h1>
          <p className="lede">Studio perspectives across business, projects, team, and finance.</p>
        </div>
        {canCreateProjectDirectly(user) ? (
          <Link className="btn btn-primary" href="/projects/new">
            New project <span className="arrow" aria-hidden="true">→</span>
          </Link>
        ) : null}
      </header>
      <ModuleTabs tabs={tabs} ariaLabel="Dashboard perspectives" style={{ marginBottom: "1.5rem" }} />
      {children}
    </div>
  );
}
