export function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatCurrency(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export type ExperiencePhase = "live" | "upcoming" | "wrapped";

export function utcToday(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function toDateInput(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isOverdue(
  dueDate: Date | string | null | undefined,
  status: string,
  today = utcToday(),
): boolean {
  if (!dueDate || status === "done") return false;
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  return due.getTime() < today.getTime();
}

export function experiencePhase(
  start: Date | string,
  end: Date | string,
  today = utcToday(),
): ExperiencePhase {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;
  if (today.getTime() < startDate.getTime()) return "upcoming";
  if (today.getTime() > endDate.getTime()) return "wrapped";
  return "live";
}

export function parseDateInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function readMessage(params: Record<string, string | string[] | undefined>) {
  const one = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  return { error: one(params.error), notice: one(params.notice) };
}
