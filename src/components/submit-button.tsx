"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  const { pending } = useFormStatus();
  return (
    <button className={variant === "primary" ? "btn btn-primary" : "btn btn-ghost"} disabled={pending}>
      {pending ? "Saving…" : children}
    </button>
  );
}
