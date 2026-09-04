import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { getCoachDetail } from "../api/admin";
import type { CoachDetailResponse } from "../types";
import { ApiError } from "../api/client";
import { FieldReadOnly } from "../components/ui/FieldReadOnly";
import { formatDateTime } from "../utils/dateFormat";

const LOCATION_COLOR: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  QUEUED: "bg-amber-100 text-amber-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
};

export function CoachDetailPage() {
  const { coachId } = useParams<{ coachId: string }>();
  const [detail, setDetail] = useState<CoachDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coachId) return;
    getCoachDetail(Number(coachId))
      .then(setDetail)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load coach detail."));
  }, [coachId]);

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline">
        <ArrowLeft size={16} /> Back
      </Link>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!detail && !error && <p className="mt-4 text-sm text-slate-500">Loading…</p>}

      {detail && (
        <>
          <div className="mt-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Coach {detail.coach.coach_number} <span className="text-slate-400">·</span>{" "}
              <span className="text-slate-500">{detail.coach.coach_type}</span>
            </h2>
            <p className="mt-1 text-sm text-slate-500">Full pipeline detail and history for this coach.</p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-slate-100 px-4 py-2.5 font-semibold text-slate-800">Coach Information</div>
              <div className="divide-y divide-slate-100 px-4">
                {[
                  ["Coach Number", detail.coach.coach_number],
                  ["Serial No.", detail.coach.serial_no],
                  ["Coach Type", detail.coach.coach_type],
                  ["Coach Category", detail.coach.coach_category],
                  ["Plant", detail.coach.plant],
                  ["Production Year", detail.coach.production_year],
                  ["BO Number", `${detail.coach.bo_number}-${detail.coach.bo_item}`],
                  ["Installation No.", detail.coach.installation_no ?? "—"],
                ].map(([label, value]) => (
                  <div key={label} className="py-2.5">
                    <FieldReadOnly label={label} value={value} />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-slate-100 px-4 py-2.5 font-semibold text-slate-800">Current Location</div>
              <div className="p-4">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${LOCATION_COLOR[detail.location.status]}`}
                >
                  {detail.location.status}
                </span>
                <p className="mt-3 text-sm text-slate-700">{detail.location.label}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800">Pipeline Workflow</h3>
            <p className="text-xs text-slate-400">Current status of this coach in the production pipeline</p>

            <div className="mt-6 flex items-start justify-between overflow-x-auto">
              {detail.stages.map((stage, i) => {
                const isCurrent = !stage.done && detail.stages.slice(0, i).every((s) => s.done);
                return (
                  <div key={stage.key} className="flex flex-1 flex-col items-center px-1 text-center">
                    <div className="flex w-full items-center">
                      <div
                        className={`h-0.5 flex-1 ${i === 0 ? "invisible" : stage.done ? "bg-green-500" : "bg-slate-200"}`}
                      />
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          stage.done
                            ? "bg-green-500 text-white"
                            : isCurrent
                              ? "border-2 border-blue-500 text-blue-600"
                              : "border-2 border-slate-200 text-slate-400"
                        }`}
                      >
                        {stage.done ? <CheckCircle2 size={16} /> : isCurrent ? i + 1 : <Circle size={12} />}
                      </div>
                      <div
                        className={`h-0.5 flex-1 ${i === detail.stages.length - 1 ? "invisible" : stage.done ? "bg-green-500" : "bg-slate-200"}`}
                      />
                    </div>
                    <p className={`mt-2 text-xs font-medium ${isCurrent ? "text-blue-600" : "text-slate-600"}`}>
                      {stage.label}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm">
              <p className="font-medium text-blue-900">Current Status</p>
              <p className="mt-0.5 text-blue-800">{detail.location.label}</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800">History</h3>
            <p className="text-xs text-slate-400">{detail.history.length} recorded actions</p>

            {detail.history.length === 0 && <p className="mt-4 text-sm text-slate-500">No history yet.</p>}

            <div className="mt-4 divide-y divide-slate-100">
              {detail.history.map((h, i) => (
                <div key={i} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        {h.stage}
                      </span>
                      <span className="ml-2 text-sm text-slate-700">by {h.recorded_by}</span>
                    </div>
                    <span className="flex-shrink-0 text-xs text-slate-400">{formatDateTime(h.occurred_at)}</span>
                  </div>
                  {h.location && <p className="mt-1 text-xs text-slate-500">Location: {h.location}</p>}
                  {h.remarks && <p className="mt-1 text-sm text-slate-600">Remarks: {h.remarks}</p>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
