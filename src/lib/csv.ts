/** Escapes one CSV cell (quotes, commas, line breaks). */
function cell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Downloads rows as a CSV file. A BOM keeps Excel from garbling Indonesian characters. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number | null)[][]): void {
  const body = [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
  const blob = new Blob([`﻿${body}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
