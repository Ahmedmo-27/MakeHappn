"use client";

import type { ComponentProps } from "react";

/** A <select> that submits its parent form as soon as the value changes. */
export function AutoSubmitSelect(props: Omit<ComponentProps<"select">, "onChange">) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}
