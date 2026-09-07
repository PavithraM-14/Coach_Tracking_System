import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { getSchedules, saveSchedule, renameCoachCategory, type SaveScheduleInput } from "../api/admin";
import type { ScheduleRow } from "../types";
import { ApiError } from "../api/client";
import { ValidationMessage } from "../components/ui/ValidationMessage";

const DAY_FIELDS: Array<{ key: keyof SaveScheduleInput; label: string }> = [
  { key: "shell_to_furnishing_days", label: "Shell → Furn." },
  { key: "furnishing_to_paint_in_days", label: "Furn. → Paint In" },
  { key: "paint_in_to_paint_out_days", label: "Paint In → Out" },
  { key: "paint_out_to_assembly_in_days", label: "Paint Out → Assy In" },
  { key: "assembly_in_to_assembly_out_days", label: "Assy In → Out" },
  { key: "assembly_out_to_local_outturn_days", label: "Assy Out → Local Outturn" },
  { key: "local_outturn_to_dispatch_days", label: "Local Outturn → Dispatch" },
  { key: "target_total_days", label: "Total Target" },
];

// One row's edit buffer — all 8 day-counts as strings (so an input can be
// briefly empty while typing) plus save/error state, keyed by coach_type_id.
interface RowEdit {
  values: Record<string, string>;
  saving: boolean;
  error: string | null;
}

function toEdit(row: ScheduleRow): RowEdit {
  const values: Record<string, string> = {};
  for (const f of DAY_FIELDS) {
    values[f.key] = row[f.key] !== null ? String(row[f.key]) : "0";
  }
  return { values, saving: false, error: null };
}

function CategoryRename({ id, name, onRenamed }: { id: number; name: string; onRenamed: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(name);
          setEditing(true);
        }}
        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200"
        title="Click to rename this category"
      >
        {name}
      </button>
    );
  }

  async function save() {
    if (!value.trim()) return;
    setSaving(true);
    try {
      await renameCoachCategory(id, value.trim());
      setEditing(false);
      onRenamed();
    } finally {
      setSaving(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded border border-slate-300 px-1.5 py-0.5 text-xs"
        autoFocus
      />
      <button type="button" onClick={save} disabled={saving} className="text-xs text-blue-600 hover:underline disabled:opacity-50">
        {saving ? "…" : "Save"}
      </button>
      <button type="button" onClick={() => setEditing(false)} className="text-xs text-slate-400 hover:underline">
        Cancel
      </button>
    </span>
  );
}

export function AdminSchedulePage() {
  const [rows, setRows] = useState<ScheduleRow[] | null>(null);
  const [edits, setEdits] = useState<Record<number, RowEdit>>({});
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  function reload() {
    getSchedules()
      .then((res) => {
        setRows(res.data);
        setEdits(Object.fromEntries(res.data.map((r) => [r.coach_type_id, toEdit(r)])));
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Failed to load schedules."));
  }

  useEffect(() => {
    reload();
  }, []);

  const categories = useMemo(() => {
    if (!rows) return [];
    const seen = new Map<number, string>();
    for (const r of rows) seen.set(r.category_id, r.category_name);
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [rows]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
  }, [rows, query]);

  function updateField(coachTypeId: number, field: keyof SaveScheduleInput, value: string) {
    setEdits((prev) => ({
      ...prev,
      [coachTypeId]: { ...prev[coachTypeId], values: { ...prev[coachTypeId].values, [field]: value } },
    }));
  }

  async function handleSave(coachTypeId: number) {
    const edit = edits[coachTypeId];
    if (!edit) return;

    const parsed: Partial<SaveScheduleInput> = {};
    for (const f of DAY_FIELDS) {
      const n = Number(edit.values[f.key]);
      if (!Number.isFinite(n) || n < 0) {
        setEdits((prev) => ({ ...prev, [coachTypeId]: { ...prev[coachTypeId], error: `${f.label} must be a non-negative number.` } }));
        return;
      }
      parsed[f.key] = n;
    }

    setEdits((prev) => ({ ...prev, [coachTypeId]: { ...prev[coachTypeId], saving: true, error: null } }));
    try {
      await saveSchedule({ coach_type_id: coachTypeId, ...(parsed as Omit<SaveScheduleInput, "coach_type_id">) });
      setEdits((prev) => ({ ...prev, [coachTypeId]: { ...prev[coachTypeId], saving: false } }));
    } catch (err) {
      setEdits((prev) => ({
        ...prev,
        [coachTypeId]: {
          ...prev[coachTypeId],
          saving: false,
          error: err instanceof ApiError ? err.message : "Failed to save.",
        },
      }));
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">Target Schedule</h2>
      <p className="mt-1 text-sm text-slate-500">
        Target day-counts per coach type, per stage — used to compute each stage's Predicted Date.
        Imported from ICF's coach schedule; edit and save per row as needed.
      </p>

      {categories.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Categories:</span>
          {categories.map((c) => (
            <CategoryRename key={c.id} id={c.id} name={c.name} onRenamed={reload} />
          ))}
        </div>
      )}

      <div className="relative mt-4 w-72">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400" size={15} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search coach type name or code..."
          className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs"
        />
      </div>

      {loadError && <p className="mt-4 text-sm text-red-600">{loadError}</p>}

      {filtered && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Category</th>
                {DAY_FIELDS.map((f) => (
                  <th key={f.key} className="px-2 py-2 text-center">
                    {f.label}
                  </th>
                ))}
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => {
                const edit = edits[row.coach_type_id];
                if (!edit) return null;
                return (
                  <tr key={row.coach_type_id}>
                    <td className="px-3 py-2 text-xs text-slate-500">{row.code}</td>
                    <td className="px-3 py-2 font-medium text-slate-800">{row.name}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">{row.category_name}</td>
                    {DAY_FIELDS.map((f) => (
                      <td key={f.key} className="px-1 py-1">
                        <input
                          type="number"
                          min={0}
                          value={edit.values[f.key]}
                          onChange={(e) => updateField(row.coach_type_id, f.key, e.target.value)}
                          className="w-16 rounded border border-slate-300 px-1.5 py-1 text-center text-xs"
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleSave(row.coach_type_id)}
                        disabled={edit.saving}
                        className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {edit.saving ? "..." : "Save"}
                      </button>
                      {edit.error && (
                        <div className="mt-1 max-w-[10rem]">
                          <ValidationMessage kind="error" message={edit.error} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
