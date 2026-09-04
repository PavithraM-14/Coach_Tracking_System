import { useEffect, useState } from "react";
import { getShellOutturnWorklist } from "../api/shellOutturn";
import type { WorklistCoach } from "../types";
import { ApiError } from "../api/client";

export function ShellProductionPage() {
  const [coaches, setCoaches] = useState<WorklistCoach[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getShellOutturnWorklist()
      .then((res) => setCoaches(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load worklist."));
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">Shell Production — Pending Shell Outturn</h2>
      <p className="mt-1 text-sm text-slate-500">
        Coaches from the SAP/BO production plan that have not yet had a Shell Outturn recorded.
        Use the Shell Outturn page to record one.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {!error && coaches === null && <p className="mt-4 text-sm text-slate-500">Loading...</p>}
      {coaches && coaches.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">No coaches pending Shell Outturn.</p>
      )}

      {coaches && coaches.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Coach No.</th>
                <th className="px-4 py-2">Coach Type</th>
                <th className="px-4 py-2">BO Number</th>
                <th className="px-4 py-2">Plant</th>
                <th className="px-4 py-2">Production Year</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coaches.map((coach) => (
                <tr key={coach.coach_id}>
                  <td className="px-4 py-2 font-medium text-slate-800">{coach.coach_number}</td>
                  <td className="px-4 py-2">{coach.coach_type}</td>
                  <td className="px-4 py-2">
                    {coach.bo_number}-{coach.bo_item}
                  </td>
                  <td className="px-4 py-2">{coach.plant}</td>
                  <td className="px-4 py-2">{coach.production_year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
