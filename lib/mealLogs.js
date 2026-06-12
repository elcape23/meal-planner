/** Client-side helpers for the /api/meal-logs endpoint. */

/** Fetch logs for a list of consecutive dates → { [date]: { [meal]: row } }. */
export async function fetchWeekLogs(dates) {
  const from = dates[0];
  const to   = dates[dates.length - 1];
  const res  = await fetch(`/api/meal-logs?from=${from}&to=${to}`);
  if (!res.ok) throw new Error(`Failed to load meal logs (${res.status})`);
  const rows = await res.json();
  const map = {};
  rows.forEach((row) => {
    if (!map[row.date]) map[row.date] = {};
    map[row.date][row.meal] = row;
  });
  return map;
}

/** Upsert a single meal log. Resolves to the saved row; throws on failure. */
export async function saveMealLog(payload) {
  const res = await fetch("/api/meal-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to save meal log (${res.status})`);
  return res.json();
}
