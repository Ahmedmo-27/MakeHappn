"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/permissions";
import { roleLabel } from "@/lib/domain";
import { logout } from "@/app/actions/auth";

const links = [
  { href: "/dashboard", label: "Command Center", ownerOnly: false },
  { href: "/projects", label: "Projects", ownerOnly: false },
  { href: "/sales", label: "Sales & Pipeline", ownerOnly: false },
  { href: "/collective", label: "Collective", ownerOnly: false },
  { href: "/reports", label: "Reports", ownerOnly: false },
  { href: "/people", label: "People", ownerOnly: true },
  { href: "/teams", label: "Lanes & Teams", ownerOnly: true },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Rail({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const visible = links.filter((link) => !link.ownerOnly || user.role === "owner");

  return (
    <aside className="rail">
      <div className="rail-brand">
        <p className="brand-kicker">Studio OS · live</p>
        <Link href="/dashboard" className="brand wordmark">
          makehappn<span className="dot">.</span>
        </Link>
      </div>

      <nav className="rail-nav" aria-label="Main">
        <p className="rail-section">Navigate</p>
        {visible.map((link, index) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={active ? "rail-link active" : "rail-link"}
              aria-current={active ? "page" : undefined}
            >
              <span className="rail-index">{String(index + 1).padStart(2, "0")}</span>
              {link.label}
              <span className="rail-arrow" aria-hidden="true">→</span>
            </Link>
          );
        })}
      </nav>

      <div className="rail-user">
        <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
        <div className="rail-user-meta">
          <strong>{user.name}</strong>
          <span>{roleLabel(user.role)}</span>
        </div>
        <form action={logout}>
          <button className="btn btn-rail" type="submit">Sign out</button>
        </form>
      </div>
    </aside>
  );
}
