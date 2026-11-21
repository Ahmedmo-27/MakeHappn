"use client";

import { useRef } from "react";

export function DatePickerInput({
  id,
  name,
  label,
  defaultValue,
  disabled,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openCalendar() {
    const input = inputRef.current;
    if (!input || input.disabled) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.focus();
    input.click();
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="date"
        className="input"
        style={{ paddingRight: "3.25rem" }}
        defaultValue={defaultValue}
        required
        disabled={disabled}
      />
      <button
        type="button"
        className="btn btn-ghost"
        onClick={openCalendar}
        aria-label={`Open ${label.toLowerCase()} calendar`}
        disabled={disabled}
        style={{
          position: "absolute",
          right: "0.35rem",
          top: "50%",
          transform: "translateY(-50%)",
          width: "2.5rem",
          height: "2.5rem",
          minHeight: 0,
          padding: 0,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
          <path d="M8 3.5v4M16 3.5v4M3.5 9.5h17M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01" />
        </svg>
      </button>
    </div>
  );
}
