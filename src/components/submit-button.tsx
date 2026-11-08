"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  variant = "primary",
  className,
  style,
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
  style?: React.CSSProperties;
}) {
  const { pending } = useFormStatus();
  const defaultClass = variant === "primary" ? "btn btn-primary" : "btn btn-ghost";
  return (
    <button className={className ?? defaultClass} style={style} disabled={pending}>
      {pending ? "Saving…" : children}
    </button>
  );
}
