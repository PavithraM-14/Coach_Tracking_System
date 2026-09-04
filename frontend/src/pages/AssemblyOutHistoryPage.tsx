import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { getAssemblyOutList } from "../api/assemblyOut";
import type { AssemblyOutListRow } from "../types";
import { ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatDateOnly } from "../utils/dateFormat";

export function AssemblyOutHistoryPage() {
  const { user } = useAuth();
  const backTo = user?.role === "ADMIN" ? "/line-management" : "/assembly-out";
  const [rows, setRows] = useState<AssemblyOutListRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const todayOnly = searchParams.get("today") === "1";

  useEffect(() => {
    getAssemblyOutList()
      .then((res) => setRows(res.data))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Failed to load Assembly Out records."));
  }, []);

  const todayStr = new Date().toLocaleDateString("en-CA");
  const dateFiltered = useMemo(() => {
    if (!rows) return null;
    return todayOnly ? rows.filter((row) => row.assembly_out_datetime.slice(0, 10) === todayStr) : rows;
  }, [rows, todayOnly, todayStr]);

  const filtered = useMemo(() => {
    if (!dateFiltered) return null;
    const q = query.trim().toLowerCase();
    if (!q) return dateFiltered;
    return dateFiltered.filter(
      (row) =>
        row.coach_number.toLowerCase().includes(q) ||
        row.coach_type.toLowerCase().includes(q) ||
        row.assembly_out_line.toLowerCase().includes(q) ||
        row.recorded_by.toLowerCase().includes(q),
    );
  }, [dateFiltered, query]);

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">Assembly Out Records{todayOnly && " — Today"}</h2>
      <p className="mt-1 text-sm text-slate-500">
        {todayOnly
          ? "Assembly Out recorded today, most recent first."
          : "Every Assembly Out recorded so far, most recent first."}{" "}
        Have a coach assigned to you?{" "}
        <Link to={backTo} className="font-medium text-blue-600 hover:underline">
          {user?.role === "ADMIN" ? "Go to Line Management →" : "Go to Assembly Out →"}
        </Link>
      </p>

      {loadError && <p className="mt-4 text-sm text-red-600">{loadError}</p>}

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-500">
            {dateFiltered
              ? `${dateFiltered.length} record${dateFiltered.length === 1 ? "" : "s"}${todayOnly ? " today" : " total"}`
              : "Loading…"}
          </p>
          {todayOnly ? (
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Show all records
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSearchParams({ today: "1" })}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Show today only
            </button>
          )}
        </div>
        <div className="relative w-64 flex-shrink-0">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400" size={15} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by coach, type, line, user..."
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs"
          />
        </div>
      </div>

      {filtered && filtered.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          {dateFiltered && dateFiltered.length === 0
            ? todayOnly
              ? "No Assembly Out recorded today yet."
              : "No coaches have completed Assembly Out yet."
            : "No records match your filter."}
        </p>
      )}

      {filtered && filtered.length > 0 && (
        <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Coach No.</th>
                <th className="px-4 py-2">Coach Type</th>
                <th className="px-4 py-2">Assembly Out Line</th>
                <th className="px-4 py-2">Slot</th>
                <th className="px-4 py-2">Assembly Out Date</th>
                <th className="px-4 py-2">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => {
                const isToday = !todayOnly && row.assembly_out_datetime.slice(0, 10) === todayStr;
                return (
                  <tr key={row.assembly_out_id}>
                    <td className="px-4 py-2 font-medium text-slate-800">{row.coach_number}</td>
                    <td className="px-4 py-2">{row.coach_type}</td>
                    <td className="px-4 py-2">{row.assembly_out_line}</td>
                    <td className="px-4 py-2">{row.slot_number}</td>
                    <td className="px-4 py-2">
                      {formatDateOnly(row.assembly_out_datetime)}
                      {isToday && (
                        <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Today
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">{row.recorded_by}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
