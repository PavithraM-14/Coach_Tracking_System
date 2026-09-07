import { useEffect, useState } from "react";
import { createFurnishingIn, getFurnishingInWorklist } from "../api/furnishingIn";
import type { FurnishingInWorklistCoach } from "../types";
import { ApiError } from "../api/client";
import { FieldReadOnly } from "../components/ui/FieldReadOnly";
import { ValidationMessage } from "../components/ui/ValidationMessage";
import { DatePickerField, formatDateForDisplay } from "../components/ui/DatePickerField";

function toLocalDate(datetime: string): Date {
  return new Date(datetime.includes("T") ? datetime : datetime.replace(" ", "T"));
}

export function FurnishingInPage() {
  const [coaches, setCoaches] = useState<FurnishingInWorklistCoach[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedCoachId, setSelectedCoachId] = useState<number | "">("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [remarks, setRemarks] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    getFurnishingInWorklist()
      .then((res) => setCoaches(res.data))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Failed to load coaches."));
  }

  useEffect(() => {
    reload();
  }, []);

  const selectedCoach = coaches?.find((c) => c.coach_id === selectedCoachId);

  function handleCoachChange(value: string) {
    const coachId = value ? Number(value) : "";
    setSelectedCoachId(coachId);
    setFieldError(null);
    setSuccess(null);

    const coach = coaches?.find((c) => c.coach_id === coachId);
    // Pre-fill from the Shell Outturn date — same coach, same event by
    // default — but the Furnishing employee can still change it below.
    setDate(coach ? toLocalDate(coach.shell_outturn_datetime) : undefined);
  }

  async function handleSubmit() {
    setFieldError(null);
    setApiError(null);
    setSuccess(null);

    if (!selectedCoachId) {
      setFieldError("Select a coach.");
      return;
    }
    if (!date) {
      setFieldError("Furnishing In date is required.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createFurnishingIn({
        coach_id: selectedCoachId,
        furnishing_in_date: formatDateForDisplay(date),
        furnishing_in_time: "00:00",
        remarks: remarks || undefined,
      });
      setSuccess(
        `Furnishing In recorded for coach ${result.coach_number} on ${result.furnishing_in_datetime.slice(0, 10)} — now eligible for Paint In.`,
      );
      setSelectedCoachId("");
      setDate(undefined);
      setRemarks("");
      reload();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Failed to record Furnishing In.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold text-slate-800">Furnishing In Entry</h2>
      <p className="mt-1 text-sm text-slate-500">
        Every coach becomes available for Furnishing In (no cap — one queue, one employee) as soon
        as Shell Outturn is recorded. Pick one below — the date starts out matching its Shell
        Outturn date, but you can change it before submitting. Submitting opens the coach up for
        Paint In.
      </p>

      {coaches && (
        <p className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          Pending Furnishing In: {coaches.length}
        </p>
      )}

      {loadError && <p className="mt-4 text-sm text-red-600">{loadError}</p>}

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Coach (Pending)</p>
        <select
          value={selectedCoachId}
          onChange={(e) => handleCoachChange(e.target.value)}
          className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Select a coach</option>
          {coaches?.map((coach) => (
            <option key={coach.coach_id} value={coach.coach_id}>
              {coach.coach_number} — {coach.coach_type}
            </option>
          ))}
        </select>
        {coaches && coaches.length === 0 && (
          <p className="mt-1 text-sm text-slate-500">No coaches currently pending Furnishing In.</p>
        )}
      </div>

      {selectedCoach && (
        <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <FieldReadOnly label="Coach Type" value={selectedCoach.coach_type} />
          <FieldReadOnly label="Plant" value={selectedCoach.plant} />
          <FieldReadOnly label="Production Year" value={selectedCoach.production_year} />
          <FieldReadOnly label="Shell Outturn Date" value={formatDateForDisplay(toLocalDate(selectedCoach.shell_outturn_datetime))} />
          <FieldReadOnly label="Predicted Date" value={selectedCoach.predicted_date ?? "—"} />
        </div>
      )}

      <div className="mt-5 max-w-xs">
        <DatePickerField label="Furnishing In Date" value={date} onChange={setDate} />
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
          {submitting ? "Submitting..." : "Submit Furnishing In"}
        </button>
      </div>
    </div>
  );
}
