"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/permissions";
import { roleLabel } from "@/lib/domain";
import { logout } from "@/app/actions/auth";

const links = [
  { href: "/dashboard", label: "Dashboard", ownerOnly: false },
  { href: "/projects", label: "Projects", ownerOnly: false },
  { href: "/sales", label: "Sales & Pipeline", ownerOnly: false },
  { href: "/collective", label: "Collective", ownerOnly: false },
  { href: "/reports", label: "Reports", ownerOnly: false },
  { href: "/people", label: "People", ownerOnly: true },
  { href: "/teams", label: "Lanes & Teams", ownerOnly: true },
];

export function Rail({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  return (
    <aside className="rail">
      <div>
        <p className="brand-kicker">Creative Studio OS</p>
        <Link href="/dashboard" className="brand wordmark">makehappn.</Link>
      </div>
      <nav className="rail-nav">
        {links
          .filter((link) => !link.ownerOnly || user.role === "owner")
          .map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "rail-link active" : "rail-link"}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
      </nav>
      <div className="rail-user">
        <strong>{user.name}</strong>
        <span>{roleLabel(user.role)}</span>
        <form action={logout}>
          <button className="btn btn-rail" type="submit">Sign out</button>
        </form>
      </div>
    </aside>
  );
}
