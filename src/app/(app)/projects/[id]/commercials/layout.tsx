import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { ModuleTabs } from "@/components/module-tabs";
import { canViewFinancials } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { getProjectById } from "@/services/projects";

export default async function ProjectCommercialsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const [user, project] = await Promise.all([getCurrentUser(), getProjectById(id)]);

  if (!project) notFound();
  if (!canViewFinancials(user, project)) {
    redirect(`/projects/${id}`);
  }

  const tabs = [
    { href: `/projects/${id}/commercials`, label: "Overview", exact: true },
    { href: `/projects/${id}/commercials/pos`, label: "POs" },
    { href: `/projects/${id}/commercials/bills`, label: "Bills" },
    { href: `/projects/${id}/commercials/invoices`, label: "Invoices" },
  ];

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <ModuleTabs tabs={tabs} ariaLabel="Commercial sections" style={{ marginBottom: "0.25rem" }} />
      {children}
    </div>
  );
}