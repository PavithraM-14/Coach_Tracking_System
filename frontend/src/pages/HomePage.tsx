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
  Lock,
  Landmark,
  Truck,
  ClipboardCheck,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { visibleNavItems } from "../components/layout/AppShell";
import { getShellOutturnList, getShellOutturnWorklist } from "../api/shellOutturn";
import { getFurnishingInList, getFurnishingInWorklist } from "../api/furnishingIn";
import { getPaintInWorklist } from "../api/paintIn";
import { getPaintOutWorklist } from "../api/paintOut";
import { getPaintRecords } from "../api/paintRecords";
import { getAssemblyInWorklist } from "../api/assemblyIn";
import { getAssemblyOutWorklist } from "../api/assemblyOut";
import { getAssemblyRecords } from "../api/assemblyRecords";
import { getLocalOutturnList, getLocalOutturnWorklist } from "../api/localOutturn";
import { getLockSealList, getLockSealWorklist } from "../api/lockSeal";
import { getBoardOutturnList, getBoardOutturnWorklist } from "../api/boardOutturn";
import { getPhysicalDispatchList, getPhysicalDispatchWorklist } from "../api/physicalDispatch";
import { getUsers, getProductionOrders, getAdminDashboardStats } from "../api/admin";
import { getRecentActivity } from "../api/dashboard";
import type { AdminDashboardStats, RecentActivityRow } from "../types";
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
        <PipelineStageCard label="Local Outturn" done={v(stats?.total_local_outturn)} waiting={v(stats?.awaiting_local_outturn)} waitingLabel="Waiting" to="/local-outturn/history" />
        <PipelineStageCard label="Lock & Seal" done={v(stats?.total_lock_seal)} waiting={v(stats?.awaiting_lock_seal)} waitingLabel="Waiting" to="/lock-seal/history" />
        <PipelineStageCard label="Railway Board Outturn" done={v(stats?.total_board_outturn)} waiting={v(stats?.awaiting_board_outturn)} waitingLabel="Waiting" to="/board-outturn/history" />
        <PipelineStageCard label="Physical Dispatch" done={v(stats?.total_physical_dispatch)} waiting={v(stats?.awaiting_physical_dispatch)} waitingLabel="Waiting" to="/physical-dispatch/history" />
      </PipelineGrid>
    </>
  );
}

// Paint Admin / Assembly Admin are scoped sub-admins — a worker-count tile
// plus that one shop's slice of the same pipeline WIP numbers Admin's
// dashboard already computes system-wide (dashboard_stats.php), instead of
// duplicating that query per-shop.
function PaintAdminStats() {
  const [workerCount, setWorkerCount] = useState<number | null>(null);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);

  useEffect(() => {
    getUsers().then((res) => setWorkerCount(res.data.length));
    getAdminDashboardStats().then(setStats);
  }, []);

  const v = (n: number | undefined) => n ?? "…";

  return (
    <>
      <StatGrid>
        <StatCard icon={Users} color="blue" label="Paint Workers" value={workerCount ?? "…"} description="Active Paint Shop logins" to="/admin/users" />
        <StatCard icon={LayoutGrid} color="indigo" label="Paint Assignments" value="Manage" description="Supervisor / coach-type matrix" to="/admin/paint-assignments" />
        <StatCard icon={Layers} color="purple" label="Line Management" value="View" description="Paint In / Out line occupancy" to="/line-management" />
      </StatGrid>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">Pipeline — Paint stage WIP</p>
      <PipelineGrid>
        <PipelineStageCard label="Paint In" done={v(stats?.total_paint_in)} waiting={v(stats?.awaiting_paint_in)} waitingLabel="Pending" to="/line-management" />
        <PipelineStageCard label="Paint Out" done={v(stats?.total_paint_out)} waiting={v(stats?.awaiting_paint_out)} waitingLabel="Pending" to="/line-management" />
      </PipelineGrid>
    </>
  );
}

function AssemblyAdminStats() {
  const [workerCount, setWorkerCount] = useState<number | null>(null);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);

  useEffect(() => {
    getUsers().then((res) => setWorkerCount(res.data.length));
    getAdminDashboardStats().then(setStats);
  }, []);

  const v = (n: number | undefined) => n ?? "…";

  return (
    <>
      <StatGrid>
        <StatCard icon={Users} color="blue" label="Assembly Workers" value={workerCount ?? "…"} description="Active Assembly Shop logins" to="/admin/users" />
        <StatCard icon={LayoutGrid} color="indigo" label="Assembly Assignments" value="Manage" description="Supervisor / coach-type matrix" to="/admin/assembly-assignments" />
        <StatCard icon={Layers} color="purple" label="Line Management" value="View" description="Assembly In / Out line occupancy" to="/line-management" />
      </StatGrid>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">Pipeline — Assembly stage WIP</p>
      <PipelineGrid>
        <PipelineStageCard label="Assembly In" done={v(stats?.total_assembly_in)} waiting={v(stats?.awaiting_assembly_in)} waitingLabel="Pending" to="/line-management" />
        <PipelineStageCard label="Assembly Out" done={v(stats?.total_assembly_out)} waiting={v(stats?.awaiting_assembly_out)} waitingLabel="Pending" to="/line-management" />
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
  const [pending, setPending] = useState<number | null>(null);
  const [stillAtFurnishing, setStillAtFurnishing] = useState<number | null>(null);
  const [movedToPaintIn, setMovedToPaintIn] = useState<number | null>(null);

  useEffect(() => {
    getFurnishingInList().then((res) => {
      const todayStr = new Date().toLocaleDateString("en-CA");
      setTotal(res.data.length);
      setRecordedToday(res.data.filter((r) => r.furnishing_in_datetime.slice(0, 10) === todayStr).length);
      setStillAtFurnishing(res.data.filter((r) => r.status === "FURNISHING_IN").length);
      setMovedToPaintIn(res.data.filter((r) => r.status === "PAINT_IN").length);
    });
    getFurnishingInWorklist().then((res) => setPending(res.data.length));
  }, []);

  return (
    <StatGrid>
      <StatCard
        icon={Clock}
        color="amber"
        label="Pending Furnishing In"
        value={pending ?? "…"}
        description="Coaches awaiting Furnishing In"
        to="/furnishing-in/pending"
      />
      <StatCard
        icon={CheckCircle2}
        color="green"
        label="Completed Today"
        value={recordedToday ?? "…"}
        description="Furnishing In completed today"
        to="/furnishing-in/history?today=1"
      />
      <StatCard
        icon={ClipboardList}
        color="purple"
        label="Total Completed"
        value={total ?? "…"}
        description="All-time Furnishing In completions"
        to="/furnishing-in/history"
      />
      <StatCard
        icon={PackageCheck}
        color="blue"
        label="Total Furnishing In Records"
        value={pending === null || total === null ? "…" : pending + total}
        description={
          pending === null || stillAtFurnishing === null || movedToPaintIn === null
            ? "Every coach that has reached Furnishing In, by status"
            : `${pending} pending · ${stillAtFurnishing} at Furnishing In · ${movedToPaintIn} moved to Paint In`
        }
        to="/furnishing-in/stages"
      />
    </StatGrid>
  );
}

// A PAINT login might be configured for Paint In only, Paint Out only, or
// both (per the Supervisor-Coach Assignments Matrix) — the dashboard only
// shows stat cards for stages this specific employee can actually reach,
// same reasoning as the nav/route capability gate.
function PaintInStats() {
  const [pending, setPending] = useState<number | null>(null);
  const [completedToday, setCompletedToday] = useState<number | null>(null);
  const [totalCompleted, setTotalCompleted] = useState<number | null>(null);
  const [stillAtPaintIn, setStillAtPaintIn] = useState<number | null>(null);
  const [movedToPaintOut, setMovedToPaintOut] = useState<number | null>(null);

  useEffect(() => {
    getPaintInWorklist().then((res) => setPending(res.data.length));
    getPaintRecords().then((res) => {
      const todayStr = new Date().toLocaleDateString("en-CA");
      setTotalCompleted(res.data.length);
      setCompletedToday(res.data.filter((r) => r.paint_in_datetime.slice(0, 10) === todayStr).length);
      setStillAtPaintIn(res.data.filter((r) => r.paint_out_datetime === null).length);
      setMovedToPaintOut(res.data.filter((r) => r.paint_out_datetime !== null).length);
    });
  }, []);

  return (
    <StatGrid>
      <StatCard icon={Clock} color="amber" label="Pending Paint In" value={pending ?? "…"} description="Furnishing In done, pending allocation" to="/paint-in" />
      <StatCard icon={CheckCircle2} color="green" label="Completed Today" value={completedToday ?? "…"} description="Paint In recorded today" to="/paint-in/history?today=1" />
      <StatCard icon={ClipboardList} color="purple" label="Total Completed" value={totalCompleted ?? "…"} description="All-time Paint In completions" to="/paint-in/history" />
      <StatCard
        icon={PaintBucket}
        color="blue"
        label="Total Paint In Records"
        value={pending === null || totalCompleted === null ? "…" : pending + totalCompleted}
        description={
          pending === null || stillAtPaintIn === null || movedToPaintOut === null
            ? "Every coach that has reached Paint In, by status"
            : `${pending} pending · ${stillAtPaintIn} at Paint In · ${movedToPaintOut} moved to Paint Out`
        }
        to="/paint-in/stages"
      />
    </StatGrid>
  );
}

function PaintOutStats() {
  const [pending, setPending] = useState<number | null>(null);
  const [completedToday, setCompletedToday] = useState<number | null>(null);
  const [totalCompleted, setTotalCompleted] = useState<number | null>(null);
  const [stillAtPaintOut, setStillAtPaintOut] = useState<number | null>(null);
  const [movedToAssemblyIn, setMovedToAssemblyIn] = useState<number | null>(null);

  useEffect(() => {
    getPaintOutWorklist().then((res) => setPending(res.data.length));
    Promise.all([getPaintRecords(), getAssemblyRecords()]).then(([paintRes, assemblyRes]) => {
      const todayStr = new Date().toLocaleDateString("en-CA");
      const completed = paintRes.data.filter((r) => r.paint_out_datetime !== null);
      const assemblyCoachIds = new Set(assemblyRes.data.map((r) => r.coach_id));
      setTotalCompleted(completed.length);
      setCompletedToday(completed.filter((r) => r.paint_out_datetime!.slice(0, 10) === todayStr).length);
      setStillAtPaintOut(completed.filter((r) => !assemblyCoachIds.has(r.coach_id)).length);
      setMovedToAssemblyIn(completed.filter((r) => assemblyCoachIds.has(r.coach_id)).length);
    });
  }, []);

  return (
    <StatGrid>
      <StatCard icon={Clock} color="amber" label="Pending Paint Out" value={pending ?? "…"} description="Paint In done, pending allocation" to="/paint-out" />
      <StatCard icon={CheckCircle2} color="green" label="Completed Today" value={completedToday ?? "…"} description="Paint Out recorded today" to="/paint-out/history?today=1" />
      <StatCard icon={ClipboardList} color="purple" label="Total Completed" value={totalCompleted ?? "…"} description="All-time Paint Out completions" to="/paint-out/history" />
      <StatCard
        icon={PaintBucket}
        color="blue"
        label="Total Paint Out Records"
        value={pending === null || totalCompleted === null ? "…" : pending + totalCompleted}
        description={
          pending === null || stillAtPaintOut === null || movedToAssemblyIn === null
            ? "Every coach that has reached Paint Out, by status"
            : `${pending} pending · ${stillAtPaintOut} at Paint Out · ${movedToAssemblyIn} moved to Assembly In`
        }
        to="/paint-out/stages"
      />
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
  const [pending, setPending] = useState<number | null>(null);
  const [completedToday, setCompletedToday] = useState<number | null>(null);
  const [totalCompleted, setTotalCompleted] = useState<number | null>(null);
  const [stillAtAssemblyIn, setStillAtAssemblyIn] = useState<number | null>(null);
  const [movedToAssemblyOut, setMovedToAssemblyOut] = useState<number | null>(null);

  useEffect(() => {
    getAssemblyInWorklist().then((res) => setPending(res.data.length));
    getAssemblyRecords().then((res) => {
      const todayStr = new Date().toLocaleDateString("en-CA");
      setTotalCompleted(res.data.length);
      setCompletedToday(res.data.filter((r) => r.assembly_in_datetime.slice(0, 10) === todayStr).length);
      setStillAtAssemblyIn(res.data.filter((r) => r.assembly_out_datetime === null).length);
      setMovedToAssemblyOut(res.data.filter((r) => r.assembly_out_datetime !== null).length);
    });
  }, []);

  return (
    <StatGrid>
      <StatCard icon={Clock} color="amber" label="Pending Assembly In" value={pending ?? "…"} description="Paint Out done, pending allocation" to="/assembly-in" />
      <StatCard icon={CheckCircle2} color="green" label="Completed Today" value={completedToday ?? "…"} description="Assembly In recorded today" to="/assembly-in/history?today=1" />
      <StatCard icon={ClipboardList} color="purple" label="Total Completed" value={totalCompleted ?? "…"} description="All-time Assembly In completions" to="/assembly-in/history" />
      <StatCard
        icon={Layers}
        color="blue"
        label="Total Assembly In Records"
        value={pending === null || totalCompleted === null ? "…" : pending + totalCompleted}
        description={
          pending === null || stillAtAssemblyIn === null || movedToAssemblyOut === null
            ? "Every coach that has reached Assembly In, by status"
            : `${pending} pending · ${stillAtAssemblyIn} at Assembly In · ${movedToAssemblyOut} moved to Assembly Out`
        }
        to="/assembly-in/stages"
      />
    </StatGrid>
  );
}

function AssemblyOutStats() {
  const [pending, setPending] = useState<number | null>(null);
  const [completedToday, setCompletedToday] = useState<number | null>(null);
  const [totalCompleted, setTotalCompleted] = useState<number | null>(null);

  useEffect(() => {
    getAssemblyOutWorklist().then((res) => setPending(res.data.length));
    getAssemblyRecords().then((res) => {
      const todayStr = new Date().toLocaleDateString("en-CA");
      const completed = res.data.filter((r) => r.assembly_out_datetime !== null);
      setTotalCompleted(completed.length);
      setCompletedToday(completed.filter((r) => r.assembly_out_datetime!.slice(0, 10) === todayStr).length);
    });
  }, []);

  return (
    <StatGrid>
      <StatCard icon={Clock} color="amber" label="Pending Assembly Out" value={pending ?? "…"} description="Assembly In done, pending allocation" to="/assembly-out" />
      <StatCard icon={CheckCircle2} color="green" label="Completed Today" value={completedToday ?? "…"} description="Assembly Out recorded today" to="/assembly-out/history?today=1" />
      <StatCard icon={ClipboardList} color="purple" label="Total Completed" value={totalCompleted ?? "…"} description="All-time Assembly Out completions" to="/assembly-out/history" />
      <StatCard
        icon={Layers}
        color="blue"
        label="Total Assembly Out Records"
        value={pending === null || totalCompleted === null ? "…" : pending + totalCompleted}
        description={
          pending === null || totalCompleted === null
            ? "Every coach that has reached Assembly Out, by status"
            : `${pending} pending · ${totalCompleted} completed`
        }
        to="/assembly-out/stages"
      />
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

// Records recorded in the last 7 days (inclusive of today) — a trend signal
// distinct from "today" and "all-time total", computed client-side from the
// same list response rather than a separate API call.
function withinLastWeek(dateStr: string): boolean {
  const recorded = new Date(dateStr.slice(0, 10) + "T00:00:00");
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 6);
  cutoff.setHours(0, 0, 0, 0);
  return recorded >= cutoff;
}

// The four final stages have no line/slot grid (unlike Paint/Assembly), so
// their dashboard cards drop the "Available Slots" tile in favor of a
// "This Week" trend tile — Awaiting / Today / This Week / Total, same
// reasoning as Furnishing's simpler model.
function LocalOutturnStats() {
  const [awaiting, setAwaiting] = useState<number | null>(null);
  const [totalRecords, setTotalRecords] = useState<number | null>(null);
  const [doneToday, setDoneToday] = useState<number | null>(null);
  const [thisWeek, setThisWeek] = useState<number | null>(null);

  useEffect(() => {
    getLocalOutturnWorklist().then((res) => setAwaiting(res.data.length));
    getLocalOutturnList().then((res) => {
      const todayStr = new Date().toLocaleDateString("en-CA");
      setTotalRecords(res.data.length);
      setDoneToday(res.data.filter((r) => r.local_outturn_datetime.slice(0, 10) === todayStr).length);
      setThisWeek(res.data.filter((r) => withinLastWeek(r.local_outturn_datetime)).length);
    });
  }, []);

  return (
    <StatGrid>
      <StatCard icon={Clock} color="amber" label="Awaiting Local Outturn" value={awaiting ?? "…"} description="Assembly Out done, pending allocation" to="/local-outturn" />
      <StatCard icon={ClipboardList} color="indigo" label="Recorded Today" value={doneToday ?? "…"} description="Local Outturn recorded today" to="/local-outturn/history?today=1" />
      <StatCard icon={ClipboardCheck} color="purple" label="This Week" value={thisWeek ?? "…"} description="Local Outturn recorded, last 7 days" to="/local-outturn/history" />
      <StatCard icon={ClipboardCheck} color="blue" label="Total Local Outturn Records" value={totalRecords ?? "…"} description="All-time, system-wide" to="/local-outturn/history" />
    </StatGrid>
  );
}

function LockSealStats() {
  const [awaiting, setAwaiting] = useState<number | null>(null);
  const [totalRecords, setTotalRecords] = useState<number | null>(null);
  const [doneToday, setDoneToday] = useState<number | null>(null);
  const [thisWeek, setThisWeek] = useState<number | null>(null);

  useEffect(() => {
    getLockSealWorklist().then((res) => setAwaiting(res.data.length));
    getLockSealList().then((res) => {
      const todayStr = new Date().toLocaleDateString("en-CA");
      setTotalRecords(res.data.length);
      setDoneToday(res.data.filter((r) => r.lock_seal_datetime.slice(0, 10) === todayStr).length);
      setThisWeek(res.data.filter((r) => withinLastWeek(r.lock_seal_datetime)).length);
    });
  }, []);

  return (
    <StatGrid>
      <StatCard icon={Clock} color="amber" label="Awaiting Lock & Seal" value={awaiting ?? "…"} description="Local Outturn done, pending allocation" to="/lock-seal" />
      <StatCard icon={Lock} color="indigo" label="Recorded Today" value={doneToday ?? "…"} description="Lock & Seal recorded today" to="/lock-seal/history?today=1" />
      <StatCard icon={Lock} color="purple" label="This Week" value={thisWeek ?? "…"} description="Lock & Seal recorded, last 7 days" to="/lock-seal/history" />
      <StatCard icon={Lock} color="green" label="Total Lock & Seal Records" value={totalRecords ?? "…"} description="All-time, system-wide" to="/lock-seal/history" />
    </StatGrid>
  );
}

function BoardOutturnStats() {
  const [awaiting, setAwaiting] = useState<number | null>(null);
  const [totalRecords, setTotalRecords] = useState<number | null>(null);
  const [doneToday, setDoneToday] = useState<number | null>(null);
  const [thisWeek, setThisWeek] = useState<number | null>(null);

  useEffect(() => {
    getBoardOutturnWorklist().then((res) => setAwaiting(res.data.length));
    getBoardOutturnList().then((res) => {
      const todayStr = new Date().toLocaleDateString("en-CA");
      setTotalRecords(res.data.length);
      setDoneToday(res.data.filter((r) => r.board_outturn_datetime.slice(0, 10) === todayStr).length);
      setThisWeek(res.data.filter((r) => withinLastWeek(r.board_outturn_datetime)).length);
    });
  }, []);

  return (
    <StatGrid>
      <StatCard icon={Clock} color="amber" label="Awaiting Board Outturn" value={awaiting ?? "…"} description="Lock & Seal done, pending allocation" to="/board-outturn" />
      <StatCard icon={Landmark} color="indigo" label="Recorded Today" value={doneToday ?? "…"} description="Railway Board Outturn recorded today" to="/board-outturn/history?today=1" />
      <StatCard icon={Landmark} color="purple" label="This Week" value={thisWeek ?? "…"} description="Board Outturn recorded, last 7 days" to="/board-outturn/history" />
      <StatCard icon={Landmark} color="green" label="Total Board Outturn Records" value={totalRecords ?? "…"} description="All-time, system-wide" to="/board-outturn/history" />
    </StatGrid>
  );
}

function PhysicalDispatchStats() {
  const [awaiting, setAwaiting] = useState<number | null>(null);
  const [totalRecords, setTotalRecords] = useState<number | null>(null);
  const [doneToday, setDoneToday] = useState<number | null>(null);
  const [thisWeek, setThisWeek] = useState<number | null>(null);

  useEffect(() => {
    getPhysicalDispatchWorklist().then((res) => setAwaiting(res.data.length));
    getPhysicalDispatchList().then((res) => {
      const todayStr = new Date().toLocaleDateString("en-CA");
      setTotalRecords(res.data.length);
      setDoneToday(res.data.filter((r) => r.dispatch_datetime.slice(0, 10) === todayStr).length);
      setThisWeek(res.data.filter((r) => withinLastWeek(r.dispatch_datetime)).length);
    });
  }, []);

  return (
    <StatGrid>
      <StatCard icon={Clock} color="amber" label="Awaiting Dispatch" value={awaiting ?? "…"} description="Board Outturn done, pending allocation" to="/physical-dispatch" />
      <StatCard icon={Truck} color="indigo" label="Dispatched Today" value={doneToday ?? "…"} description="Physical Dispatch recorded today" to="/physical-dispatch/history?today=1" />
      <StatCard icon={Truck} color="purple" label="This Week" value={thisWeek ?? "…"} description="Dispatched, last 7 days" to="/physical-dispatch/history" />
      <StatCard icon={Truck} color="blue" label="Total Dispatch Records" value={totalRecords ?? "…"} description="All-time, system-wide" to="/physical-dispatch/history" />
    </StatGrid>
  );
}

function OutturnDispatchStats({ capabilities }: { capabilities: string[] }) {
  return (
    <>
      {capabilities.includes("LOCAL_OUTTURN") && <LocalOutturnStats />}
      {capabilities.includes("LOCK_SEAL") && <LockSealStats />}
      {capabilities.includes("BOARD_OUTTURN") && <BoardOutturnStats />}
      {capabilities.includes("PHYSICAL_DISPATCH") && <PhysicalDispatchStats />}
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
  LOCAL_OUTTURN: "Local Outturn",
  LOCK_SEAL: "Lock & Seal",
  BOARD_OUTTURN: "Railway Board Outturn",
  PHYSICAL_DISPATCH: "Physical Dispatch",
};

const ACTIVITY_COLOR: Record<RecentActivityRow["type"], string> = {
  SHELL_OUTTURN: "bg-amber-100 text-amber-700",
  FURNISHING_IN: "bg-purple-100 text-purple-700",
  PAINT_IN: "bg-blue-100 text-blue-700",
  PAINT_OUT: "bg-indigo-100 text-indigo-700",
  ASSEMBLY_IN: "bg-teal-100 text-teal-700",
  ASSEMBLY_OUT: "bg-green-100 text-green-700",
  LOCAL_OUTTURN: "bg-amber-100 text-amber-700",
  LOCK_SEAL: "bg-slate-200 text-slate-700",
  BOARD_OUTTURN: "bg-cyan-100 text-cyan-700",
  PHYSICAL_DISPATCH: "bg-rose-100 text-rose-700",
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
    user?.role &&
    [
      "ADMIN",
      "PAINT_ADMIN",
      "ASSEMBLY_ADMIN",
      "SHELL_PRODUCTION",
      "FURNISHING",
      "PAINT",
      "ASSEMBLY_PRODUCTION",
      "OUTTURN_DISPATCH",
    ].includes(user.role);
  // PAINT/ASSEMBLY_PRODUCTION/OUTTURN_DISPATCH have working modules, just
  // not necessarily configured for this specific login — different message
  // than a role with no module at all (e.g. MECHANICAL_INSPECTION, still
  // unbuilt).
  const isUnconfigured =
    !capabilitiesLoading &&
    items.length === 0 &&
    user?.role &&
    ["PAINT", "ASSEMBLY_PRODUCTION", "FURNISHING", "OUTTURN_DISPATCH"].includes(user.role);

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">Dashboard</h2>

      {user?.role === "ADMIN" && <AdminStats />}
      {user?.role === "PAINT_ADMIN" && <PaintAdminStats />}
      {user?.role === "ASSEMBLY_ADMIN" && <AssemblyAdminStats />}
      {user?.role === "SHELL_PRODUCTION" && <ShellProductionStats />}
      {user?.role === "FURNISHING" && capabilities.includes("FURNISHING") && <FurnishingStats />}
      {user?.role === "PAINT" && <PaintStats capabilities={capabilities} />}
      {user?.role === "ASSEMBLY_PRODUCTION" && <AssemblyStats capabilities={capabilities} />}
      {user?.role === "OUTTURN_DISPATCH" && <OutturnDispatchStats capabilities={capabilities} />}

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
