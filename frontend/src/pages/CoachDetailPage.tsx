import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, CheckCircle2, Circle, Clock } from "lucide-react";
import { getCoachDetail } from "../api/admin";
import type { CoachDetailResponse, ScheduleComparisonStage } from "../types";
import { ApiError } from "../api/client";
import { FieldReadOnly } from "../components/ui/FieldReadOnly";
import { formatDateTime } from "../utils/dateFormat";

const LOCATION_COLOR: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  QUEUED: "bg-amber-100 text-amber-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
};

const SCHEDULE_STATUS_STYLE: Record<ScheduleComparisonStage["status"], string> = {
  on_time: "bg-green-100 text-green-700",
  delayed: "bg-red-100 text-red-700",
  overdue: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
  reference: "bg-indigo-100 text-indigo-700",
};

const SCHEDULE_STATUS_LABEL: Record<ScheduleComparisonStage["status"], string> = {
  on_time: "On time",
  delayed: "Delayed",
  overdue: "Overdue",
  pending: "Not yet due",
  reference: "Recorded",
};

function formatDate(date: string): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

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

          <div className="mt-6 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 shadow-lg">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-slate-800">Production Analysis</h2>
              <p className="mt-2 text-sm text-slate-600">
                Coach No : <span className="font-semibold">{detail.coach.coach_number}</span> | Coach Name :{" "}
                <span className="font-semibold">{detail.coach.coach_type}</span> | Shell Out :{" "}
                <span className="font-semibold">
                  {detail.history.find((h) => h.stage === "Shell Outturn")?.occurred_at
                    ? formatDate(detail.history.find((h) => h.stage === "Shell Outturn")!.occurred_at.split(" ")[0])
                    : "—"}
                </span>
              </p>
            </div>

            {/* Timeline Headers */}
            <div className="mb-3 grid grid-cols-12 gap-2 text-center">
              <div className="col-span-3 rounded-lg bg-slate-700 py-3 text-sm font-bold uppercase text-white">
                Scheduled Date
              </div>
              <div className="col-span-6 rounded-lg bg-slate-700 py-3 text-sm font-bold uppercase text-white">
                Production Stage
              </div>
              <div className="col-span-3 rounded-lg bg-slate-700 py-3 text-sm font-bold uppercase text-white">
                Production Date
              </div>
            </div>

            {/* Timeline Rows - Exclude Shell Outturn */}
            <div className="space-y-2">
              {detail.schedule.stages
                .filter((stage) => stage.label !== "Shell Outturn")
                .map((stage, idx) => {
                  const bgColor =
                    stage.status === "on_time"
                      ? "bg-green-50"
                      : stage.status === "delayed" || stage.status === "overdue"
                        ? "bg-red-50"
                        : "bg-slate-50";

                  return (
                    <div key={stage.key} className={`grid grid-cols-12 gap-2 rounded-lg ${bgColor} p-3 transition-all`}>
                      {/* Scheduled Date */}
                      <div className="col-span-3 flex items-center justify-center">
                        <span className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm">
                          {stage.scheduled_date ? formatDate(stage.scheduled_date) : "—"}
                        </span>
                      </div>

                      {/* Production Stage Bar */}
                      <div className="col-span-6 flex items-center">
                        <div className="relative w-full">
                          <div
                            className="flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-sm font-semibold text-white shadow-md"
                            style={{
                              width: stage.status === "pending" ? "70%" : "100%",
                            }}
                          >
                            {stage.label}
                          </div>
                        </div>
                      </div>

                      {/* Production Date */}
                      <div className="col-span-3 flex items-center justify-center">
                        {stage.actual_date ? (
                          <span
                            className={`rounded-md px-3 py-1.5 text-sm font-medium shadow-sm ${
                              stage.status === "on_time"
                                ? "bg-green-600 text-white"
                                : stage.status === "delayed" || stage.status === "overdue"
                                  ? "bg-red-600 text-white"
                                  : "bg-slate-600 text-white"
                            }`}
                          >
                            {formatDate(stage.actual_date)}
                          </span>
                        ) : (
                          <span
                            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                              stage.status === "overdue"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {stage.status === "overdue" ? "Overdue" : "—"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Summary Cards */}
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 text-center shadow-md">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="text-blue-600" size={24} />
                  <p className="text-sm font-medium uppercase text-blue-700">Scheduled Production Days</p>
                </div>
                <p className="mt-3 text-5xl font-bold text-blue-800">{detail.schedule.scheduled_total_days}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 text-center shadow-md">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="text-indigo-600" size={24} />
                  <p className="text-sm font-medium uppercase text-indigo-700">Live Production Days</p>
                </div>
                <p className="mt-3 text-5xl font-bold text-indigo-800">
                  {detail.schedule.actual_total_days ?? "—"}
                </p>
              </div>
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
