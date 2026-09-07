import { useEffect, useState } from "react";
import { getVendorCoaches } from "../api/vendor";
import type { VendorCoachRow } from "../types";
import { ApiError } from "../api/client";
import { formatDateOnly } from "../utils/dateFormat";

export function VendorCoachesPage() {
  const [rows, setRows] = useState<VendorCoachRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getVendorCoaches()
      .then((res) => setRows(res.data))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Failed to load coaches."));
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">My Coaches</h2>
      <p className="mt-1 text-sm text-slate-500">Every coach painted under your vendor, most recent first.</p>

      {loadError && <p className="mt-4 text-sm text-red-600">{loadError}</p>}

      {rows && rows.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">
          No coaches recorded under your vendor yet — or this login isn't assigned to a vendor. Contact Admin if
          that seems wrong.
        </p>
      )}

      {rows && rows.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Coach No.</th>
                <th className="px-4 py-2">Coach Type</th>
                <th className="px-4 py-2">Paint In</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.paint_in_id}>
                  <td className="px-4 py-2 font-medium text-slate-800">{row.coach_number}</td>
                  <td className="px-4 py-2">{row.coach_type}</td>
                  <td className="px-4 py-2">
                    {formatDateOnly(row.paint_in_datetime)}
                    <p className="text-xs text-slate-400">by {row.paint_in_by}</p>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.paint_out_datetime ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
