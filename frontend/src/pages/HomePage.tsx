import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  PaintBucket,
  Users,
  FileText,
  Layers,
  Factory,
  PackageCheck,
  ListChecks,
  Search,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { visibleNavItems } from "../components/layout/AppShell";
import { getShellOutturnList, getShellOutturnWorklist } from "../api/shellOutturn";
import { getFurnishingInList } from "../api/furnishingIn";
import { getPaintInList, getPaintInWorklist, getPaintLines } from "../api/paintIn";
import { getPaintOutList, getPaintOutWorklist, getPaintOutLines } from "../api/paintOut";
import { getAssemblyInList, getAssemblyInWorklist, getAssemblyInLines } from "../api/assemblyIn";
import { getAssemblyOutList, getAssemblyOutWorklist, getAssemblyOutLines } from "../api/assemblyOut";
import { getUsers, getProductionOrders, getAdminDashboardStats } from "../api/admin";
import { getRecentActivity } from "../api/dashboard";
import { getMyAssignmentSummary } from "../api/assignments";
import type { AdminDashboardStats, AssignmentSummary, RecentActivityRow } from "../types";
import { formatDateTime } from "../utils/dateFormat";

interface StatCardProps {
  icon: LucideIcon;
  color: "blue" | "amber" | "green" | "purple" | "indigo";
  label: string;
  value: number | string;
  description: string;
  to?: string;
  actionLabel?: string;
}

const COLOR_CLASSES: Record<StatCardProps["color"], string> = {
  blue: "bg-blue-100 text-blue-600",
  amber: "bg-amber-100 text-amber-600",
  green: "bg-green-100 text-green-600",
  purple: "bg-purple-100 text-purple-600",
  indigo: "bg-indigo-100 text-indigo-600",
};

function StatCard({ icon: Icon, color, label, value, description, to, actionLabel }: StatCardProps) {
  const content = (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${COLOR_CLASSES[color]}`}>
        <Icon size={16} />
      </div>
      <p className="mt-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
      {to && <p className="mt-auto pt-2 text-xs font-medium text-blue-600">{actionLabel ?? "Click to view →"}</p>}
    </div>
  );

  return to ? (
    <Link to={to} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  );
}

function StatGrid({ children }: { children: ReactNode }) {
  return <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

// Compact stage-wise WIP card for Admin's pipeline board — pairs a stage's
// completed-so-far total with how many coaches are sitting there waiting on
// the next stage. Mirrors the legacy dashboard's per-stage holdings, using
// our own real counts instead of its undocumented formulas.
function PipelineStageCard({
  label,
  done,
  waiting,
  waitingLabel,
  to,
}: {
  label: string;
  done: number | string;
  waiting: number | string;
  waitingLabel: string;
  to?: string;
}) {
  const content = (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 flex items-end gap-5">
        <div>
          <p className="text-xl font-bold text-slate-900">{done}</p>
          <p className="text-[11px] text-slate-400">Completed</p>
        </div>
        <div>
          <p className="text-xl font-bold text-amber-600">{waiting}</p>
          <p className="text-[11px] text-slate-400">{waitingLabel}</p>
        </div>
      </div>
    </div>
  );

  return to ? (
    <Link to={to} className="block hover:opacity-90">
      {content}
    </Link>
  ) : (
    content
  );
}

function PipelineGrid({ children }: { children: ReactNode }) {
  return <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">{children}</div>;
}

function AdminStats() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [boCount, setBoCount] = useState<number | null>(null);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);

  useEffect(() => {
    getUsers().then((res) => setUserCount(res.data.length));
    getProductionOrders().then((res) => setBoCount(res.data.length));
    getAdminDashboardStats().then(setStats);
  }, []);

  const v = (n: number | undefined) => n ?? "…";

  return (
    <>
      <StatGrid>
        <StatCard icon={Users} color="blue" label="Total Users" value={userCount ?? "…"} description="Across all roles" to="/admin/users" />
        <StatCard icon={FileText} color="amber" label="BOs / Production Orders" value={boCount ?? "…"} description="SAP/BO plan entries" to="/admin/production-orders" />
        <StatCard icon={Layers} color="green" label="Total Coaches" value={v(stats?.total_coaches)} description="Generated from BO serial ranges" to="/admin/production-orders" />
        <StatCard icon={ListChecks} color="indigo" label="Queued for Assignment" value={v(stats?.queued_for_assignment)} description="Awaiting a skilled employee with capacity" />
      </StatGrid>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">Pipeline — coach WIP by stage</p>
      <PipelineGrid>
        <PipelineStageCard label="Shell Outturn" done={v(stats?.total_shell_outturn)} waiting={v(stats?.pending_shell_outturn)} waitingLabel="Pending" />
        <PipelineStageCard label="Furnishing In" done={v(stats?.total_furnishing_in)} waiting={v(stats?.awaiting_furnishing_in)} waitingLabel="Waiting" />
        <PipelineStageCard label="Paint In" done={v(stats?.total_paint_in)} waiting={v(stats?.awaiting_paint_in)} waitingLabel="Waiting" to="/line-management" />
        <PipelineStageCard label="Paint Out" done={v(stats?.total_paint_out)} waiting={v(stats?.awaiting_paint_out)} waitingLabel="Waiting" to="/line-management" />
        <PipelineStageCard label="Assembly In" done={v(stats?.total_assembly_in)} waiting={v(stats?.awaiting_assembly_in)} waitingLabel="Waiting" to="/line-management" />
        <PipelineStageCard label="Assembly Out" done={v(stats?.total_assembly_out)} waiting={v(stats?.awaiting_assembly_out)} waitingLabel="Waiting" to="/line-management" />
      </PipelineGrid>
    </>
  );
}

function ShellProductionStats() {
  const [pending, setPending] = useState<number | null>(null);
  const [completedToday, setCompletedToday] = useState<number | null>(null);
  const [totalCompleted, setTotalCompleted] = useState<number | null>(null);

  useEffect(() => {
    getShellOutturnWorklist().then((res) => setPending(res.data.length));
    getShellOutturnList().then((res) => {
      const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local time
      setTotalCompleted(res.data.length);
      setCompletedToday(res.data.filter((row) => row.outturn_datetime.slice(0, 10) === todayStr).length);
    });
  }, []);

  return (
    <StatGrid>
      <StatCard
        icon={ClipboardList}
        color="amber"
        label="Record Shell Outturn"
        value={pending ?? "…"}
        description="Coaches awaiting Shell Outturn entry"
        to="/shell-outturn"
        actionLabel="Click to record →"
      />
      <StatCard
        icon={Factory}
        color="blue"
        label="Full Pending Worklist"
        value="View"
        description="Every pending coach with BO, plant & production year"
        to="/shell-production"
      />
      <StatCard
        icon={CheckCircle2}
        color="green"
        label="Completed Today"
        value={completedToday ?? "…"}
        description="Shell Outturns recorded today"
        to="/shell-outturn/history?today=1"
      />
      <StatCard
        icon={Layers}
        color="purple"
        label="Total Completed"
        value={totalCompleted ?? "…"}
        description="All-time Shell Outturns recorded"
        to="/shell-outturn/history"
      />
    </StatGrid>
  );
}

function FurnishingStats() {
  const [total, setTotal] = useState<number | null>(null);
  const [recordedToday, setRecordedToday] = useState<number | null>(null);
  const [summary, setSummary] = useState<AssignmentSummary | null>(null);

  useEffect(() => {
    getFurnishingInList().then((res) => {
      const todayStr = new Date().toLocaleDateString("en-CA");
      setTotal(res.data.length);
      setRecordedToday(res.data.filter((r) => r.furnishing_in_datetime.slice(0, 10) === todayStr).length);
    });
    getMyAssignmentSummary().then(setSummary);
  }, []);

  return (
    <StatGrid>
      <StatCard
        icon={ClipboardList}
        color="blue"
        label="Total Furnishing In Records"
        value={total ?? "…"}
        description="All-time, system-wide"
        to="/furnishing-in/history"
      />
      <StatCard
        icon={CheckCircle2}
        color="green"
        label="Recorded Today"
        value={recordedToday ?? "…"}
        description="Furnishing In records opened today"
        to="/furnishing-in/history?today=1"
      />
      <StatCard
        icon={PackageCheck}
        color="amber"
        label="Assigned to You"
        value={summary ? summary.assigned_count : "…"}
        description="Coaches waiting for your Furnishing In"
        to="/furnishing-in"
      />
      <StatCard
        icon={Clock}
        color="purple"
        label="Queued for You"
        value={summary?.queued_count ?? "…"}
        description="Matched to your skills, waiting on capacity"
        to="/furnishing-in"
      />
    </StatGrid>
  );
}

// A PAINT login might be configured for Paint In only, Paint Out only, or
// both (per the Supervisor-Coach Assignments Matrix) — the dashboard only
// shows stat cards for stages this specific employee can actually reach,
// same reasoning as the nav/route capability gate.
function PaintInStats() {
  const [awaiting, setAwaiting] = useState<number | null>(null);
  const [available, setAvailable] = useState<number | null>(null);
  const [totalRecords, setTotalRecords] = useState<number | null>(null);
  const [paintedToday, setPaintedToday] = useState<number | null>(null);

  useEffect(() => {
    getPaintInWorklist().then((res) => setAwaiting(res.data.length));
    getPaintLines().then((res) => {
      const occ = res.data.reduce((sum, l) => sum + l.occupied_slots, 0);
      const total = res.data.reduce((sum, l) => sum + l.total_slots, 0);
      setAvailable(total - occ);
    });
    getPaintInList().then((res) => {
      const todayStr = new Date().toLocaleDateString("en-CA");
      setTotalRecords(res.data.length);
      setPaintedToday(res.data.filter((r) => r.paint_in_datetime.slice(0, 10) === todayStr).length);
    });
  }, []);

  return (
    <StatGrid>
      <StatCard icon={Clock} color="amber" label="Awaiting Paint In" value={awaiting ?? "…"} description="Furnishing In done, pending allocation" to="/paint-in" />
      <StatCard icon={CheckCircle2} color="green" label="Available Slots" value={available ?? "…"} description="Free capacity across all lines" to="/paint-in" />
      <StatCard icon={ClipboardList} color="indigo" label="Painted Today" value={paintedToday ?? "…"} description="Paint In recorded today" to="/paint-in/history?today=1" />
      <StatCard icon={PaintBucket} color="blue" label="Total Paint In Records" value={totalRecords ?? "…"} description="All-time, system-wide" to="/paint-in/history" />
    </StatGrid>
  );
}

function PaintOutStats() {
  const [awaiting, setAwaiting] = useState<number | null>(null);
  const [available, setAvailable] = useState<number | null>(null);
  const [totalRecords, setTotalRecords] = useState<number | null>(null);
  const [paintedToday, setPaintedToday] = useState<number | null>(null);

  useEffect(() => {
    getPaintOutWorklist().then((res) => setAwaiting(res.data.length));
    getPaintOutLines().then((res) => {
      const occ = res.data.reduce((sum, l) => sum + l.occupied_slots, 0);
      const total = res.data.reduce((sum, l) => sum + l.total_slots, 0);
      setAvailable(total - occ);
    });
    getPaintOutList().then((res) => {
      const todayStr = new Date().toLocaleDateString("en-CA");
      setTotalRecords(res.data.length);
      setPaintedToday(res.data.filter((r) => r.paint_out_datetime.slice(0, 10) === todayStr).length);
    });
  }, []);

  return (
    <StatGrid>
      <StatCard icon={Clock} color="amber" label="Awaiting Paint Out" value={awaiting ?? "…"} description="Paint In done, pending allocation" to="/paint-out" />
      <StatCard icon={CheckCircle2} color="green" label="Available Slots" value={available ?? "…"} description="Free capacity across all lines" to="/paint-out" />
      <StatCard icon={ClipboardList} color="indigo" label="Painted Out Today" value={paintedToday ?? "…"} description="Paint Out recorded today" to="/paint-out/history?today=1" />
      <StatCard icon={PaintBucket} color="blue" label="Total Paint Out Records" value={totalRecords ?? "…"} description="All-time, system-wide" to="/paint-out/history" />
    </StatGrid>
  );
}

function PaintStats({ capabilities }: { capabilities: string[] }) {
  return (
    <>
      {capabilities.includes("PAINT") && <PaintInStats />}
      {capabilities.includes("PAINT_OUT") && <PaintOutStats />}
    </>
  );
}

// Same reasoning as PaintStats above — an ASSEMBLY_PRODUCTION login might be
// configured for Assembly In only, Assembly Out only, or both.
function AssemblyInStats() {
  const [awaiting, setAwaiting] = useState<number | null>(null);
  const [available, setAvailable] = useState<number | null>(null);
  const [totalRecords, setTotalRecords] = useState<number | null>(null);
  const [doneToday, setDoneToday] = useState<number | null>(null);

  useEffect(() => {
    getAssemblyInWorklist().then((res) => setAwaiting(res.data.length));
    getAssemblyInLines().then((res) => {
      const occ = res.data.reduce((sum, l) => sum + l.occupied_slots, 0);
      const total = res.data.reduce((sum, l) => sum + l.total_slots, 0);
      setAvailable(total - occ);
    });
    getAssemblyInList().then((res) => {
      const todayStr = new Date().toLocaleDateString("en-CA");
      setTotalRecords(res.data.length);
      setDoneToday(res.data.filter((r) => r.assembly_in_datetime.slice(0, 10) === todayStr).length);
    });
  }, []);

  return (
    <StatGrid>
      <StatCard icon={Clock} color="amber" label="Awaiting Assembly In" value={awaiting ?? "…"} description="Paint Out done, pending allocation" to="/assembly-in" />
      <StatCard icon={CheckCircle2} color="green" label="Available Slots" value={available ?? "…"} description="Free capacity across all lines" to="/assembly-in" />
      <StatCard icon={ClipboardList} color="indigo" label="Assembled In Today" value={doneToday ?? "…"} description="Assembly In recorded today" to="/assembly-in/history?today=1" />
      <StatCard icon={Layers} color="purple" label="Total Assembly In Records" value={totalRecords ?? "…"} description="All-time, system-wide" to="/assembly-in/history" />
    </StatGrid>
  );
}

function AssemblyOutStats() {
  const [awaiting, setAwaiting] = useState<number | null>(null);
  const [available, setAvailable] = useState<number | null>(null);
  const [totalRecords, setTotalRecords] = useState<number | null>(null);
  const [doneToday, setDoneToday] = useState<number | null>(null);

  useEffect(() => {
    getAssemblyOutWorklist().then((res) => setAwaiting(res.data.length));
    getAssemblyOutLines().then((res) => {
      const occ = res.data.reduce((sum, l) => sum + l.occupied_slots, 0);
      const total = res.data.reduce((sum, l) => sum + l.total_slots, 0);
      setAvailable(total - occ);
    });
    getAssemblyOutList().then((res) => {
      const todayStr = new Date().toLocaleDateString("en-CA");
      setTotalRecords(res.data.length);
      setDoneToday(res.data.filter((r) => r.assembly_out_datetime.slice(0, 10) === todayStr).length);
    });
  }, []);

  return (
    <StatGrid>
      <StatCard icon={Clock} color="amber" label="Awaiting Assembly Out" value={awaiting ?? "…"} description="Assembly In done, pending allocation" to="/assembly-out" />
      <StatCard icon={CheckCircle2} color="green" label="Available Slots" value={available ?? "…"} description="Free capacity across all lines" to="/assembly-out" />
      <StatCard icon={ClipboardList} color="indigo" label="Assembled Out Today" value={doneToday ?? "…"} description="Assembly Out recorded today" to="/assembly-out/history?today=1" />
      <StatCard icon={Layers} color="green" label="Total Assembly Out Records" value={totalRecords ?? "…"} description="All-time, system-wide" to="/assembly-out/history" />
    </StatGrid>
  );
}

function AssemblyStats({ capabilities }: { capabilities: string[] }) {
  return (
    <>
      {capabilities.includes("ASSEMBLY_IN") && <AssemblyInStats />}
      {capabilities.includes("ASSEMBLY_OUT") && <AssemblyOutStats />}
    </>
  );
}

const ACTIVITY_LABEL: Record<RecentActivityRow["type"], string> = {
  SHELL_OUTTURN: "Shell Outturn",
  FURNISHING_IN: "Furnishing In",
  PAINT_IN: "Paint In",
  PAINT_OUT: "Paint Out",
  ASSEMBLY_IN: "Assembly In",
  ASSEMBLY_OUT: "Assembly Out",
};

const ACTIVITY_COLOR: Record<RecentActivityRow["type"], string> = {
  SHELL_OUTTURN: "bg-amber-100 text-amber-700",
  FURNISHING_IN: "bg-purple-100 text-purple-700",
  PAINT_IN: "bg-blue-100 text-blue-700",
  PAINT_OUT: "bg-indigo-100 text-indigo-700",
  ASSEMBLY_IN: "bg-teal-100 text-teal-700",
  ASSEMBLY_OUT: "bg-green-100 text-green-700",
};

function RecentActivity() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [rows, setRows] = useState<RecentActivityRow[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getRecentActivity().then((res) => setRows(res.data));
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.coach_number.toLowerCase().includes(q) ||
        row.coach_type.toLowerCase().includes(q) ||
        row.performed_by.toLowerCase().includes(q) ||
        ACTIVITY_LABEL[row.type].toLowerCase().includes(q),
    );
  }, [rows, query]);

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
          <p className="text-xs text-slate-400">Most recently completed coach work</p>
        </div>
        <div className="relative w-56 flex-shrink-0">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400" size={15} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by coach, type, user..."
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs"
          />
        </div>
      </div>

      {filtered && filtered.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          {rows && rows.length === 0 ? "No completed work yet." : "No activity matches your filter."}
        </p>
      )}

      {filtered && filtered.length > 0 && (
        <div className="mt-4 divide-y divide-slate-100">
          {filtered.map((row, i) => {
            const RowTag = isAdmin ? Link : "div";
            const rowProps = isAdmin ? { to: `/admin/coaches/${row.coach_id}` } : {};
            return (
              <RowTag
                key={i}
                {...rowProps}
                className={`flex items-center justify-between py-3 ${isAdmin ? "-mx-2 rounded-lg px-2 hover:bg-slate-50" : ""}`}
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Coach {row.coach_number} <span className="text-slate-400">·</span>{" "}
                    <span className="text-slate-500">{row.coach_type}</span>
                  </p>
                  <p className="text-xs text-slate-400">by {row.performed_by}</p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTIVITY_COLOR[row.type]}`}>
                    {ACTIVITY_LABEL[row.type]}
                  </span>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(row.occurred_at)}</p>
                </div>
              </RowTag>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function HomePage() {
  const { user, capabilities, capabilitiesLoading } = useAuth();
  const items = visibleNavItems(user?.role, capabilities);
  const hasActivityFeed =
    user?.role && ["ADMIN", "SHELL_PRODUCTION", "FURNISHING", "PAINT", "ASSEMBLY_PRODUCTION"].includes(user.role);
  // PAINT/ASSEMBLY_PRODUCTION have working modules, just not necessarily
  // configured for this specific login — different message than a role with
  // no module at all (e.g. MECHANICAL_INSPECTION, still unbuilt).
  const isUnconfigured =
    !capabilitiesLoading && items.length === 0 && user?.role && ["PAINT", "ASSEMBLY_PRODUCTION", "FURNISHING"].includes(user.role);

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">Dashboard</h2>

      {user?.role === "ADMIN" && <AdminStats />}
      {user?.role === "SHELL_PRODUCTION" && <ShellProductionStats />}
      {user?.role === "FURNISHING" && capabilities.includes("FURNISHING") && <FurnishingStats />}
      {user?.role === "PAINT" && <PaintStats capabilities={capabilities} />}
      {user?.role === "ASSEMBLY_PRODUCTION" && <AssemblyStats capabilities={capabilities} />}

      {hasActivityFeed && <RecentActivity />}

      {!capabilitiesLoading && items.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">
          {isUnconfigured
            ? "Your account isn't configured for any stage of this module yet. Ask Admin to set it up via the assignment matrix/skills."
            : "No modules have been built for this role yet. Check back once that module is available."}
        </p>
      )}
    </div>
  );
}
