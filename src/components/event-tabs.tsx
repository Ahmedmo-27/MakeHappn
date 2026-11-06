"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function EventTabs({ eventId, showPerformance }: { eventId: string; showPerformance: boolean }) {
  const pathname = usePathname();
  const tabs = [
    { href: `/events/${eventId}/backlog`, label: "Backlog" },
    { href: `/events/${eventId}/board`, label: "Board" },
  ];
  if (showPerformance) tabs.push({ href: `/events/${eventId}/performance`, label: "Performance" });

  return (
    <nav className="tabs">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link key={tab.href} href={tab.href} className={active ? "tab active" : "tab"} aria-current={active ? "page" : undefined}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
