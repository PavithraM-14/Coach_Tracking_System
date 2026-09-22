import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAssemblyInLines, moveAssemblyCoach } from "../api/assemblyIn";
import type { AssemblyInLine } from "../types";
import { ApiError } from "../api/client";
import { ValidationMessage } from "../components/ui/ValidationMessage";

// Split out of AssemblyInPage — moving an already-placed coach to a
// different slot is a separate, occasional maintenance action, not part of
// recording a new coach's Assembly In.
export function MoveAssemblyCoachPage() {
  const [lines, setLines] = useState<AssemblyInLine[] | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<number | "">("");
  const [selectedSlotId, setSelectedSlotId] = useState<number | "">("");
  const [movingCoach, setMovingCoach] = useState<{ coachId: number; coachNumber: string } | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

  function reload() {
    getAssemblyInLines().then((res) => setLines(res.data));
  }

  useEffect(() => {
    reload();
  }, []);

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
    line.slots.filter((s) => s.is_occupied).map((s) => ({ line, slot: s })),
  );
  const slotsInSelectedLine =
    lines?.find((l) => l.assembly_in_line_id === selectedLineId)?.slots.filter((s) => !s.is_occupied) ?? [];

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">Move Coach — Assembly Lines</h2>
      <p className="mt-1 text-sm text-slate-500">
        Pick up a coach from an occupied slot and drop it into a different line/slot within the
        Assembly In pool — e.g. to free up space for a higher-priority coach.
      </p>

      <Link
        to="/assembly-in"
        className="mt-3 inline-block rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
      >
        ← Back to Assembly In
      </Link>

      {occupiedSlots.length === 0 && lines && (
        <p className="mt-4 text-sm text-slate-500">No coaches currently occupy an Assembly In line slot.</p>
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
                      disabled={moving || movingCoach?.coachId === slot.coach_id}
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

      {movingCoach && (
        <div className="mt-6 max-w-xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
            <span>
              Moving coach <span className="font-semibold">{movingCoach.coachNumber}</span> — pick a
              destination line/slot below, then tap "Move Coach"{moving && "…"}
            </span>
            <button
              type="button"
              onClick={() => setMovingCoach(null)}
              className="font-medium text-blue-700 underline hover:text-blue-900"
            >
              Cancel
            </button>
          </div>
          {moveError && (
            <div className="mt-2">
              <ValidationMessage kind="error" message={moveError} />
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
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

          <button
            type="button"
            onClick={handleConfirmMove}
            disabled={!selectedSlotId || moving}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {moving ? "Moving..." : "Move Coach"}
          </button>
        </div>
      )}
    </div>
  );
}
