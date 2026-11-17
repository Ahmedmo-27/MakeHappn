export function inPeriod(date: Date | null | undefined, start: Date) {
  if (!date) return false;
  return new Date(date) >= start;
}

export function periodStart(period: string, now = new Date()) {
  const start = new Date(now);
  if (period === "month") start.setMonth(now.getMonth() - 1);
  else if (period === "year") start.setFullYear(now.getFullYear() - 1);
  else start.setMonth(now.getMonth() - 3);
  return start;
}