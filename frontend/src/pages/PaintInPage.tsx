import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPaintIn, getPaintInWorklist, getPaintLines } from "../api/paintIn";
import { getMyAssignmentSummary } from "../api/assignments";
import type { AssignmentSummary, PaintLine, WorklistCoach } from "../types";
import { ApiError } from "../api/client";
import { FieldReadOnly } from "../components/ui/FieldReadOnly";
import { ValidationMessage } from "../components/ui/ValidationMessage";
import { DatePickerField, formatDateForDisplay } from "../components/ui/DatePickerField";
import { PendingCoachesTable } from "../components/ui/PendingCoachesTable";

export function PaintInPage() {
  const [lines, setLines] = useState<PaintLine[] | null>(null);
  const [coaches, setCoaches] = useState<WorklistCoach[] | null>(null);
  const [summary, setSummary] = useState<AssignmentSummary | null>(null);
  const [selectedCoachId, setSelectedCoachId] = useState<number | "">("");
  const [selectedSlotId, setSelectedSlotId] = useState<number | "">("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [remarks, setRemarks] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    getPaintLines().then((res) => setLines(res.data));
    getPaintInWorklist().then((res) => setCoaches(res.data));
    getMyAssignmentSummary("PAINT").then(setSummary);
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
    if (!selectedSlotId) {
      setFieldError("Select an available line/slot.");
      return;
    }
    if (!date) {
      setFieldError("Paint In date is required.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createPaintIn({
        coach_id: selectedCoachId,
        slot_id: selectedSlotId,
        paint_in_date: formatDateForDisplay(date),
        paint_in_time: "00:00",
        remarks: remarks || undefined,
      });
      setSuccess(
        `Paint In recorded for coach ${result.coach_number} on ${result.paint_line}, slot ${result.slot_number}.`,
      );
      setSelectedCoachId("");
      setSelectedSlotId("");
      setDate(undefined);
      setRemarks("");
      reload();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Failed to record Paint In.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCoach = coaches?.find((c) => c.coach_id === selectedCoachId);

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">Paint In</h2>
      <p className="mt-1 text-sm text-slate-500">
        Each paint line has a maximum capacity of 10 coaches. Coaches are auto-assigned to you (up
        to 5 at a time) once Furnishing In is recorded — pick a slot for one of your assigned
        coaches below.
      </p>

      <Link
        to="/paint-in/history"
        className="mt-3 inline-block rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
      >
        Paint In Records →
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {summary && (
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            Booked: {summary.assigned_count} / {summary.capacity ?? "∞"} assigned to you
            {summary.queued_count > 0 && ` · ${summary.queued_count} queued`}
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Available
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Booked
        </span>
      </div>

      {lines && (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {lines.map((line) => (
            <div key={line.paint_line_id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">{line.name}</p>
              <p className="text-xs text-slate-500">
                {line.occupied_slots} / {line.total_slots} occupied
              </p>
              <div className="mt-2 grid grid-cols-5 gap-1">
                {line.slots.map((slot) => (
                  <button
                    key={slot.slot_id}
                    type="button"
                    disabled={slot.is_occupied}
                    onClick={() => setSelectedSlotId(slot.slot_id)}
                    title={slot.is_occupied ? `Occupied by ${slot.coach_number}` : `Slot ${slot.slot_number}`}
                    className={`rounded py-1 text-xs font-medium ${
                      slot.is_occupied
                        ? "cursor-not-allowed bg-orange-100 text-orange-700"
                        : selectedSlotId === slot.slot_id
                          ? "bg-blue-600 text-white"
                          : "bg-green-100 text-green-800 hover:bg-green-200"
                    }`}
                  >
                    {slot.slot_number}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <PendingCoachesTable coaches={coaches} emptyMessage="No coaches currently assigned to you for Paint In." />

      <div className="mt-6 max-w-xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
          <p className="mt-1 text-sm text-slate-500">No coaches currently assigned to you for Paint In.</p>
        )}

        {selectedCoach && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <FieldReadOnly label="Coach Type" value={selectedCoach.coach_type} />
            <FieldReadOnly label="Plant" value={selectedCoach.plant} />
            <FieldReadOnly label="Production Year" value={selectedCoach.production_year} />
            <FieldReadOnly label="BO Number" value={`${selectedCoach.bo_number}-${selectedCoach.bo_item}`} />
          </div>
        )}

        <div className="mt-4 max-w-xs">
          <DatePickerField label="Paint In Date" value={date} onChange={setDate} />
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Remarks (optional)</p>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            className="mt-0.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {fieldError && <ValidationMessage kind="error" message={fieldError} />}
        {apiError && <ValidationMessage kind="error" message={apiError} />}
        {success && <ValidationMessage kind="success" message={success} />}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Paint In"}
        </button>
      </div>
    </div>
  );
}
