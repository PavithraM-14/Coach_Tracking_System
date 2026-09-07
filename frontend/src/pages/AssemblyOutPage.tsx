import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createAssemblyOut, getAssemblyOutWorklist } from "../api/assemblyOut";
import { getMyAssignmentSummary } from "../api/assignments";
import type { AssignmentSummary, WorklistCoach } from "../types";
import { ApiError } from "../api/client";
import { FieldReadOnly } from "../components/ui/FieldReadOnly";
import { ValidationMessage } from "../components/ui/ValidationMessage";
import { DatePickerField, formatDateForDisplay } from "../components/ui/DatePickerField";

// Assembly In and Assembly Out now share one physical line pool (see Line
// Management) — a coach keeps whatever slot it's in from Assembly In
// onward, so Assembly Out is just marking the date it left, not another
// slot pick.
export function AssemblyOutPage() {
  const [coaches, setCoaches] = useState<WorklistCoach[] | null>(null);
  const [summary, setSummary] = useState<AssignmentSummary | null>(null);
  const [selectedCoachId, setSelectedCoachId] = useState<number | "">("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [remarks, setRemarks] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    getAssemblyOutWorklist().then((res) => setCoaches(res.data));
    getMyAssignmentSummary("ASSEMBLY_OUT").then(setSummary);
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
      setFieldError("Assembly Out date is required.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createAssemblyOut({
        coach_id: selectedCoachId,
        assembly_out_date: formatDateForDisplay(date),
        assembly_out_time: "00:00",
        remarks: remarks || undefined,
      });
      setSuccess(
        `Assembly Out recorded for coach ${result.coach_number} on ${result.assembly_out_datetime.slice(0, 10)}.`,
      );
      setSelectedCoachId("");
      setDate(undefined);
      setRemarks("");
      reload();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Failed to record Assembly Out.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCoach = coaches?.find((c) => c.coach_id === selectedCoachId);

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold text-slate-800">Assembly Out</h2>
      <p className="mt-1 text-sm text-slate-500">
        Coaches are auto-assigned to you (up to 5 at a time) once Assembly In is recorded. Pick one
        below and enter the date it left — it keeps whatever slot it's currently in (see Line
        Management).
      </p>

      <Link
        to="/assembly-out/history"
        className="mt-3 inline-block rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
      >
        Assembly Records →
      </Link>

      {summary && (
        <p className="mt-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
          Booked: {summary.assigned_count} / {summary.capacity ?? "∞"} assigned to you
          {summary.queued_count > 0 && ` · ${summary.queued_count} queued`}
        </p>
      )}

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Coach (assigned to you)</p>
        <select
          value={selectedCoachId}
          onChange={(e) => setSelectedCoachId(e.target.value ? Number(e.target.value) : "")}
          className="mt-0.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Select a coach</option>
          {coaches?.map((coach) => (
            <option key={coach.coach_id} value={coach.coach_id}>
              {coach.coach_number} — {coach.coach_type}
            </option>
          ))}
        </select>
        {coaches && coaches.length === 0 && (
          <p className="mt-1 text-sm text-slate-500">No coaches currently assigned to you for Assembly Out.</p>
        )}
      </div>

      {selectedCoach && (
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <FieldReadOnly label="Coach Type" value={selectedCoach.coach_type} />
          <FieldReadOnly label="Plant" value={selectedCoach.plant} />
          <FieldReadOnly label="Production Year" value={selectedCoach.production_year} />
          <FieldReadOnly label="BO Number" value={`${selectedCoach.bo_number}-${selectedCoach.bo_item}`} />
          <FieldReadOnly label="Predicted Date" value={selectedCoach.predicted_date ?? "—"} />
        </div>
      )}

      <div className="mt-5 max-w-xs">
        <DatePickerField label="Assembly Out Date" value={date} onChange={setDate} />
      </div>
      {fieldError && <ValidationMessage kind="error" message={fieldError} />}

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Remarks (optional)</p>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={2}
          className="mt-0.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {apiError && <ValidationMessage kind="error" message={apiError} />}
      {success && <ValidationMessage kind="success" message={success} />}

      <div className="mt-5">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Assembly Out"}
        </button>
      </div>
    </div>
  );
}
