import { useEffect, useState } from "react";
import { getFurnishingInList } from "../api/furnishingIn";
import { createFurnishingOut, getFurnishingOutWorklist } from "../api/furnishingOut";
import { getMyAssignmentSummary } from "../api/assignments";
import type { AssignmentSummary, FurnishingInRow, WorklistCoach } from "../types";
import { ApiError } from "../api/client";
import { formatDateOnly, formatDateTime } from "../utils/dateFormat";
import { ValidationMessage } from "../components/ui/ValidationMessage";
import { DatePickerField, formatDateForDisplay } from "../components/ui/DatePickerField";

export function FurnishingInPage() {
  const [rows, setRows] = useState<FurnishingInRow[] | null>(null);
  const [pending, setPending] = useState<WorklistCoach[] | null>(null);
  const [summary, setSummary] = useState<AssignmentSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedCoachId, setSelectedCoachId] = useState<number | "">("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("09:00");
  const [remarks, setRemarks] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    getFurnishingInList()
      .then((res) => setRows(res.data))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Failed to load Furnishing In records."));
    getFurnishingOutWorklist()
      .then((res) => setPending(res.data))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Failed to load pending coaches."));
    getMyAssignmentSummary().then(setSummary);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleSubmit() {
    setFieldError(null);
    setApiError(null);
    setSuccess(null);

    if (!selectedCoachId) {
      setFieldError("Select a coach.");
      return;
    }
    if (!date) {
      setFieldError("Furnishing Out date is required.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createFurnishingOut({
        coach_id: selectedCoachId,
        furnishing_out_date: formatDateForDisplay(date),
        furnishing_out_time: time,
        remarks: remarks || undefined,
      });
      setSuccess(
        `Furnishing Out recorded for coach ${result.coach_number} at ${result.furnishing_out_datetime} — now available for Paint In.`,
      );
      setSelectedCoachId("");
      setDate(undefined);
      setRemarks("");
      reload();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Failed to record Furnishing Out.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">Furnishing In / Out</h2>
      <p className="mt-1 text-sm text-slate-500">
        Coaches released from Shell Outturn enter Furnishing In automatically (same timestamp) and
        are auto-assigned to a skilled employee, up to 5 at a time. Mark Furnishing Out below once
        the work is complete — that frees your capacity for the next queued coach and makes this
        one eligible for Paint In.
      </p>

      {summary && (
        <p className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          Capacity: {summary.assigned_count} / {summary.capacity} assigned
          {summary.queued_count > 0 && ` · ${summary.queued_count} queued for you`}
        </p>
      )}

      {loadError && <p className="mt-4 text-sm text-red-600">{loadError}</p>}

      <div className="mt-5 max-w-xl rounded border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-800">Mark Furnishing Out</h3>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mt-3">Coach (assigned to you)</p>
        <select
          value={selectedCoachId}
          onChange={(e) => setSelectedCoachId(e.target.value ? Number(e.target.value) : "")}
          className="mt-0.5 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Select a coach</option>
          {pending?.map((coach) => (
            <option key={coach.coach_id} value={coach.coach_id}>
              {coach.coach_number} — {coach.coach_type}
            </option>
          ))}
        </select>
        {pending && pending.length === 0 && (
          <p className="mt-1 text-sm text-slate-500">
            No coaches currently assigned to you for Furnishing Out.
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-4">
          <DatePickerField label="Furnishing Out Date" value={date} onChange={setDate} />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Furnishing Out Time</p>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-0.5 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Remarks (optional)</p>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            className="mt-0.5 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {fieldError && <ValidationMessage kind="error" message={fieldError} />}
        {apiError && <ValidationMessage kind="error" message={apiError} />}
        {success && <ValidationMessage kind="success" message={success} />}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Mark Furnishing Out"}
        </button>
      </div>

      <h3 className="mt-8 text-sm font-semibold text-slate-800">All Furnishing In Records</h3>
      {rows && rows.length === 0 && (
        <p className="mt-2 text-sm text-slate-500">
          No coaches have entered Furnishing yet. A Shell Outturn opens Furnishing In here.
        </p>
      )}
      {rows && rows.length > 0 && (
        <div className="mt-2 overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Coach No.</th>
                <th className="px-4 py-2">Coach Type</th>
                <th className="px-4 py-2">Furnishing In (= Shell Outturn)</th>
                <th className="px-4 py-2">Furnishing Out</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.furnishing_in_id}>
                  <td className="px-4 py-2 font-medium text-slate-800">{row.coach_number}</td>
                  <td className="px-4 py-2">{row.coach_type}</td>
                  <td className="px-4 py-2">{formatDateOnly(row.furnishing_in_datetime)}</td>
                  <td className="px-4 py-2">
                    {row.furnishing_out_datetime ? formatDateTime(row.furnishing_out_datetime) : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.status === "FURNISHING_OUT"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {row.status === "FURNISHING_OUT" ? "Furnishing Out" : "Furnishing In"}
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
