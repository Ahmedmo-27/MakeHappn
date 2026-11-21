export function countWorkingDays(startValue: string, endValue: string): number | null {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(startValue) || !datePattern.test(endValue)) return null;

  const [startYear, startMonth, startDay] = startValue.split("-").map(Number);
  const [endYear, endMonth, endDay] = endValue.split("-").map(Number);
  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);
  const days = Math.floor((end - start) / 86_400_000) + 1;
  if (days < 1) return null;

  const fullWeeks = Math.floor(days / 7);
  const remainder = days % 7;
  let weekdays = fullWeeks * 5;
  const firstDay = new Date(start).getUTCDay();
  for (let offset = 0; offset < remainder; offset += 1) {
    if ((firstDay + offset) % 7 < 5) weekdays += 1;
  }
  return weekdays;
}
