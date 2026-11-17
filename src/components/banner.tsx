import { RouteLoading } from "@/components/route-loading";

export function Banner({ error, notice }: { error?: string; notice?: string }) {
  if (error) return <p className="banner banner-error" role="alert">{error}</p>;
  if (notice) return <p className="banner banner-ok" role="status">{notice}</p>;
  return null;
}

export function PageFallback({
  label = "Loading",
  variant = "inline",
}: {
  label?: string;
  variant?: "panel" | "inline";
}) {
  return <RouteLoading label={label} variant={variant} />;
}
