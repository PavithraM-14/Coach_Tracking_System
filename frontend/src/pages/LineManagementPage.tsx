import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PaintBucket, Wrench } from "lucide-react";
import {
  createPaintIn,
  getPaintInWorklist,
  getPaintLines,
  setPaintLineActive,
  setPaintSlotActive,
  type VendorCode,
} from "../api/paintIn";
import { getAssemblyInLines, setAssemblyLineActive, setAssemblySlotActive } from "../api/assemblyIn";
import { getMyAssignmentSummary } from "../api/assignments";
import { getLineBlockLog } from "../api/admin";
import type {
  AssemblyInLine,
  AssemblyInLineSlot,
  AssignmentSummary,
  LineBlockLogRow,
  PaintLine,
  PaintLineSlot,
  WorklistCoach,
} from "../types";
import { ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { FieldReadOnly } from "../components/ui/FieldReadOnly";
import { ValidationMessage } from "../components/ui/ValidationMessage";
import { DatePickerField, formatDateForDisplay } from "../components/ui/DatePickerField";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { formatDateTime } from "../utils/dateFormat";

// Local to this file — both pool views need the exact same "confirm before
// blocking/unblocking" flow, so this centralizes the pending-confirmation
// state and renders one ConfirmDialog instead of window.confirm(), which
// looks like a bare browser dialog rather than part of the app.
function useConfirmDialog() {
  const [pending, setPending] = useState<{ message: string; danger: boolean; run: () => void } | null>(null);

  function requestConfirm(message: string, danger: boolean, run: () => void) {
    setPending({ message, danger, run });
  }

  const dialog = (
    <ConfirmDialog
      open={pending !== null}
      title={pending?.danger ? "Block this?" : "Unblock this?"}
      message={pending?.message ?? ""}
      danger={pending?.danger ?? false}
      confirmLabel={pending?.danger ? "Block" : "Unblock"}
      onConfirm={() => {
        pending?.run();
        setPending(null);
      }}
      onCancel={() => setPending(null)}
    />
  );

  return { requestConfirm, dialog };
}

// Shared by both pools' views — shows the audit trail written by
// backend/lib/BlockLog.php every time a line/slot is blocked or unblocked
// (the is_active flag itself carries no history of who/when).
function BlockActivityLog({ poolFamily, refreshKey }: { poolFamily: "PAINT" | "ASSEMBLY"; refreshKey: number }) {
  const [log, setLog] = useState<LineBlockLogRow[] | null>(null);

  useEffect(() => {
    getLineBlockLog(poolFamily).then((res) => setLog(res.data));
  }, [poolFamily, refreshKey]);

  if (!log || log.length === 0) return null;

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800">Recent Block / Unblock Activity</h3>
      <div className="mt-2 divide-y divide-slate-100">
        {log.map((entry, i) => (
          <div key={i} className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-xs">
            <span>
              <span className={entry.action === "BLOCK" ? "font-medium text-red-600" : "font-medium text-green-600"}>
                {entry.action === "BLOCK" ? "Blocked" : "Unblocked"}
              </span>{" "}
              {entry.target_label} <span className="text-slate-400">by {entry.performed_by}</span>
            </span>
            <span className="flex-shrink-0 text-slate-400">{formatDateTime(entry.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Read-only view of the Assembly line pool, for anyone who doesn't do
// Assembly In data entry themselves (Admin, Assembly Admin). Paint's
// equivalent lives in PaintInLines below since a PAINT login can also
// allocate from that same view.
function AssemblyLinesView() {
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "ASSEMBLY_ADMIN";

  const [lines, setLines] = useState<AssemblyInLine[] | null>(null);
  const [bookedCount, setBookedCount] = useState<number | null>(null);
  const [togglingLineId, setTogglingLineId] = useState<number | null>(null);
  const [togglingSlotId, setTogglingSlotId] = useState<number | null>(null);
  const [logRefreshKey, setLogRefreshKey] = useState(0);
  const { requestConfirm, dialog: confirmDialog } = useConfirmDialog();

  function reload() {
    getAssemblyInLines().then((res) => {
      setLines(res.data);
      setBookedCount(res.booked_count);
    });
  }

  useEffect(() => {
    reload();
  }, []);

  function confirmToggle(line: AssemblyInLine) {
    requestConfirm(
      `${line.is_active ? "Block" : "Unblock"} ${line.name}? Coaches currently in it are not affected.`,
      line.is_active,
      () => handleToggle(line),
    );
  }

  async function handleToggle(line: AssemblyInLine) {
    const verb = line.is_active ? "block" : "unblock";
    setTogglingLineId(line.assembly_in_line_id);
    try {
      await setAssemblyLineActive(line.assembly_in_line_id, !line.is_active);
      setLogRefreshKey((k) => k + 1);
      reload();
    } catch {
      window.alert(`Failed to ${verb} ${line.name}.`);
    } finally {
      setTogglingLineId(null);
    }
  }

  function confirmSlotToggle(slot: AssemblyInLineSlot) {
    requestConfirm(`${slot.is_active ? "Block" : "Unblock"} Slot ${slot.slot_number}?`, slot.is_active, () =>
      handleSlotToggle(slot),
    );
  }

  async function handleSlotToggle(slot: AssemblyInLineSlot) {
    const verb = slot.is_active ? "block" : "unblock";
    setTogglingSlotId(slot.slot_id);
    try {
      await setAssemblySlotActive(slot.slot_id, !slot.is_active);
      setLogRefreshKey((k) => k + 1);
      reload();
    } catch {
      window.alert(`Failed to ${verb} Slot ${slot.slot_number}.`);
    } finally {
      setTogglingSlotId(null);
    }
  }

  return (
    <div>
      <p className="mt-1 text-sm text-slate-500">
        Read-only view of current line and slot occupancy. Allocation is performed by Assembly
        Production role users.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          to="/assembly-in/history"
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          Assembly Records →
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
            <div
              key={line.assembly_in_line_id}
              className={`rounded-xl border p-3 shadow-sm ${
                line.is_active ? "border-slate-200 bg-white" : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">{line.name}</p>
                {!line.is_active && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                    Blocked
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {line.occupied_slots} / {line.total_slots} occupied
              </p>
              <div className="mt-2 grid grid-cols-5 gap-1">
                {line.slots.map((slot) => {
                  const clickableToToggle =
                    canManage && line.is_active && !slot.is_occupied && togglingSlotId !== slot.slot_id;
                  return (
                    <button
                      key={slot.slot_id}
                      type="button"
                      disabled={slot.is_occupied || !clickableToToggle}
                      onClick={() => clickableToToggle && confirmSlotToggle(slot)}
                      title={
                        slot.is_occupied
                          ? `Slot ${slot.slot_number} — Coach ${slot.coach_number}${slot.recorded_by ? ` — by ${slot.recorded_by}` : ""}`
                          : !slot.is_active
                            ? `Slot ${slot.slot_number} — Blocked${clickableToToggle ? " (click to unblock)" : ""}`
                            : `Slot ${slot.slot_number}${clickableToToggle ? " (click to block)" : ""}`
                      }
                      className={`rounded py-1 text-xs font-medium ${
                        slot.is_occupied
                          ? "cursor-not-allowed bg-orange-100 text-orange-700"
                          : !line.is_active
                            ? "cursor-default bg-slate-200 text-slate-400"
                            : !slot.is_active
                              ? `bg-red-100 text-red-700 ${clickableToToggle ? "cursor-pointer hover:bg-red-200" : "cursor-default"}`
                              : `bg-green-100 text-green-800 ${clickableToToggle ? "cursor-pointer hover:bg-green-200" : "cursor-default"}`
                      }`}
                    >
                      {slot.slot_number}
                    </button>
                  );
                })}
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => confirmToggle(line)}
                  disabled={togglingLineId === line.assembly_in_line_id}
                  className={`mt-2 w-full rounded-lg px-2 py-1 text-xs font-medium disabled:opacity-50 ${
                    line.is_active
                      ? "bg-red-50 text-red-700 hover:bg-red-100"
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                  }`}
                >
                  {togglingLineId === line.assembly_in_line_id
                    ? "Updating..."
                    : line.is_active
                      ? "Block Line"
                      : "Unblock Line"}
                </button>
              )}
              {canManage && line.is_active && (
                <p className="mt-1 text-center text-[10px] text-slate-400">Click a green slot to block just that slot</p>
              )}
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

      {canManage && <BlockActivityLog poolFamily="ASSEMBLY" refreshKey={logRefreshKey} />}
      {confirmDialog}
    </div>
  );
}

// Paint In and Paint Out now share one physical line pool — this is that
// pool's view. A PAINT login gets the full allocation form (it's the same
// page a Paint worker uses to record Paint In); everyone else viewing Line
// Management (Admin, Paint Admin) gets a read-only grid.
function PaintInLines() {
  const { user } = useAuth();
  const canAllocate = user?.role === "PAINT";
  const canManage = user?.role === "ADMIN" || user?.role === "PAINT_ADMIN";

  const [lines, setLines] = useState<PaintLine[] | null>(null);
  const [bookedCount, setBookedCount] = useState<number | null>(null);
  const [coaches, setCoaches] = useState<WorklistCoach[] | null>(null);
  const [summary, setSummary] = useState<AssignmentSummary | null>(null);
  const [selectedCoachId, setSelectedCoachId] = useState<number | "">("");
  const [selectedSlotId, setSelectedSlotId] = useState<number | "">("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [vendor, setVendor] = useState<VendorCode | "">("");
  const [remarks, setRemarks] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [togglingLineId, setTogglingLineId] = useState<number | null>(null);
  const [togglingSlotId, setTogglingSlotId] = useState<number | null>(null);
  const [logRefreshKey, setLogRefreshKey] = useState(0);
  const { requestConfirm, dialog: confirmDialog } = useConfirmDialog();

  function confirmToggle(line: PaintLine) {
    requestConfirm(
      `${line.is_active ? "Block" : "Unblock"} ${line.name}? Coaches currently in it are not affected.`,
      line.is_active,
      () => handleToggle(line),
    );
  }

  async function handleToggle(line: PaintLine) {
    const verb = line.is_active ? "block" : "unblock";
    setTogglingLineId(line.paint_line_id);
    try {
      await setPaintLineActive(line.paint_line_id, !line.is_active);
      setLogRefreshKey((k) => k + 1);
      reload();
    } catch {
      window.alert(`Failed to ${verb} ${line.name}.`);
    } finally {
      setTogglingLineId(null);
    }
  }

  function confirmSlotToggle(slot: PaintLineSlot) {
    requestConfirm(`${slot.is_active ? "Block" : "Unblock"} Slot ${slot.slot_number}?`, slot.is_active, () =>
      handleSlotToggle(slot),
    );
  }

  async function handleSlotToggle(slot: PaintLineSlot) {
    const verb = slot.is_active ? "block" : "unblock";
    setTogglingSlotId(slot.slot_id);
    try {
      await setPaintSlotActive(slot.slot_id, !slot.is_active);
      setLogRefreshKey((k) => k + 1);
      reload();
    } catch {
      window.alert(`Failed to ${verb} Slot ${slot.slot_number}.`);
    } finally {
      setTogglingSlotId(null);
    }
  }

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
    if (!vendor) {
      setFieldError("Select a vendor.");
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
        vendor,
      });
      setSuccess(
        `Paint In recorded for coach ${result.coach_number} on ${result.paint_line}, slot ${result.slot_number}.`,
      );
      setSelectedCoachId("");
      setSelectedSlotId("");
      setDate(undefined);
      setVendor("");
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
          Paint Records →
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
            <div
              key={line.paint_line_id}
              className={`rounded-xl border p-3 shadow-sm ${
                line.is_active ? "border-slate-200 bg-white" : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">{line.name}</p>
                {!line.is_active && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                    Blocked
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {line.occupied_slots} / {line.total_slots} occupied
              </p>
              <div className="mt-2 grid grid-cols-5 gap-1">
                {line.slots.map((slot) => {
                  const blockedIndividually = !slot.is_active && line.is_active;
                  const clickableToToggle =
                    canManage && line.is_active && !slot.is_occupied && togglingSlotId !== slot.slot_id;
                  const clickableToSelect = canAllocate && line.is_active && slot.is_active && !slot.is_occupied;
                  return (
                    <button
                      key={slot.slot_id}
                      type="button"
                      disabled={slot.is_occupied || (!clickableToToggle && !clickableToSelect)}
                      onClick={() => {
                        if (clickableToToggle) confirmSlotToggle(slot);
                        else if (clickableToSelect) setSelectedSlotId(slot.slot_id);
                      }}
                      title={
                        slot.is_occupied
                          ? `Slot ${slot.slot_number} — Coach ${slot.coach_number}${slot.recorded_by ? ` — by ${slot.recorded_by}` : ""}`
                          : blockedIndividually
                            ? `Slot ${slot.slot_number} — Blocked${clickableToToggle ? " (click to unblock)" : ""}`
                            : `Slot ${slot.slot_number}${clickableToToggle ? " (click to block)" : ""}`
                      }
                      className={`rounded py-1 text-xs font-medium ${
                        slot.is_occupied
                          ? "cursor-not-allowed bg-orange-100 text-orange-700"
                          : !line.is_active
                            ? "cursor-not-allowed bg-slate-200 text-slate-400"
                            : blockedIndividually
                              ? `bg-red-100 text-red-700 ${clickableToToggle ? "cursor-pointer hover:bg-red-200" : "cursor-default"}`
                              : selectedSlotId === slot.slot_id
                                ? "bg-blue-600 text-white"
                                : clickableToSelect || clickableToToggle
                                  ? "cursor-pointer bg-green-100 text-green-800 hover:bg-green-200"
                                  : "cursor-default bg-green-100 text-green-800"
                      }`}
                    >
                      {slot.slot_number}
                    </button>
                  );
                })}
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => confirmToggle(line)}
                  disabled={togglingLineId === line.paint_line_id}
                  className={`mt-2 w-full rounded-lg px-2 py-1 text-xs font-medium disabled:opacity-50 ${
                    line.is_active
                      ? "bg-red-50 text-red-700 hover:bg-red-100"
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                  }`}
                >
                  {togglingLineId === line.paint_line_id
                    ? "Updating..."
                    : line.is_active
                      ? "Block Line"
                      : "Unblock Line"}
                </button>
              )}
              {canManage && line.is_active && (
                <p className="mt-1 text-center text-[10px] text-slate-400">Click a green slot to block just that slot</p>
              )}
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

      {canManage && <BlockActivityLog poolFamily="PAINT" refreshKey={logRefreshKey} />}

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

          <div className="mt-4 max-w-xs">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Vendor</p>
            <select
              value={vendor}
              onChange={(e) => setVendor(e.target.value as VendorCode | "")}
              className="mt-0.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select a vendor</option>
              <option value="ICF">ICF</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
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
      {confirmDialog}
    </div>
  );
}

// Paint In/Out share one line pool, and so do Assembly In/Out (see Paint
// Records / Assembly Records for the combined history) — so there's only
// ever two pools to look at, not four.
const TABS = [
  { key: "paint", label: "Paint Lines", icon: PaintBucket },
  { key: "assembly", label: "Assembly Lines", icon: Wrench },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function LineManagementPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>("paint");

  // Paint employees only ever do Paint In here, so they get the focused
  // single view with no tab bar.
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
      ? TABS.filter((t) => t.key === "paint")
      : user?.role === "ASSEMBLY_ADMIN"
        ? TABS.filter((t) => t.key === "assembly")
        : TABS;
  const activeTab = visibleTabs.some((t) => t.key === tab) ? tab : visibleTabs[0].key;

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">Line Management</h2>
      {visibleTabs.length > 1 && (
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
      )}

      {activeTab === "paint" && <PaintInLines />}
      {activeTab === "assembly" && <AssemblyLinesView />}
    </div>
  );
}
