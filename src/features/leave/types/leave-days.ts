/**
 * Mirrors count_leave_days() in the database: Sundays and national holidays are not counted,
 * Saturdays are. The server recalculates on submit; this is only for the preview in the form.
 */
export function countLeaveDays(startDate: string, endDate: string, holidays: ReadonlySet<string>): number {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;

  let days = 0;
  for (const day = new Date(start); day <= end; day.setUTCDate(day.getUTCDate() + 1)) {
    const iso = day.toISOString().slice(0, 10);
    if (day.getUTCDay() !== 0 && !holidays.has(iso)) days += 1;
  }
  return days;
}

/** Days a request would use, including the half-day permit rule. */
export function requestedDays(typeCode: string, startDate: string, endDate: string, holidays: ReadonlySet<string>): number {
  if (typeCode === "half_day_permit") {
    return startDate === endDate && countLeaveDays(startDate, startDate, holidays) === 1 ? 0.5 : 0;
  }
  return countLeaveDays(startDate, endDate, holidays);
}
