import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PaintBucket, Wrench } from "lucide-react";
import { createPaintIn, getPaintInWorklist, getPaintLines } from "../api/paintIn";
import { getPaintOutLines } from "../api/paintOut";
import { getAssemblyInLines } from "../api/assemblyIn";
import { getAssemblyOutLines } from "../api/assemblyOut";
import { getMyAssignmentSummary } from "../api/assignments";
import type {
  AssemblyInLine,
  AssemblyOutLine,
  AssignmentSummary,
  PaintLine,
  PaintOutLine,
  WorklistCoach,
} from "../types";
import { ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { FieldReadOnly } from "../components/ui/FieldReadOnly";
import { ValidationMessage } from "../components/ui/ValidationMessage";
import { DatePickerField, formatDateForDisplay } from "../components/ui/DatePickerField";

// Admin's read-only view of a stage's line/slot occupancy — no allocation
// form, since allocation is only ever done from that stage's own role page
// (Paint Out, Assembly In, Assembly Out). Generic over the three structurally
// identical line/slot shapes.
function ReadOnlyLines<TLine extends { name: string; total_slots: number; occupied_slots: number }>({
  fetchLines,
  recordsHref,
  recordsLabel,
  description,
  getKey,
  getSlots,
}: {
  fetchLines: () => Promise<{ data: TLine[]; booked_count: number }>;
  recordsHref: string;
  recordsLabel: string;
  description: string;
  getKey: (line: TLine) => number;
  getSlots: (line: TLine) => Array<{ slot_id: number; slot_number: number; is_occupied: boolean; coach_number: string | null }>;
}) {
  const [lines, setLines] = useState<TLine[] | null>(null);
  const [bookedCount, setBookedCount] = useState<number | null>(null);

  useEffect(() => {
    fetchLines().then((res) => {
      setLines(res.data);
      setBookedCount(res.booked_count);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <p className="mt-1 text-sm text-slate-500">{description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link to={recordsHref} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
          {recordsLabel} →
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {bookedCount !== null && (
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            Booked (system-wide): {bookedCount} coaches assigned, awaiting slot placement
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
            <div key={getKey(line)} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">{line.name}</p>
              <p className="text-xs text-slate-500">
                {line.occupied_slots} / {line.total_slots} occupied
              </p>
              <div className="mt-2 grid grid-cols-5 gap-1">
                {getSlots(line).map((slot) => (
                  <button
                    key={slot.slot_id}
                    type="button"
                    disabled
                    title={slot.is_occupied ? `Occupied by ${slot.coach_number}` : `Slot ${slot.slot_number}`}
                    className={`cursor-default rounded py-1 text-xs font-medium ${
                      slot.is_occupied ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-800"
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
    </div>
  );
}

function PaintOutLinesView() {
  return (
    <ReadOnlyLines<PaintOutLine>
      fetchLines={getPaintOutLines}
      recordsHref="/paint-out/history"
      recordsLabel="Paint Out Records"
      description="Read-only view of current line and slot occupancy. Allocation is performed by Paint role users."
      getKey={(l) => l.paint_out_line_id}
      getSlots={(l) => l.slots}
    />
  );
}

function AssemblyInLinesView() {
  return (
    <ReadOnlyLines<AssemblyInLine>
      fetchLines={getAssemblyInLines}
      recordsHref="/assembly-in/history"
      recordsLabel="Assembly In Records"
      description="Read-only view of current line and slot occupancy. Allocation is performed by Assembly Production role users."
      getKey={(l) => l.assembly_in_line_id}
      getSlots={(l) => l.slots}
    />
  );
}

function AssemblyOutLinesView() {
  return (
    <ReadOnlyLines<AssemblyOutLine>
      fetchLines={getAssemblyOutLines}
      recordsHref="/assembly-out/history"
      recordsLabel="Assembly Out Records"
      description="Read-only view of current line and slot occupancy. Allocation is performed by Assembly Production role users."
      getKey={(l) => l.assembly_out_line_id}
      getSlots={(l) => l.slots}
    />
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
      <p className="mt-1 text-sm text-slate-500">
        {canAllocate
          ? "Each paint line has a maximum capacity of 10 coaches. Coaches are auto-assigned to you (up to 5 at a time) once Furnishing In is recorded — pick a slot for one of your assigned coaches below."
          : "Read-only view of current line and slot occupancy. Allocation is performed by Paint role users."}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          to="/paint-in/history"
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          Paint In Records →
        </Link>
        <Link
          to="/paint-out/history"
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          Paint Out Records →
        </Link>
        <Link
          to="/assembly-in/history"
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          Assembly In Records →
        </Link>
        <Link
          to="/assembly-out/history"
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          Assembly Out Records →
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {canAllocate && summary && (
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            Booked: {summary.assigned_count} / {summary.capacity ?? "∞"} assigned to you
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
      )}
    </div>
  );
}

const TABS = [
  { key: "paint-in", label: "Paint In Lines", icon: PaintBucket },
  { key: "paint-out", label: "Paint Out Lines", icon: PaintBucket },
  { key: "assembly-in", label: "Assembly In Lines", icon: Wrench },
  { key: "assembly-out", label: "Assembly Out Lines", icon: Wrench },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function LineManagementPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>("paint-in");

  // Paint employees only ever do Paint In here, so they get the focused
  // single view with no tab bar. Everyone else viewing this page is some
  // flavor of admin, read-only across the line types their shop owns:
  // Admin sees all four, Paint Admin sees Paint In/Out, Assembly Admin sees
  // Assembly In/Out.
  if (user?.role === "PAINT") {
    return (
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Line Management</h2>
        <PaintInLines />
      </div>
    );
  }

  const visibleTabs =
    user?.role === "PAINT_ADMIN"
      ? TABS.filter((t) => t.key === "paint-in" || t.key === "paint-out")
      : user?.role === "ASSEMBLY_ADMIN"
        ? TABS.filter((t) => t.key === "assembly-in" || t.key === "assembly-out")
        : TABS;
  const activeTab = visibleTabs.some((t) => t.key === tab) ? tab : visibleTabs[0].key;

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">Line Management</h2>
      <div className="mt-3 flex gap-1 border-b border-slate-200">
        {visibleTabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium ${
                activeTab === t.key ? "border-b-2 border-blue-600 text-blue-700" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === "paint-in" && <PaintInLines />}
      {activeTab === "paint-out" && <PaintOutLinesView />}
      {activeTab === "assembly-in" && <AssemblyInLinesView />}
      {activeTab === "assembly-out" && <AssemblyOutLinesView />}
    </div>
  );
}
