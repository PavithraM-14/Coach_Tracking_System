import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { getPaintInWorklist } from "../api/paintIn";
import { getPaintRecords } from "../api/paintRecords";
import { ApiError } from "../api/client";
import { formatDateOnly } from "../utils/dateFormat";

type Stage = "PENDING" | "AT_PAINT_IN" | "MOVED_TO_PAINT_OUT";

interface StageRow {
  coach_id: number;
  coach_number: string;
  coach_type: string;
  stage: Stage;
  since: string | null;
}

const STAGE_ORDER: Record<Stage, number> = { PENDING: 0, AT_PAINT_IN: 1, MOVED_TO_PAINT_OUT: 2 };

const STAGE_LABEL: Record<Stage, string> = {
  PENDING: "Pending Paint In",
  AT_PAINT_IN: "At Paint In",
  MOVED_TO_PAINT_OUT: "Moved to Paint Out",
};

const STAGE_COLOR: Record<Stage, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  AT_PAINT_IN: "bg-blue-100 text-blue-700",
  MOVED_TO_PAINT_OUT: "bg-green-100 text-green-700",
};

// Backs the "Total Paint In Records" dashboard tile — every coach that has
// ever reached Paint In (whether still waiting, sitting at Paint In, or
// already moved on to Paint Out), one row each.
export function PaintInStagesPage() {
  const [rows, setRows] = useState<StageRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    Promise.all([getPaintInWorklist(), getPaintRecords()])
      .then(([worklistRes, recordsRes]) => {
        const pending: StageRow[] = worklistRes.data.map((c) => ({
          coach_id: c.coach_id,
          coach_number: c.coach_number,
          coach_type: c.coach_type,
          stage: "PENDING",
          since: null,
        }));
        const completed: StageRow[] = recordsRes.data.map((r) => ({
          coach_id: r.coach_id,
          coach_number: r.coach_number,
          coach_type: r.coach_type,
          stage: r.paint_out_datetime ? "MOVED_TO_PAINT_OUT" : "AT_PAINT_IN",
          since: r.paint_out_datetime ?? r.paint_in_datetime,
        }));
        setRows([...pending, ...completed]);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load coach stages."));
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const q = query.trim().toLowerCase();
    const base = q
      ? rows.filter((r) => r.coach_number.toLowerCase().includes(q) || r.coach_type.toLowerCase().includes(q))
      : rows;
    return [...base].sort((a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage]);
  }, [rows, query]);

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">Paint In — Coach Stages</h2>
      <p className="mt-1 text-sm text-slate-500">
        Every coach that has reached Paint In, and which stage it's at right now.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

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
            placeholder="Filter by coach or type..."
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs"
          />
        </div>
      </div>

      {filtered && filtered.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">No coaches match your filter.</p>
      )}

      {filtered && filtered.length > 0 && (
        <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Coach No.</th>
                <th className="px-4 py-2">Coach Type</th>
                <th className="px-4 py-2">Current Stage</th>
                <th className="px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr key={row.coach_id}>
                  <td className="px-4 py-2 font-medium text-slate-800">{row.coach_number}</td>
                  <td className="px-4 py-2">{row.coach_type}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_COLOR[row.stage]}`}>
                      {STAGE_LABEL[row.stage]}
                    </span>
                  </td>
                  <td className="px-4 py-2">{row.since ? formatDateOnly(row.since) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
