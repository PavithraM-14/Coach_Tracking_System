import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createAssemblyIn, getAssemblyInWorklist, getAssemblyInLines } from "../api/assemblyIn";
import { getMyAssignmentSummary } from "../api/assignments";
import type { AssignmentSummary, AssemblyInLine, WorklistCoach } from "../types";
import { ApiError } from "../api/client";
import { FieldReadOnly } from "../components/ui/FieldReadOnly";
import { ValidationMessage } from "../components/ui/ValidationMessage";
import { DatePickerField, formatDateForDisplay } from "../components/ui/DatePickerField";

export function AssemblyInPage() {
  const [lines, setLines] = useState<AssemblyInLine[] | null>(null);
  const [coaches, setCoaches] = useState<WorklistCoach[] | null>(null);
  const [summary, setSummary] = useState<AssignmentSummary | null>(null);
  const [selectedCoachId, setSelectedCoachId] = useState<number | "">("");
  const [selectedLineId, setSelectedLineId] = useState<number | "">("");
  const [selectedSlotId, setSelectedSlotId] = useState<number | "">("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [remarks, setRemarks] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    getAssemblyInLines().then((res) => setLines(res.data));
    getAssemblyInWorklist().then((res) => setCoaches(res.data));
    getMyAssignmentSummary("ASSEMBLY_IN").then(setSummary);
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
      setFieldError("Assembly In date is required.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createAssemblyIn({
        coach_id: selectedCoachId,
        slot_id: selectedSlotId,
        assembly_in_date: formatDateForDisplay(date),
        assembly_in_time: "00:00",
        remarks: remarks || undefined,
      });
      setSuccess(
        `Assembly In recorded for coach ${result.coach_number} on ${result.assembly_in_line}, slot ${result.slot_number}.`,
      );
      setSelectedCoachId("");
      setSelectedLineId("");
      setSelectedSlotId("");
      setDate(undefined);
      setRemarks("");
      reload();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Failed to record Assembly In.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCoach = coaches?.find((c) => c.coach_id === selectedCoachId);
  const slotsInSelectedLine =
    lines?.find((l) => l.assembly_in_line_id === selectedLineId)?.slots.filter((s) => !s.is_occupied) ?? [];

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">Assembly In</h2>
      <p className="mt-1 text-sm text-slate-500">
        Each Assembly In line has a maximum capacity of 10 coaches. Coaches are auto-assigned to
        you (up to 5 at a time) once Paint Out is recorded — use the Line/Slot dropdowns below to
        pick a spot.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          to="/assembly-in/history"
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          Assembly Records →
        </Link>
        <Link
          to="/assembly-in/move"
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Move a coach between slots →
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {summary && (
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            Booked: {summary.assigned_count} / {summary.capacity ?? "∞"} assigned to you
            {summary.queued_count > 0 && ` · ${summary.queued_count} queued`}
          </span>
        )}
      </div>

      <div className="mt-4 grid max-w-xl grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Assembly Line</label>
          <select
            value={selectedLineId}
            onChange={(e) => {
              setSelectedLineId(e.target.value ? Number(e.target.value) : "");
              setSelectedSlotId("");
            }}
            className="mt-0.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select a line</option>
            {lines?.map((line) => {
              const available = line.slots.filter((s) => !s.is_occupied).length;
              return (
                <option
                  key={line.assembly_in_line_id}
                  value={line.assembly_in_line_id}
                  disabled={!line.is_active || available === 0}
                >
                  {line.name} ({line.is_active ? `${available} available` : "Blocked"})
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Slot</label>
          <select
            value={selectedSlotId}
            onChange={(e) => setSelectedSlotId(e.target.value ? Number(e.target.value) : "")}
            disabled={!selectedLineId}
            className="mt-0.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">{selectedLineId ? "Select a slot" : "Select a line first"}</option>
            {slotsInSelectedLine.map((slot) => (
              <option key={slot.slot_id} value={slot.slot_id} disabled={!slot.is_active}>
                Slot {slot.slot_number}{!slot.is_active ? " (Blocked)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

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
          <p className="mt-1 text-sm text-slate-500">No coaches currently assigned to you for Assembly In.</p>
        )}

        {selectedCoach && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <FieldReadOnly label="Coach Type" value={selectedCoach.coach_type} />
            <FieldReadOnly label="Plant" value={selectedCoach.plant} />
            <FieldReadOnly label="Production Year" value={selectedCoach.production_year} />
            <FieldReadOnly label="BO Number" value={`${selectedCoach.bo_number}-${selectedCoach.bo_item}`} />
            <FieldReadOnly label="Predicted Date" value={selectedCoach.predicted_date ?? "—"} />
          </div>
        )}

        <div className="mt-4 max-w-xs">
          <DatePickerField label="Assembly In Date" value={date} onChange={setDate} />
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
          {submitting ? "Submitting..." : "Submit Assembly In"}
        </button>
      </div>
    </div>
  );
}
