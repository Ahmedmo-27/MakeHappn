"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type ModuleTab = {
  href: string;
  label: string;
  exact?: boolean;
};

export function ModuleTabs({
  tabs,
  ariaLabel = "Section",
  className = "tabs",
  style,
}: {
  tabs: ModuleTab[];
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const pathname = usePathname();

  return (
    <nav className={className} style={style} aria-label={ariaLabel}>
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
