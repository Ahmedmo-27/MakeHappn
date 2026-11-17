"use client";

import { ModuleTabs } from "@/components/module-tabs";

export function ProjectTabs({
  projectId,
  canViewCommercials,
}: {
  projectId: string;
  canViewCommercials: boolean;
}) {
  const tabs = [
    { href: `/projects/${projectId}`, label: "Overview", exact: true },
    { href: `/projects/${projectId}/scope`, label: "Scope & Brief" },
    { href: `/projects/${projectId}/board`, label: "Board" },
    { href: `/projects/${projectId}/production`, label: "Production" },
    { href: `/projects/${projectId}/deliverables`, label: "Deliverables" },
    { href: `/projects/${projectId}/changes`, label: "Changes" },
    { href: `/projects/${projectId}/risks`, label: "Risks & Issues" },
    { href: `/projects/${projectId}/closeout`, label: "Closeout" },
  ];

  if (canViewCommercials) {
    tabs.push({ href: `/projects/${projectId}/commercials`, label: "Commercials & Costs" });
  }

  return <ModuleTabs tabs={tabs} ariaLabel="Project sections" style={{ marginBottom: "1.5rem" }} />;
}
