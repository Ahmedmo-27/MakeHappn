"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { canViewFinance, canViewPerformance, type SessionUser } from "@/lib/permissions";
import { FUNCTIONAL_ROLE_LABELS, roleLabel } from "@/lib/domain";
import { logout } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";

const links = [
  { href: "/dashboard", label: "Command Center", ownerOnly: false },
  { href: "/projects", label: "Projects", ownerOnly: false },
  { href: "/tasks", label: "Tasks", ownerOnly: false },
  { href: "/sales", label: "Sales & Pipeline", ownerOnly: false },
  { href: "/clients", label: "Clients", ownerOnly: false },
  { href: "/finance", label: "Finance", ownerOnly: false },
  { href: "/marketing", label: "Marketing", ownerOnly: false },
  { href: "/collective", label: "MH Network", ownerOnly: false },
  { href: "/reports", label: "Reports", ownerOnly: false },
  { href: "/people", label: "Team", ownerOnly: true },
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

function identityLabel(user: SessionUser) {
  if (user.title?.trim()) return user.title.trim();
  const functional = user.functionalRoles?.[0];
  if (functional) return FUNCTIONAL_ROLE_LABELS[functional];
  return roleLabel(user.role);
}

export function Rail({ user, showSales }: { user: SessionUser; showSales: boolean }) {
  const pathname = usePathname();
  const visible = links.filter((link) => {
    if (link.href === "/finance") return canViewFinance(user);
    if (link.href === "/reports") return canViewPerformance(user);
    if (link.href === "/sales") return showSales;
    return !link.ownerOnly || user.role === "owner";
  });

  return (
    <aside className="rail">
      <div className="rail-brand">
        <p className="brand-kicker">Studio OS · live</p>
        <Wordmark href="/dashboard" className="brand" />
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
          <span>{identityLabel(user)}</span>
        </div>
        <div className="rail-foot">
          <ThemeToggle />
          <form action={logout}>
            <button className="btn btn-rail" type="submit">Sign out</button>
          </form>
        </div>
      </div>
    </aside>
  );
}
