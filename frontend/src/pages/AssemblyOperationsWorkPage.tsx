import { useEffect, useState } from "react";
import { getAssemblyOperationsWorklist, completeAssemblyOperations } from "../api/assemblyOperations";
import type { AssemblyOperationWorklistRow } from "../types";
import { ApiError } from "../api/client";
import { ValidationMessage } from "../components/ui/ValidationMessage";

export function AssemblyOperationsWorkPage() {
  const [coaches, setCoaches] = useState<AssemblyOperationWorklistRow[] | null>(null);
  const [selected, setSelected] = useState<Record<number, Set<number>>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);

  function reload() {
    setLoadError(null);
    getAssemblyOperationsWorklist()
      .then((res) => {
        setCoaches(res.data);
        setSelected({});
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Failed to load your operations."));
  }

  useEffect(() => {
    reload();
  }, []);

  function toggleOperation(assemblyInId: number, operationId: number) {
    setSelected((prev) => {
      const current = new Set(prev[assemblyInId] ?? []);
      if (current.has(operationId)) current.delete(operationId);
      else current.add(operationId);
      return { ...prev, [assemblyInId]: current };
    });
  }

  async function handleComplete(assemblyInId: number) {
    const operationIds = Array.from(selected[assemblyInId] ?? []);
    if (operationIds.length === 0) return;

    setCompleteError(null);
    setCompletingId(assemblyInId);
    try {
      await completeAssemblyOperations({ assembly_in_id: assemblyInId, operation_ids: operationIds });
      reload();
    } catch (err) {
      setCompleteError(err instanceof ApiError ? err.message : "Failed to complete operations.");
    } finally {
      setCompletingId(null);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">Assembly Operations</h2>
      <p className="mt-1 text-sm text-slate-500">
        Coaches at Assembly In with operations assigned to you still pending. Check off what's done and hit
        Complete — once every operation that applies to a coach is done, it moves on to Assembly Out.
      </p>

      {loadError && <p className="mt-4 text-sm text-red-600">{loadError}</p>}
      {completeError && (
        <div className="mt-3 max-w-xl">
          <ValidationMessage kind="error" message={completeError} />
        </div>
      )}

      {coaches && coaches.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">No pending operations assigned to you right now.</p>
      )}

      <div className="mt-4 space-y-4">
        {coaches?.map((coach) => {
          const chosen = selected[coach.assembly_in_id] ?? new Set<number>();
          return (
            <div
              key={coach.assembly_in_id}
              className="max-w-xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{coach.coach_number}</p>
                  <p className="text-xs text-slate-500">{coach.coach_type}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleComplete(coach.assembly_in_id)}
                  disabled={chosen.size === 0 || completingId === coach.assembly_in_id}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {completingId === coach.assembly_in_id ? "Completing..." : "Complete"}
                </button>
              </div>

              <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                {coach.pending_operations.map((op) => (
                  <label key={op.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={chosen.has(op.id)}
                      onChange={() => toggleOperation(coach.assembly_in_id, op.id)}
                    />
                    {op.display_name}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
