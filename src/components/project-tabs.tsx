"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProjectTabs({
  projectId,
  canViewCommercials,
}: {
  projectId: string;
  canViewCommercials: boolean;
}) {
  const pathname = usePathname();
  const tabs = [
    { href: `/projects/${projectId}`, label: "Overview", exact: true },
    { href: `/projects/${projectId}/scope`, label: "Scope & Brief", exact: false },
    { href: `/projects/${projectId}/board`, label: "Board", exact: false },
    { href: `/projects/${projectId}/deliverables`, label: "Deliverables", exact: false },
    { href: `/projects/${projectId}/changes`, label: "Changes", exact: false },
    { href: `/projects/${projectId}/risks`, label: "Risks & Issues", exact: false },
  ];

  if (canViewCommercials) {
    tabs.push({ href: `/projects/${projectId}/commercials`, label: "Commercials & Costs", exact: false });
  }

  return (
    <nav className="tabs" style={{ marginBottom: "1.5rem" }}>
      {tabs.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={active ? "tab active" : "tab"}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
