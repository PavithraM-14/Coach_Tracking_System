import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { getPaintTypeAssignments, savePaintTypeAssignments } from "../api/paintAssignments";
import type { PaintMatrixCell, PaintMatrixCoachType, PaintMatrixUser } from "../types";
import { ApiError } from "../api/client";
import { ValidationMessage } from "../components/ui/ValidationMessage";

type Cell = { can_in: boolean; can_out: boolean };
// grid[coach_type_id][user_id] = Cell
type Grid = Record<number, Record<number, Cell>>;

function emptyCell(): Cell {
  return { can_in: false, can_out: false };
}

function buildGrid(coachTypes: PaintMatrixCoachType[], users: PaintMatrixUser[], cells: PaintMatrixCell[]): Grid {
  const grid: Grid = {};
  for (const ct of coachTypes) {
    grid[ct.id] = {};
    for (const u of users) {
      grid[ct.id][u.id] = emptyCell();
    }
  }
  for (const cell of cells) {
    if (grid[cell.coach_type_id] && grid[cell.coach_type_id][cell.user_id]) {
      grid[cell.coach_type_id][cell.user_id] = { can_in: cell.can_in, can_out: cell.can_out };
    }
  }
  return grid;
}

export function PaintAssignmentMatrixPage() {
  const [coachTypes, setCoachTypes] = useState<PaintMatrixCoachType[] | null>(null);
  const [users, setUsers] = useState<PaintMatrixUser[] | null>(null);
  const [grid, setGrid] = useState<Grid>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reload() {
    setLoadError(null);
    getPaintTypeAssignments()
      .then((res) => {
        setCoachTypes(res.coach_types);
        setUsers(res.users);
        setGrid(buildGrid(res.coach_types, res.users, res.assignments));
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Failed to load the assignment matrix."));
  }

  useEffect(() => {
    reload();
  }, []);

  function setCell(coachTypeId: number, userId: number, next: Cell) {
    setGrid((prev) => ({
      ...prev,
      [coachTypeId]: { ...prev[coachTypeId], [userId]: next },
    }));
  }

  function toggleIn(coachTypeId: number, userId: number) {
    const cur = grid[coachTypeId]?.[userId] ?? emptyCell();
    setCell(coachTypeId, userId, { ...cur, can_in: !cur.can_in });
  }

  function toggleOut(coachTypeId: number, userId: number) {
    const cur = grid[coachTypeId]?.[userId] ?? emptyCell();
    setCell(coachTypeId, userId, { ...cur, can_out: !cur.can_out });
  }

  // Row-level bulk actions: apply to every employee for one coach type.
  function setRow(coachTypeId: number, next: Cell) {
    if (!users) return;
    setGrid((prev) => {
      const row: Record<number, Cell> = {};
      for (const u of users) row[u.id] = { ...next };
      return { ...prev, [coachTypeId]: row };
    });
  }

  // Column-level bulk actions: apply to every coach type for one employee.
  function setColumn(userId: number, next: Cell) {
    if (!coachTypes) return;
    setGrid((prev) => {
      const updated: Grid = { ...prev };
      for (const ct of coachTypes) {
        updated[ct.id] = { ...updated[ct.id], [userId]: { ...next } };
      }
      return updated;
    });
  }

  const flatCells = useMemo((): PaintMatrixCell[] => {
    if (!coachTypes || !users) return [];
    const out: PaintMatrixCell[] = [];
    for (const ct of coachTypes) {
      for (const u of users) {
        const cell = grid[ct.id]?.[u.id];
        if (cell && (cell.can_in || cell.can_out)) {
          out.push({ coach_type_id: ct.id, user_id: u.id, can_in: cell.can_in, can_out: cell.can_out });
        }
      }
    }
    return out;
  }, [coachTypes, users, grid]);

  async function handleSave() {
    setSaveError(null);
    setSaveSuccess(null);
    setSaving(true);
    try {
      const result = await savePaintTypeAssignments(flatCells);
      setSaveSuccess(`Saved — ${result.saved} assignment${result.saved === 1 ? "" : "s"} active.`);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save the assignment matrix.");
    } finally {
      setSaving(false);
    }
  }

  const inBtn = (active: boolean) =>
    `rounded px-2 py-0.5 text-[10px] font-bold ${
      active ? "bg-green-600 text-white" : "border border-slate-300 text-slate-400 hover:border-green-400"
    }`;
  const outBtn = (active: boolean) =>
    `rounded px-2 py-0.5 text-[10px] font-bold ${
      active ? "bg-red-600 text-white" : "border border-slate-300 text-slate-400 hover:border-red-400"
    }`;
  const miniBtn = "rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 hover:bg-slate-50";

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Supervisor-Coach Assignments (In-Out) Matrix</h2>
          <p className="text-sm text-slate-500">Paint Shop</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !coachTypes || !users}
          className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {loadError && <p className="mt-4 text-sm text-red-600">{loadError}</p>}
      {saveError && (
        <div className="mt-3 max-w-md">
          <ValidationMessage kind="error" message={saveError} />
        </div>
      )}
      {saveSuccess && (
        <div className="mt-3 max-w-md">
          <ValidationMessage kind="success" message={saveSuccess} />
        </div>
      )}

      {users && users.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">No active Paint employees yet — add one in User Management first.</p>
      )}

      {coachTypes && users && users.length > 0 && (
        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="sticky left-0 z-10 min-w-[220px] border-r border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Coach Type
                </th>
                {users.map((u) => (
                  <th key={u.id} className="min-w-[160px] px-3 py-3 text-center align-top">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-700">{u.full_name}</p>
                    <p className="text-[10px] text-slate-400">#{u.employee_no}</p>
                    <div className="mt-1.5 flex items-center justify-center gap-1">
                      <button type="button" className={miniBtn} onClick={() => setColumn(u.id, { can_in: true, can_out: false })}>
                        IN
                      </button>
                      <button type="button" className={miniBtn} onClick={() => setColumn(u.id, { can_in: false, can_out: true })}>
                        OUT
                      </button>
                      <button
                        type="button"
                        className="rounded border border-slate-200 p-0.5 text-slate-400 hover:bg-slate-50"
                        title="Clear this employee's whole column"
                        onClick={() => setColumn(u.id, emptyCell())}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coachTypes.map((ct, i) => (
                <tr key={ct.id} className={i % 2 === 1 ? "bg-slate-50/50" : ""}>
                  <td className="sticky left-0 z-10 border-r border-slate-200 bg-inherit px-4 py-3 align-top">
                    <p className="text-sm font-semibold text-slate-800">{ct.name}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <button type="button" className={miniBtn} onClick={() => setRow(ct.id, { can_in: true, can_out: false })}>
                        All IN
                      </button>
                      <button type="button" className={miniBtn} onClick={() => setRow(ct.id, { can_in: false, can_out: true })}>
                        All OUT
                      </button>
                      <button type="button" className={miniBtn} onClick={() => setRow(ct.id, { can_in: true, can_out: true })}>
                        Both
                      </button>
                      <button
                        type="button"
                        className="rounded border border-slate-200 p-0.5 text-slate-400 hover:bg-slate-50"
                        title="Clear this coach type's whole row"
                        onClick={() => setRow(ct.id, emptyCell())}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  </td>
                  {users.map((u) => {
                    const cell = grid[ct.id]?.[u.id] ?? emptyCell();
                    return (
                      <td key={u.id} className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button type="button" className={inBtn(cell.can_in)} onClick={() => toggleIn(ct.id, u.id)}>
                            IN
                          </button>
                          <button type="button" className={outBtn(cell.can_out)} onClick={() => toggleOut(ct.id, u.id)}>
                            OUT
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
