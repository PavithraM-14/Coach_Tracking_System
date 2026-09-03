import { useEffect, useMemo, useState } from "react";
import { createShellOutturn, getShellOutturnWorklist } from "../api/shellOutturn";
import type { WorklistCoach } from "../types";
import { ApiError } from "../api/client";
import { FieldReadOnly } from "../components/ui/FieldReadOnly";
import { ValidationMessage } from "../components/ui/ValidationMessage";
import { DatePickerField, formatDateForDisplay } from "../components/ui/DatePickerField";

interface BoGroup {
  key: string;
  label: string;
  coaches: WorklistCoach[];
}

function groupByBo(coaches: WorklistCoach[]): BoGroup[] {
  const groups = new Map<string, WorklistCoach[]>();
  for (const coach of coaches) {
    const key = `${coach.bo_number}-${coach.bo_item}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(coach);
  }

  return Array.from(groups.entries()).map(([key, group]) => {
    const nums = group.map((c) => c.coach_number).sort((a, b) => Number(a) - Number(b));
    const first = group[0];
    const label = `${first.plant} | ${first.production_year} | ${key} | ${first.coach_type} | ${group.length} pending | ${nums[0]}–${nums[nums.length - 1]}`;
    return { key, label, coaches: group };
  });
}

export function ShellOutturnEntryPage() {
  const [worklist, setWorklist] = useState<WorklistCoach[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedBoKey, setSelectedBoKey] = useState("");
  const [selectedCoachId, setSelectedCoachId] = useState<number | "">("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [remarks, setRemarks] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    getShellOutturnWorklist()
      .then((res) => setWorklist(res.data))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Failed to load coaches."));
  }

  useEffect(() => {
    reload();
  }, []);

  const boGroups = useMemo(() => groupByBo(worklist ?? []), [worklist]);
  const selectedGroup = boGroups.find((g) => g.key === selectedBoKey);
  const selectedCoach = selectedGroup?.coaches.find((c) => c.coach_id === selectedCoachId);

  function handleBoChange(key: string) {
    setSelectedBoKey(key);
    setSelectedCoachId("");
    setFieldError(null);
    setSuccess(null);
  }

  async function handleSubmit() {
    setFieldError(null);
    setApiError(null);
    setSuccess(null);

    if (!selectedGroup) {
      setFieldError("Select a BO / production order.");
      return;
    }
    if (!selectedCoachId) {
      setFieldError("Select a coach.");
      return;
    }
    if (!date) {
      setFieldError("Shell Outturn date is required.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createShellOutturn({
        coach_id: selectedCoachId,
        outturn_date: formatDateForDisplay(date),
        outturn_time: "00:00",
        remarks: remarks || undefined,
      });
      setSuccess(
        `Shell Outturn recorded for coach ${result.coach_number} on ${result.outturn_datetime.slice(0, 10)} — Furnishing In opened.`,
      );
      setSelectedCoachId("");
      setDate(undefined);
      setRemarks("");
      reload();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Failed to record Shell Outturn.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold text-slate-800">CCIS Shell OT Entry</h2>
      <p className="mt-1 text-sm text-slate-500">
        Shell Outturn and Furnishing In share the same date/time — submitting this form opens
        Furnishing In automatically.
      </p>

      {loadError && <p className="mt-4 text-sm text-red-600">{loadError}</p>}

      <div className="mt-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Select BO</p>
        <select
          value={selectedBoKey}
          onChange={(e) => handleBoChange(e.target.value)}
          className="mt-0.5 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Select BO</option>
          {boGroups.map((group) => (
            <option key={group.key} value={group.key}>
              {group.label}
            </option>
          ))}
        </select>
        {worklist && boGroups.length === 0 && (
          <p className="mt-1 text-sm text-slate-500">No coaches pending Shell Outturn.</p>
        )}
      </div>

      {selectedGroup && (
        <div className="mt-4 grid grid-cols-2 gap-4 rounded border border-slate-200 bg-white p-4">
          <FieldReadOnly label="Coach Type" value={selectedGroup.coaches[0].coach_type} />
          <FieldReadOnly label="Plant" value={selectedGroup.coaches[0].plant} />
          <FieldReadOnly label="Production Year" value={selectedGroup.coaches[0].production_year} />
          <FieldReadOnly label="Installation No." value={selectedGroup.coaches[0].installation_no} />
        </div>
      )}

      {selectedGroup && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Coach Number</p>
          <select
            value={selectedCoachId}
            onChange={(e) => setSelectedCoachId(e.target.value ? Number(e.target.value) : "")}
            className="mt-0.5 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Select a coach</option>
            {selectedGroup.coaches.map((coach) => (
              <option key={coach.coach_id} value={coach.coach_id}>
                {coach.coach_number}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedCoach && (
        <div className="mt-3 rounded border border-slate-200 bg-white p-3">
          <FieldReadOnly label="Selected Coach" value={`${selectedCoach.coach_number} (${selectedCoach.serial_no})`} />
        </div>
      )}

      <div className="mt-5 max-w-xs">
        <DatePickerField label="Shell Outturn Date" value={date} onChange={setDate} />
      </div>
      {fieldError && <ValidationMessage kind="error" message={fieldError} />}

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Remarks (optional)</p>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={2}
          className="mt-0.5 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {apiError && <ValidationMessage kind="error" message={apiError} />}
      {success && <ValidationMessage kind="success" message={success} />}

      <div className="mt-5">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
