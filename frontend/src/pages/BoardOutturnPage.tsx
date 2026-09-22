import { useEffect, useState } from "react";
import { createBoardOutturn, getBoardOutturnWorklist } from "../api/boardOutturn";
import { getMyAssignmentSummary } from "../api/assignments";
import type { AssignmentSummary, BoardOutturnWorklistCoach } from "../types";
import { ApiError } from "../api/client";
import { FieldReadOnly } from "../components/ui/FieldReadOnly";
import { ValidationMessage } from "../components/ui/ValidationMessage";
import { DatePickerField, formatDateForDisplay } from "../components/ui/DatePickerField";

function toLocalDate(datetime: string): Date {
  return new Date(datetime.includes("T") ? datetime : datetime.replace(" ", "T"));
}

export function BoardOutturnPage() {
  const [coaches, setCoaches] = useState<BoardOutturnWorklistCoach[] | null>(null);
  const [summary, setSummary] = useState<AssignmentSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedCoachId, setSelectedCoachId] = useState<number | "">("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [remarks, setRemarks] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    getBoardOutturnWorklist()
      .then((res) => setCoaches(res.data))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Failed to load coaches."));
    getMyAssignmentSummary("BOARD_OUTTURN").then(setSummary);
  }

  useEffect(() => {
    reload();
  }, []);

  const selectedCoach = coaches?.find((c) => c.coach_id === selectedCoachId);

  function handleCoachChange(value: string) {
    const coachId = value ? Number(value) : "";
    setSelectedCoachId(coachId);
    setFieldError(null);
    setSuccess(null);

    const coach = coaches?.find((c) => c.coach_id === coachId);
    setDate(coach ? toLocalDate(coach.lock_seal_datetime) : undefined);
  }

  async function handleSubmit() {
    setFieldError(null);
    setApiError(null);
    setSuccess(null);

    if (!selectedCoachId) {
      setFieldError("Select a coach.");
      return;
    }
    if (!date) {
      setFieldError("Railway Board Outturn date is required.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createBoardOutturn({
        coach_id: selectedCoachId,
        board_outturn_date: formatDateForDisplay(date),
        board_outturn_time: "00:00",
        remarks: remarks || undefined,
      });
      setSuccess(
        `Railway Board Outturn recorded for coach ${result.coach_number} on ${result.board_outturn_datetime.slice(0, 10)} — now eligible for Physical Dispatch.`,
      );
      setSelectedCoachId("");
      setDate(undefined);
      setRemarks("");
      reload();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Failed to record Railway Board Outturn.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold text-slate-800">Railway Board Outturn</h2>
      <p className="mt-1 text-sm text-slate-500">
        Every coach is auto-assigned to you (no cap — one queue, one employee) as soon as Lock &
        Seal is recorded. Pick one below — the date starts out matching its Lock & Seal date, but
        you can change it before submitting. Submitting opens the coach up for Physical Dispatch.
      </p>

      {summary && (
        <p className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          Assigned to you: {summary.assigned_count}
          {summary.capacity !== null && ` / ${summary.capacity}`}
          {summary.queued_count > 0 && ` · ${summary.queued_count} queued for you`}
        </p>
      )}

      {loadError && <p className="mt-4 text-sm text-red-600">{loadError}</p>}

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Coach (assigned to you)</p>
        <select
          value={selectedCoachId}
          onChange={(e) => handleCoachChange(e.target.value)}
          className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Select a coach</option>
          {coaches?.map((coach) => (
            <option key={coach.coach_id} value={coach.coach_id}>
              {coach.coach_number} — {coach.coach_type}
            </option>
          ))}
        </select>
        {coaches && coaches.length === 0 && (
          <p className="mt-1 text-sm text-slate-500">No coaches currently assigned to you for Railway Board Outturn.</p>
        )}
      </div>

      {selectedCoach && (
        <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <FieldReadOnly label="Coach Type" value={selectedCoach.coach_type} />
          <FieldReadOnly label="Plant" value={selectedCoach.plant} />
          <FieldReadOnly label="Production Year" value={selectedCoach.production_year} />
          <FieldReadOnly label="Lock & Seal Date" value={formatDateForDisplay(toLocalDate(selectedCoach.lock_seal_datetime))} />
          <FieldReadOnly label="Railway Serial No." value={selectedCoach.outturn_serial_no ?? "—"} />
          <FieldReadOnly label="Railway" value={selectedCoach.railway ?? "—"} />
          <FieldReadOnly label="Predicted Date" value={selectedCoach.predicted_date ?? "—"} />
        </div>
      )}

      <div className="mt-5 max-w-xs">
        <DatePickerField label="Railway Board Outturn Date" value={date} onChange={setDate} />
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
          {submitting ? "Submitting..." : "Submit Railway Board Outturn"}
        </button>
      </div>
    </div>
  );
}
