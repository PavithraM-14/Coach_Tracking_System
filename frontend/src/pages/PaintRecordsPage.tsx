import { Fragment, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { getPaintRecords } from "../api/paintRecords";
import type { PaintRecordRow } from "../types";
import { ApiError } from "../api/client";
import { formatDateOnly, formatDateTime } from "../utils/dateFormat";

// Replaces the separate Paint In Records / Paint Out Records pages — one
// row per coach covering its whole Paint In -> Paint Out journey, including
// every slot it has occupied along the way (see paint-records/list.php).
export function PaintRecordsPage() {
  const [rows, setRows] = useState<PaintRecordRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    getPaintRecords()
      .then((res) => setRows(res.data))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Failed to load Paint records."));
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.coach_number.toLowerCase().includes(q) ||
        row.coach_type.toLowerCase().includes(q) ||
        row.paint_in_by.toLowerCase().includes(q) ||
        (row.paint_out_by ?? "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">Paint Records</h2>
      <p className="mt-1 text-sm text-slate-500">
        Every coach's Paint In through Paint Out journey, including its full line/slot history if it
        was ever moved.
      </p>

      {loadError && <p className="mt-4 text-sm text-red-600">{loadError}</p>}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {filtered ? `${filtered.length} coach${filtered.length === 1 ? "" : "es"}` : "Loading…"}
        </p>
        <div className="relative w-64 flex-shrink-0">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400" size={15} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by coach, type, user..."
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs"
          />
        </div>
      </div>

      {filtered && filtered.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          {rows && rows.length === 0 ? "No Paint In recorded yet." : "No records match your filter."}
        </p>
      )}

      {filtered && filtered.length > 0 && (
        <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Coach No.</th>
                <th className="px-4 py-2">Coach Type</th>
                <th className="px-4 py-2">Paint In</th>
                <th className="px-4 py-2">Current / Last Slot</th>
                <th className="px-4 py-2">Paint Out</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => {
                const moved = row.line_history.length > 1;
                return (
                  <Fragment key={row.paint_in_id}>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-800">{row.coach_number}</td>
                      <td className="px-4 py-2">{row.coach_type}</td>
                      <td className="px-4 py-2">
                        {formatDateOnly(row.paint_in_datetime)}
                        <p className="text-xs text-slate-400">by {row.paint_in_by}</p>
                      </td>
                      <td className="px-4 py-2">
                        {row.current_line ? `${row.current_line}, Slot ${row.current_slot_number}` : "—"}
                        {moved && <span className="ml-1 text-xs text-amber-600">(moved)</span>}
                      </td>
                      <td className="px-4 py-2">
                        {row.paint_out_datetime ? (
                          <>
                            {formatDateOnly(row.paint_out_datetime)}
                            <p className="text-xs text-slate-400">by {row.paint_out_by}</p>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.paint_out_datetime ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {row.paint_out_datetime ? "Completed" : "In Progress"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {moved && (
                          <button
                            type="button"
                            onClick={() => setExpandedId(expandedId === row.paint_in_id ? null : row.paint_in_id)}
                            className="text-xs font-medium text-blue-600 hover:underline"
                          >
                            {expandedId === row.paint_in_id ? "Hide history" : "Line history"}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedId === row.paint_in_id && (
                      <tr>
                        <td colSpan={7} className="bg-slate-50 px-4 py-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Full slot history
                          </p>
                          <ol className="mt-1.5 space-y-1">
                            {row.line_history.map((h, i) => (
                              <li key={i} className="text-xs text-slate-600">
                                {h.paint_line}, Slot {h.slot_number} — {formatDateTime(h.occupied_from)}
                                {h.released_at ? ` to ${formatDateTime(h.released_at)}` : " (current)"} · by{" "}
                                {h.placed_by}
                              </li>
                            ))}
                          </ol>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
