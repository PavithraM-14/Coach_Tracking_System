import type { WorklistCoach } from "../../types";

interface PendingCoachesTableProps {
  coaches: WorklistCoach[] | null;
  emptyMessage?: string;
}

// Shared "Pending Coaches" module — the same full-detail table Shell
// Production already shows, embedded directly on each stage's entry page
// (Furnishing, Paint In/Out, Assembly In/Out, and the four dispatch stages)
// next to the single-coach picker, so an employee can browse everything
// assigned/queued to them instead of scanning one dropdown at a time.
export function PendingCoachesTable({ coaches, emptyMessage = "No coaches currently pending." }: PendingCoachesTableProps) {
  return (
    <div className="mt-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pending Coaches</p>

      {coaches === null && <p className="mt-2 text-sm text-slate-500">Loading...</p>}
      {coaches && coaches.length === 0 && <p className="mt-2 text-sm text-slate-500">{emptyMessage}</p>}

      {coaches && coaches.length > 0 && (
        <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
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
