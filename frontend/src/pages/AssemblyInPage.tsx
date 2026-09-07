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
  const [selectedLineId, setSelectedLineId] = useState<number | "">("");
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

  function beginMove(slot: { coach_id: number | null; coach_number: string | null }) {
    if (slot.coach_id === null || slot.coach_number === null) return;
    setMoveError(null);
    setSelectedLineId("");
    setSelectedSlotId("");
    setMovingCoach({ coachId: slot.coach_id, coachNumber: slot.coach_number });
  }

  async function handleConfirmMove() {
    if (!movingCoach || !selectedSlotId) return;
    setMoveError(null);
    setMoving(true);
    try {
      await moveAssemblyCoach({ coach_id: movingCoach.coachId, to_slot_id: selectedSlotId });
      setMovingCoach(null);
      setSelectedLineId("");
      setSelectedSlotId("");
      reload();
    } catch (err) {
      setMoveError(err instanceof ApiError ? err.message : "Failed to move coach.");
    } finally {
      setMoving(false);
    }
  }

  const occupiedSlots = (lines ?? []).flatMap((line) =>
    line.slots
      .filter((s) => s.is_occupied)
      .map((s) => ({ line, slot: s })),
  );

  const selectedCoach = coaches?.find((c) => c.coach_id === selectedCoachId);
  const slotsInSelectedLine =
    lines?.find((l) => l.assembly_in_line_id === selectedLineId)?.slots.filter((s) => !s.is_occupied) ?? [];

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">Assembly In</h2>
      <p className="mt-1 text-sm text-slate-500">
        Each Assembly In line has a maximum capacity of 10 coaches. Coaches are auto-assigned to
        you (up to 5 at a time) once Paint Out is recorded — use the Line/Slot dropdowns below to
        pick a spot. Need to free up a slot? Tap "Move" next to the occupied coach, pick a
        destination line/slot above, then tap "Move Coach" to confirm.
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
      </div>

      {movingCoach && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
          <span>
            Moving coach <span className="font-semibold">{movingCoach.coachNumber}</span> — pick a destination
            line/slot below, then tap "Move Coach"{moving && "…"}
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

      {movingCoach && (
        <button
          type="button"
          onClick={handleConfirmMove}
          disabled={!selectedSlotId || moving}
          className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {moving ? "Moving..." : "Move Coach"}
        </button>
      )}

      {occupiedSlots.length > 0 && (
        <div className="mt-4 max-w-xl overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Line</th>
                <th className="px-3 py-2">Slot</th>
                <th className="px-3 py-2">Coach</th>
                <th className="px-3 py-2">By</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {occupiedSlots.map(({ line, slot }) => (
                <tr key={slot.slot_id} className="border-b border-slate-50 last:border-0">
                  <td className="px-3 py-2 text-slate-700">{line.name}</td>
                  <td className="px-3 py-2 text-slate-700">{slot.slot_number}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{slot.coach_number}</td>
                  <td className="px-3 py-2 text-slate-500">{slot.recorded_by ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      disabled={moving || (movingCoach?.coachId === slot.coach_id)}
                      onClick={() => beginMove(slot)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Move
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
