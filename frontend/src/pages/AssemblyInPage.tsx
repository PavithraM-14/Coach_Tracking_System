import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createAssemblyIn, getAssemblyInWorklist, getAssemblyInLines, moveAssemblyCoach } from "../api/assemblyIn";
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
  const [selectedSlotId, setSelectedSlotId] = useState<number | "">("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [remarks, setRemarks] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // A slot already occupied by someone else's coach can be freed up by
  // moving that coach elsewhere first — click the occupied slot to pick it
  // up, then click an empty slot to drop it there.
  const [movingCoach, setMovingCoach] = useState<{ coachId: number; coachNumber: string } | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

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

  async function handleSlotClick(slot: AssemblyInLine["slots"][number]) {
    if (movingCoach) {
      if (slot.is_occupied) return; // can only drop into an empty slot
      setMoveError(null);
      setMoving(true);
      try {
        await moveAssemblyCoach({ coach_id: movingCoach.coachId, to_slot_id: slot.slot_id });
        setMovingCoach(null);
        reload();
      } catch (err) {
        setMoveError(err instanceof ApiError ? err.message : "Failed to move coach.");
      } finally {
        setMoving(false);
      }
      return;
    }

    if (slot.is_occupied) {
      if (slot.coach_id !== null && slot.coach_number !== null) {
        setMoveError(null);
        setMovingCoach({ coachId: slot.coach_id, coachNumber: slot.coach_number });
      }
      return;
    }

    setSelectedSlotId(slot.slot_id);
  }

  const selectedCoach = coaches?.find((c) => c.coach_id === selectedCoachId);

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">Assembly In</h2>
      <p className="mt-1 text-sm text-slate-500">
        Each Assembly In line has a maximum capacity of 10 coaches. Coaches are auto-assigned to
        you (up to 5 at a time) once Paint Out is recorded — pick a slot for one of your assigned
        coaches below. Need to free up a slot? Click the coach occupying it, then click an empty
        slot to move it there.
      </p>

      <Link
        to="/assembly-in/history"
        className="mt-3 inline-block rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
      >
        Assembly Records →
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

      {movingCoach && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
          <span>
            Moving coach <span className="font-semibold">{movingCoach.coachNumber}</span> — click an empty slot to
            place it{moving && "…"}
          </span>
          <button
            type="button"
            onClick={() => setMovingCoach(null)}
            className="font-medium text-blue-700 underline hover:text-blue-900"
          >
            Cancel
          </button>
        </div>
      )}
      {moveError && <ValidationMessage kind="error" message={moveError} />}

      {lines && (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {lines.map((line) => (
            <div key={line.assembly_in_line_id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">{line.name}</p>
              <p className="text-xs text-slate-500">
                {line.occupied_slots} / {line.total_slots} occupied
              </p>
              <div className="mt-2 grid grid-cols-5 gap-1">
                {line.slots.map((slot) => (
                  <button
                    key={slot.slot_id}
                    type="button"
                    disabled={moving}
                    onClick={() => handleSlotClick(slot)}
                    title={
                      slot.is_occupied
                        ? `Slot ${slot.slot_number} — Coach ${slot.coach_number}${slot.recorded_by ? ` — by ${slot.recorded_by}` : ""} (click to move)`
                        : movingCoach
                          ? `Drop ${movingCoach.coachNumber} in slot ${slot.slot_number}`
                          : `Slot ${slot.slot_number}`
                    }
                    className={`rounded py-1 text-xs font-medium ${
                      slot.is_occupied
                        ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                        : selectedSlotId === slot.slot_id
                          ? "bg-blue-600 text-white"
                          : movingCoach
                            ? "bg-green-100 text-green-800 ring-2 ring-blue-400 hover:bg-green-200"
                            : "bg-green-100 text-green-800 hover:bg-green-200"
                    }`}
                  >
                    {slot.slot_number}
                  </button>
                ))}
              </div>
              {line.slots.some((s) => s.is_occupied) && (
                <div className="mt-2 space-y-0.5 border-t border-slate-100 pt-2">
                  {line.slots
                    .filter((s) => s.is_occupied)
                    .map((s) => (
                      <p key={s.slot_id} className="text-[11px] text-slate-500">
                        Slot {s.slot_number}: <span className="font-medium text-slate-700">{s.coach_number}</span>
                        {s.recorded_by && <> · by {s.recorded_by}</>}
                      </p>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
