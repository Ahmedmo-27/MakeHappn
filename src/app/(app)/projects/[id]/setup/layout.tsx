import { ModuleTabs } from "@/components/module-tabs";

export default async function ProjectSetupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tabs = [
    { href: `/projects/${id}/setup`, label: "1 · Overview & Scope", exact: true },
    { href: `/projects/${id}/setup/team`, label: "2 · Team" },
    { href: `/projects/${id}/setup/timeline`, label: "3 · Timeline & Phases" },
    { href: `/projects/${id}/setup/deliverables`, label: "4 · Deliverables" },
  ];

  return (
    <div className="stack" style={{ gap: "1.25rem" }}>
      <ModuleTabs tabs={tabs} ariaLabel="Project setup steps" />
      {children}
    </div>
  );
}
