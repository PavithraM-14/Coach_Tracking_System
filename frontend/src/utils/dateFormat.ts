// Single source of truth for how dates/datetimes are formatted for display.
// Backend sends MySQL DATETIME strings like "2026-09-03 14:30:00".

export function formatDateTime(value: string): string {
  const iso = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDateInputValue(date: Date): string {
  return date.toLocaleDateString("en-CA"); // YYYY-MM-DD
}

// Date-only display (no time) — used for Shell Outturn / Furnishing In, which
// are recorded as dates without a meaningful time-of-day component.
export function formatDateOnly(value: string): string {
  const iso = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
}
