import { useEffect, useMemo, useState } from "react";
import { createShellOutturnBatch, getShellOutturnWorklist } from "../api/shellOutturn";
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
  const [selectedCoachIds, setSelectedCoachIds] = useState<number[]>([]);
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
  const selectedCoaches = selectedGroup?.coaches.filter((c) => selectedCoachIds.includes(c.coach_id)) ?? [];
  const allSelected = !!selectedGroup && selectedCoachIds.length === selectedGroup.coaches.length;

  function handleBoChange(key: string) {
    setSelectedBoKey(key);
    setSelectedCoachIds([]);
    setFieldError(null);
    setSuccess(null);
  }

  function toggleCoach(coachId: number) {
    setSelectedCoachIds((prev) =>
      prev.includes(coachId) ? prev.filter((id) => id !== coachId) : [...prev, coachId],
    );
  }

  function toggleSelectAll() {
    if (!selectedGroup) return;
    setSelectedCoachIds(allSelected ? [] : selectedGroup.coaches.map((c) => c.coach_id));
  }

  async function handleSubmit() {
    setFieldError(null);
    setApiError(null);
    setSuccess(null);

    if (!selectedGroup) {
      setFieldError("Select a BO / production order.");
      return;
    }
    if (selectedCoachIds.length === 0) {
      setFieldError("Select at least one coach.");
      return;
    }
    if (!date) {
      setFieldError("Shell Outturn date is required.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createShellOutturnBatch({
        coach_ids: selectedCoachIds,
        outturn_date: formatDateForDisplay(date),
        outturn_time: "00:00",
        remarks: remarks || undefined,
      });
      const coachList = result.results.map((r) => r.coach_number).join(", ");
      setSuccess(
        `Shell Outturn recorded for ${result.results.length} coach${result.results.length === 1 ? "" : "es"} ` +
          `(${coachList}) on ${result.outturn_datetime.slice(0, 10)} — queued for Furnishing In.`,
      );
      setSelectedCoachIds([]);
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
      <h2 className="text-lg font-semibold text-slate-800">Shell Outturn Entry</h2>
      <p className="mt-1 text-sm text-slate-500">
        Select one or more coaches from the same BO to record Shell Outturn together. Each coach is
        then queued to a skilled Furnishing employee, who records Furnishing In next.
      </p>

      {loadError && <p className="mt-4 text-sm text-red-600">{loadError}</p>}

      <div className="mt-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Select BO</p>
        <select
          value={selectedBoKey}
          onChange={(e) => handleBoChange(e.target.value)}
          className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
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
        <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <FieldReadOnly label="Coach Type" value={selectedGroup.coaches[0].coach_type} />
          <FieldReadOnly label="Plant" value={selectedGroup.coaches[0].plant} />
          <FieldReadOnly label="Production Year" value={selectedGroup.coaches[0].production_year} />
          <FieldReadOnly label="Installation No." value={selectedGroup.coaches[0].installation_no} />
        </div>
      )}

      {selectedGroup && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Coach Numbers ({selectedCoachIds.length} of {selectedGroup.coaches.length} selected)
            </p>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
          </div>
          <div className="mt-1 grid max-h-56 grid-cols-3 gap-2 overflow-y-auto rounded-lg border border-slate-300 bg-white p-3 sm:grid-cols-4">
            {selectedGroup.coaches.map((coach) => (
              <label key={coach.coach_id} className="flex items-center gap-1.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selectedCoachIds.includes(coach.coach_id)}
                  onChange={() => toggleCoach(coach.coach_id)}
                />
                {coach.coach_number}
              </label>
            ))}
          </div>
        </div>
      )}

      {selectedCoaches.length > 0 && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Selected Coaches</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {selectedCoaches.map((coach) => (
              <span key={coach.coach_id} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                {coach.coach_number} <span className="text-slate-400">({coach.serial_no})</span>
              </span>
            ))}
          </div>
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
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
