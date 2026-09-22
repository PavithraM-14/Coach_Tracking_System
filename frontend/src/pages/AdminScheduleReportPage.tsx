import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Workbook } from "exceljs";
import { Download, Printer, Search } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getScheduleReport } from "../api/admin";
import type { ScheduleComparisonStage, ScheduleReportRow } from "../types";
import { ApiError } from "../api/client";

const STATUS_STYLE: Record<ScheduleComparisonStage["status"], string> = {
  on_time: "bg-green-100 text-green-700",
  delayed: "bg-red-100 text-red-700",
  overdue: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
  reference: "bg-indigo-100 text-indigo-700",
};

const STATUS_LABEL: Record<ScheduleComparisonStage["status"], string> = {
  on_time: "On time",
  delayed: "Delayed",
  overdue: "Overdue",
  pending: "Pending",
  reference: "Recorded",
};

// Pending is grey here specifically — it dominates this chart (most stages
// haven't happened yet for most coaches), and amber/orange next to Overdue
// made the whole donut read as "everything is a warning." Amber is kept for
// the Pending badges elsewhere (the table, the coach detail page) where it
// doesn't have that crowding problem.
const DONUT_COLORS: Record<string, string> = {
  "On time": "#22c55e",
  Delayed: "#ef4444",
  Overdue: "#f97316",
  Pending: "#94a3b8",
};

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function AdminScheduleReportPage() {
  const [rows, setRows] = useState<ScheduleReportRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getScheduleReport()
      .then((res) => setRows(res.data))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Failed to load schedule report."));
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.coach_number.toLowerCase().includes(q) || r.coach_type.toLowerCase().includes(q));
  }, [rows, query]);

  const stageLabels = rows?.[0]?.stages.map((s) => s.label) ?? [];

  // Skip Shell Outturn here — it has no scheduled date to measure a delay
  // against, it's shown in the table as a reference column only.
  const delayByStage = useMemo(() => {
    if (!rows) return [];
    return stageLabels
      .filter((label) => label !== "Shell Outturn")
      .map((label) => {
        const diffs: number[] = [];
        for (const row of rows) {
          const stage = row.stages.find((s) => s.label === label);
          if (stage && stage.actual_date && stage.scheduled_date) {
            diffs.push(daysBetween(stage.scheduled_date, stage.actual_date));
          }
        }
        const avg = diffs.length > 0 ? diffs.reduce((a, b) => a + b, 0) / diffs.length : 0;
        return { stage: label, avgDelay: Math.round(avg * 10) / 10, sampleSize: diffs.length };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const statusCounts = useMemo(() => {
    if (!rows) return [];
    const counts: Record<string, number> = { "On time": 0, Delayed: 0, Overdue: 0, Pending: 0 };
    for (const row of rows) {
      for (const stage of row.stages) {
        if (stage.status === "reference") continue; // Shell Outturn isn't a schedule outcome
        counts[STATUS_LABEL[stage.status]]++;
      }
    }
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [rows]);

  // Exports exactly what's on screen (respects the search filter) — each
  // stage gets a Scheduled/Actual column pair, matching the table's own
  // two-line cells, so the spreadsheet reads the same way the page does.
  async function handleExportExcel() {
    if (!filtered || filtered.length === 0) return;

    const wb = new Workbook();
    const sheet = wb.addWorksheet("Schedule Report");

    const headerTop: string[] = ["Coach", "Type"];
    const headerBottom: string[] = ["", ""];
    for (const label of stageLabels) {
      headerTop.push(label, "");
      headerBottom.push("Scheduled", "Actual");
    }
    headerTop.push("Sched. Days", "Live Days");
    headerBottom.push("", "");

    sheet.addRow(headerTop);
    sheet.addRow(headerBottom);

    for (const row of filtered) {
      const line: Array<string | number> = [row.coach_number, row.coach_type];
      for (const stage of row.stages) {
        line.push(stage.scheduled_date ?? "", stage.actual_date ?? STATUS_LABEL[stage.status]);
      }
      line.push(row.scheduled_total_days, row.actual_total_days ?? "");
      sheet.addRow(line);
    }

    sheet.mergeCells(1, 1, 2, 1); // Coach
    sheet.mergeCells(1, 2, 2, 2); // Type
    let col = 3;
    for (let i = 0; i < stageLabels.length; i++) {
      sheet.mergeCells(1, col, 1, col + 1);
      col += 2;
    }
    sheet.mergeCells(1, col, 2, col); // Sched. Days
    sheet.mergeCells(1, col + 1, 2, col + 1); // Live Days

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(2).font = { bold: true };
    sheet.getRow(1).alignment = { horizontal: "center" };
    sheet.columns.forEach((c) => {
      c.width = 14;
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `schedule_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Schedule Report</h2>
          <p className="mt-1 text-sm text-slate-500">
            Scheduled date (blue) vs actual date per stage, for every coach — scheduled is the same
            rolling target already shown as "Predicted Date" at each stage's entry form. Green means
            the actual date matched or beat the target; red means it was late; amber means the stage
            hasn't happened yet.
          </p>
        </div>
        <div className="flex flex-shrink-0 gap-2 print:hidden">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={!filtered || filtered.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Download size={14} /> Export Excel
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {loadError && <p className="mt-4 text-sm text-red-600">{loadError}</p>}

      {rows && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">Average Delay by Stage</h3>
            <p className="text-xs text-slate-400">
              How each stage runs on average, in days, vs its scheduled target. Bars pointing right
              (red) mean that stage tends to finish late; bars pointing left (green) mean it tends to
              finish early. The further from the middle line, the bigger the gap.
            </p>
            <div className="mt-3 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={delayByStage} layout="vertical" margin={{ top: 5, right: 40, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }}>
                    <Label value="Days late (+) / early (−), on average" position="insideBottom" offset={-10} style={{ fontSize: 11, fill: "#64748b" }} />
                  </XAxis>
                  <YAxis type="category" dataKey="stage" tick={{ fontSize: 11 }} width={130} />
                  <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1.5} />
                  <Tooltip
                    formatter={(value, _name, item) => {
                      const v = Number(value) || 0;
                      const n = Number(item?.payload?.sampleSize) || 0;
                      return [
                        `${v > 0 ? "+" : ""}${v} days (avg of ${n} coach${n === 1 ? "" : "es"})`,
                        v > 0 ? "Late" : v < 0 ? "Early" : "On time",
                      ];
                    }}
                  />
                  <Bar dataKey="avgDelay" radius={3}>
                    {delayByStage.map((d, i) => (
                      <Cell key={i} fill={d.avgDelay > 0 ? "#ef4444" : d.avgDelay < 0 ? "#22c55e" : "#94a3b8"} />
                    ))}
                    <LabelList
                      dataKey="avgDelay"
                      position="right"
                      formatter={(v: unknown) => {
                        const n = Number(v) || 0;
                        return n === 0 ? "0d" : `${n > 0 ? "+" : ""}${n}d`;
                      }}
                      style={{ fontSize: 11, fill: "#475569" }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">Stage Status, Overall</h3>
            <p className="text-xs text-slate-400">Every stage-instance across every coach, by status.</p>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusCounts} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {statusCounts.map((s, i) => (
                      <Cell key={i} fill={DONUT_COLORS[s.name] ?? "#94a3b8"} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="relative mt-6 w-72 print:hidden">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400" size={15} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search coach number or type..."
          className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs"
        />
      </div>

      {filtered && (
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm print:overflow-visible print:border-0 print:shadow-none">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Coach</th>
                <th className="px-3 py-2">Type</th>
                {stageLabels.map((label) => (
                  <th key={label} className="px-2 py-2 text-center">
                    {label}
                  </th>
                ))}
                <th className="px-2 py-2 text-center">Sched. Days</th>
                <th className="px-2 py-2 text-center">Live Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr key={row.coach_id}>
                  <td className="px-3 py-2 font-medium text-slate-800">
                    <Link to={`/admin/coaches/${row.coach_id}`} className="text-blue-600 hover:underline">
                      {row.coach_number}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">{row.coach_type}</td>
                  {row.stages.map((stage) => (
                    <td key={stage.key} className="px-1.5 py-1.5 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        {stage.scheduled_date && (
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                            {stage.scheduled_date}
                          </span>
                        )}
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLE[stage.status]}`}>
                          {stage.actual_date ?? STATUS_LABEL[stage.status]}
                        </span>
                      </div>
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-center text-xs text-slate-600">{row.scheduled_total_days}</td>
                  <td className="px-2 py-1.5 text-center text-xs font-medium text-slate-800">
                    {row.actual_total_days ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
