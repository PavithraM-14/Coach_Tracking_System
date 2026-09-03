import { useEffect, useState } from "react";
import { PaintBucket, Wrench, Construction } from "lucide-react";
import { createPaintIn, getPaintInWorklist, getPaintLines } from "../api/paintIn";
import { getMyAssignmentSummary } from "../api/assignments";
import type { AssignmentSummary, PaintLine, WorklistCoach } from "../types";
import { ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { FieldReadOnly } from "../components/ui/FieldReadOnly";
import { ValidationMessage } from "../components/ui/ValidationMessage";
import { DatePickerField, formatDateForDisplay } from "../components/ui/DatePickerField";

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
      <Construction className="text-slate-300" size={36} />
      <p className="mt-3 text-sm font-medium text-slate-600">{label} is not built yet</p>
      <p className="mt-1 max-w-sm text-xs text-slate-400">
        Planned for a future phase, following the same line/slot capacity model as Paint In.
      </p>
    </div>
  );
}

function PaintInLines() {
  const { user } = useAuth();
  const canAllocate = user?.role === "PAINT";

  const [lines, setLines] = useState<PaintLine[] | null>(null);
  const [bookedCount, setBookedCount] = useState<number | null>(null);
  const [coaches, setCoaches] = useState<WorklistCoach[] | null>(null);
  const [summary, setSummary] = useState<AssignmentSummary | null>(null);
  const [selectedCoachId, setSelectedCoachId] = useState<number | "">("");
  const [selectedSlotId, setSelectedSlotId] = useState<number | "">("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("09:00");
  const [remarks, setRemarks] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    getPaintLines().then((res) => {
      setLines(res.data);
      setBookedCount(res.booked_count);
    });
    if (canAllocate) {
      getPaintInWorklist().then((res) => setCoaches(res.data));
      getMyAssignmentSummary().then(setSummary);
    }
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
        paint_in_time: time,
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
      <p className="mt-1 text-sm text-slate-500">
        {canAllocate
          ? "Each paint line has a maximum capacity of 10 coaches. Coaches are auto-assigned to you (up to 5 at a time) once Furnishing Out is recorded — pick a slot for one of your assigned coaches below."
          : "Read-only view of current line and slot occupancy. Allocation is performed by Paint role users."}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {canAllocate && summary && (
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            Booked: {summary.assigned_count} / {summary.capacity} assigned to you
            {summary.queued_count > 0 && ` · ${summary.queued_count} queued`}
          </span>
        )}
        {!canAllocate && bookedCount !== null && (
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            Booked (system-wide): {bookedCount} coaches assigned, awaiting slot placement
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Available
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> Occupied
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
                    disabled={slot.is_occupied || !canAllocate}
                    onClick={() => canAllocate && setSelectedSlotId(slot.slot_id)}
                    title={slot.is_occupied ? `Occupied by ${slot.coach_number}` : `Slot ${slot.slot_number}`}
                    className={`rounded py-1 text-xs font-medium ${
                      slot.is_occupied
                        ? "cursor-not-allowed bg-orange-100 text-orange-700"
                        : selectedSlotId === slot.slot_id
                          ? "bg-blue-600 text-white"
                          : canAllocate
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "cursor-default bg-green-100 text-green-800"
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

      {canAllocate && (
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
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-4">
          <DatePickerField label="Paint In Date" value={date} onChange={setDate} />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Paint In Time</p>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-0.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
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
      )}
    </div>
  );
}

const TABS = [
  { key: "paint-in", label: "Paint In Lines", icon: PaintBucket },
  { key: "paint-out", label: "Paint Out Lines", icon: PaintBucket },
  { key: "assembly-in", label: "Assembly In Lines", icon: Wrench },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function LineManagementPage() {
  const [tab, setTab] = useState<TabKey>("paint-in");

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">Line Management</h2>
      <div className="mt-3 flex gap-1 border-b border-slate-200">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium ${
                tab === t.key ? "border-b-2 border-blue-600 text-blue-700" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "paint-in" && <PaintInLines />}
      {tab === "paint-out" && <ComingSoon label="Paint Out Lines" />}
      {tab === "assembly-in" && <ComingSoon label="Assembly In Lines" />}
    </div>
  );
}
