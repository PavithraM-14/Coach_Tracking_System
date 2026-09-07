import { useEffect, useMemo, useState } from "react";
import { Search, CheckSquare } from "lucide-react";
import { getAssemblyOperationCoachMatrix, saveAssemblyOperationCoachMatrix } from "../api/assemblyOperations";
import type { AssemblyOperation, AssemblyOperationMatrixCoach } from "../types";
import { ApiError } from "../api/client";
import { ValidationMessage } from "../components/ui/ValidationMessage";

function key(coachId: number, operationId: number): string {
  return `${coachId}:${operationId}`;
}

export function AssemblyOperationsAdminPage() {
  const [operations, setOperations] = useState<AssemblyOperation[] | null>(null);
  const [coaches, setCoaches] = useState<AssemblyOperationMatrixCoach[] | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoadError(null);
    getAssemblyOperationCoachMatrix()
      .then((res) => {
        setOperations(res.operations);
        setCoaches(res.coaches);
        // Default = every operation applies to every coach; the server only
        // stores exceptions (exclusions), so everything not excluded starts checked.
        const excluded = new Set(res.exclusions.map((e) => key(e.coach_id, e.operation_id)));
        const next = new Set<string>();
        for (const c of res.coaches) {
          for (const op of res.operations) {
            if (!excluded.has(key(c.id, op.id))) next.add(key(c.id, op.id));
          }
        }
        setChecked(next);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Failed to load the coach matrix."));
  }, []);

  const filteredCoaches = useMemo(() => {
    if (!coaches) return null;
    const q = query.trim().toLowerCase();
    if (!q) return coaches;
    return coaches.filter((c) => c.coach_number.toLowerCase().includes(q) || c.coach_type.toLowerCase().includes(q));
  }, [coaches, query]);

  function toggle(coachId: number, operationId: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      const k = key(coachId, operationId);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  // A column/row toggle checks everything in it if anything is unchecked,
  // and clears the whole thing only once it's already fully checked — same
  // all-or-nothing rule as the header Select All / Clear All button.
  function toggleColumn(operationId: number) {
    if (!filteredCoaches) return;
    const allChecked = filteredCoaches.every((c) => checked.has(key(c.id, operationId)));
    setChecked((prev) => {
      const next = new Set(prev);
      for (const c of filteredCoaches) {
        const k = key(c.id, operationId);
        if (allChecked) next.delete(k);
        else next.add(k);
      }
      return next;
    });
  }

  function toggleRow(coachId: number) {
    if (!operations) return;
    const allChecked = operations.every((op) => checked.has(key(coachId, op.id)));
    setChecked((prev) => {
      const next = new Set(prev);
      for (const op of operations) {
        const k = key(coachId, op.id);
        if (allChecked) next.delete(k);
        else next.add(k);
      }
      return next;
    });
  }

  const allSelected = useMemo(() => {
    if (!coaches || !operations || coaches.length === 0 || operations.length === 0) return false;
    return coaches.every((c) => operations.every((op) => checked.has(key(c.id, op.id))));
  }, [coaches, operations, checked]);

  function toggleSelectAll() {
    if (!coaches || !operations) return;
    if (allSelected) {
      setChecked(new Set());
      return;
    }
    const next = new Set<string>();
    for (const c of coaches) {
      for (const op of operations) {
        next.add(key(c.id, op.id));
      }
    }
    setChecked(next);
  }

  async function handleSave() {
    if (!coaches || !operations) return;
    setSaveError(null);
    setSaveSuccess(null);
    setSaving(true);
    try {
      // Invert back: post only the exclusions (unchecked pairs).
      const exclusions: { coach_id: number; operation_id: number }[] = [];
      for (const coach of coaches) {
        for (const op of operations) {
          if (!checked.has(key(coach.id, op.id))) {
            exclusions.push({ coach_id: coach.id, operation_id: op.id });
          }
        }
      }
      const result = await saveAssemblyOperationCoachMatrix(exclusions);
      setSaveSuccess(`Saved — ${result.saved} exclusion${result.saved === 1 ? "" : "s"} recorded.`);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save the coach matrix.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">Assembly Operations</h2>
      <p className="mt-1 text-sm text-slate-500">
        The 32 sub-operations a coach passes through between Assembly In and Assembly Out. Every operation applies
        to every coach by default — uncheck a box to exclude that operation for that specific coach. (Assign
        operations to a worker via Skills in{" "}
        <a href="/admin/users" className="text-blue-600 hover:underline">
          User Management
        </a>
        .)
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-72">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400" size={15} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by coach..."
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSelectAll}
            disabled={!coaches || !operations}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {allSelected ? "Clear All" : "Select All"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !coaches || !operations}
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {loadError && <p className="mt-4 text-sm text-red-600">{loadError}</p>}
      {saveError && (
        <div className="mt-3 max-w-md">
          <ValidationMessage kind="error" message={saveError} />
        </div>
      )}
      {saveSuccess && (
        <div className="mt-3 max-w-md">
          <ValidationMessage kind="success" message={saveSuccess} />
        </div>
      )}

      {filteredCoaches && operations && (
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="sticky left-0 z-10 min-w-[160px] border-r border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Coach
                </th>
                {operations.map((op) => (
                  <th
                    key={op.id}
                    className="h-40 w-9 border-r border-slate-100 px-1 py-2 align-bottom text-left text-[11px] font-semibold text-slate-600"
                  >
                    <div className="flex h-full flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleColumn(op.id)}
                        title="Select/clear this whole column"
                        className="flex-shrink-0 rounded border border-slate-300 bg-white p-0.5 text-slate-400 hover:border-blue-400 hover:text-blue-600"
                      >
                        <CheckSquare size={13} />
                      </button>
                      <span
                        title={`${op.display_name} (${op.department})`}
                        className="block whitespace-nowrap"
                        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                      >
                        {op.display_name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCoaches.map((coach, i) => (
                <tr key={coach.id} className={i % 2 === 1 ? "bg-slate-50/50" : ""}>
                  <td className="sticky left-0 z-10 border-r border-slate-200 bg-inherit px-3 py-1.5 align-top">
                    <div className="flex items-start gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleRow(coach.id)}
                        title="Select/clear every operation for this coach"
                        className="mt-0.5 flex-shrink-0 rounded border border-slate-300 bg-white p-0.5 text-slate-400 hover:border-blue-400 hover:text-blue-600"
                      >
                        <CheckSquare size={13} />
                      </button>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{coach.coach_number}</p>
                        <p className="text-[10px] text-slate-400">{coach.coach_type}</p>
                      </div>
                    </div>
                  </td>
                  {operations.map((op) => (
                    <td key={op.id} className="border-r border-slate-50 px-1 py-1.5 text-center">
                      <input
                        type="checkbox"
                        title={op.display_name}
                        checked={checked.has(key(coach.id, op.id))}
                        onChange={() => toggle(coach.id, op.id)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
              {filteredCoaches.length === 0 && (
                <tr>
                  <td colSpan={operations.length + 1} className="px-3 py-4 text-center text-sm text-slate-500">
                    No matches.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
