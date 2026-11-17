"use client";

import { ViewTransition } from "react";

export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="route-enter" exit="route-exit" default="none">
      <div className="route-frame">{children}</div>
    </ViewTransition>
  );
}
