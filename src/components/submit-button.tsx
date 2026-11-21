"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  variant = "primary",
  className,
  style,
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "danger" | "success";
  className?: string;
  style?: React.CSSProperties;
}) {
  const { pending } = useFormStatus();
  const defaultClass = `btn btn-${variant}`;
  return (
    <button className={className ?? defaultClass} style={style} disabled={pending}>
      {pending ? "Saving…" : children}
    </button>
  );
}
