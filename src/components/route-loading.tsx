import { ViewTransition } from "react";
import { Wordmark } from "@/components/wordmark";

type RouteLoadingProps = {
  label?: string;
  /** `panel` fills the content column; `inline` sits inside an existing page. */
  variant?: "panel" | "inline";
};

export function RouteLoading({
  label = "Loading",
  variant = "panel",
}: RouteLoadingProps) {
  return (
    <ViewTransition exit="route-exit" default="none">
      <div
        className={variant === "panel" ? "route-loading route-loading-panel" : "route-loading"}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="route-loading-mark">
          <Wordmark className="route-loading-wordmark" />
          <span className="route-loading-pulse" aria-hidden="true" />
        </div>
        <p className="route-loading-label">{label}</p>
        <div className="route-loading-skeleton" aria-hidden="true">
          <span className="route-skel route-skel-title" />
          <span className="route-skel route-skel-lede" />
          <div className="route-skel-grid">
            <span className="route-skel route-skel-card" />
            <span className="route-skel route-skel-card" />
            <span className="route-skel route-skel-card" />
            <span className="route-skel route-skel-card" />
          </div>
          <span className="route-skel route-skel-block" />
          <span className="route-skel route-skel-block short" />
        </div>
      </div>
    </ViewTransition>
  );
}
