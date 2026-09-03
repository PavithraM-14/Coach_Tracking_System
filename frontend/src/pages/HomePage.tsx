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
import { getShellOutturnWorklist } from "../api/shellOutturn";
import { getFurnishingInList } from "../api/furnishingIn";
import { getFurnishingOutWorklist } from "../api/furnishingOut";
import { getPaintInWorklist, getPaintLines } from "../api/paintIn";
import { getUsers, getProductionOrders, getAdminDashboardStats } from "../api/admin";
import { getRecentActivity } from "../api/dashboard";
import type { RecentActivityRow } from "../types";
import { formatDateTime } from "../utils/dateFormat";

interface StatCardProps {
  icon: LucideIcon;
  color: "blue" | "amber" | "green" | "purple" | "indigo";
  label: string;
  value: number | string;
  description: string;
  to?: string;
}

const COLOR_CLASSES: Record<StatCardProps["color"], string> = {
  blue: "bg-blue-100 text-blue-600",
  amber: "bg-amber-100 text-amber-600",
  green: "bg-green-100 text-green-600",
  purple: "bg-purple-100 text-purple-600",
  indigo: "bg-indigo-100 text-indigo-600",
};

function StatCard({ icon: Icon, color, label, value, description, to }: StatCardProps) {
  const content = (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${COLOR_CLASSES[color]}`}>
        <Icon size={20} />
      </div>
      <p className="mt-3 text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
      {to && <p className="mt-auto pt-2 text-xs font-medium text-blue-600">Click to view →</p>}
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
  return <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

function AdminStats() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [boCount, setBoCount] = useState<number | null>(null);
  const [coachCount, setCoachCount] = useState<number | null>(null);
  const [pendingShell, setPendingShell] = useState<number | null>(null);
  const [awaitingFurnOut, setAwaitingFurnOut] = useState<number | null>(null);
  const [awaitingPaint, setAwaitingPaint] = useState<number | null>(null);
  const [queued, setQueued] = useState<number | null>(null);

  useEffect(() => {
    getUsers().then((res) => setUserCount(res.data.length));
    getProductionOrders().then((res) => {
      setBoCount(res.data.length);
      setCoachCount(res.data.reduce((sum, o) => sum + o.coach_count, 0));
    });
    getAdminDashboardStats().then((stats) => {
      setPendingShell(stats.pending_shell_outturn);
      setAwaitingFurnOut(stats.awaiting_furnishing_out);
      setAwaitingPaint(stats.awaiting_paint_in);
      setQueued(stats.queued_for_assignment);
    });
  }, []);

  return (
    <StatGrid>
      <StatCard icon={Users} color="blue" label="Total Users" value={userCount ?? "…"} description="Across all roles" to="/admin/users" />
      <StatCard icon={FileText} color="amber" label="BOs / Production Orders" value={boCount ?? "…"} description="SAP/BO plan entries" to="/admin/production-orders" />
      <StatCard icon={Layers} color="green" label="Total Coaches" value={coachCount ?? "…"} description="Generated from BO serial ranges" to="/admin/production-orders" />
      <StatCard icon={ClipboardList} color="amber" label="Pending Shell Outturn" value={pendingShell ?? "…"} description="System-wide, all coaches" />
      <StatCard icon={PackageCheck} color="purple" label="Awaiting Furnishing Out" value={awaitingFurnOut ?? "…"} description="Furnishing In done, Out pending" />
      <StatCard icon={PaintBucket} color="blue" label="Awaiting Paint In" value={awaitingPaint ?? "…"} description="Furnished-out, not yet painted" to="/line-management" />
      <StatCard icon={ListChecks} color="indigo" label="Queued for Assignment" value={queued ?? "…"} description="Awaiting a skilled employee with capacity" />
    </StatGrid>
  );
}

function ShellProductionStats() {
  const [pending, setPending] = useState<number | null>(null);

  useEffect(() => {
    getShellOutturnWorklist().then((res) => setPending(res.data.length));
  }, []);

  return (
    <StatGrid>
      <StatCard
        icon={ClipboardList}
        color="amber"
        label="Pending Shell Outturn"
        value={pending ?? "…"}
        description="Coaches awaiting Shell Outturn entry"
        to="/shell-outturn"
      />
      <StatCard icon={Factory} color="blue" label="Shell Production" value="View" description="Full pending worklist" to="/shell-production" />
    </StatGrid>
  );
}

function FurnishingStats() {
  const [awaitingOut, setAwaitingOut] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [completed, setCompleted] = useState<number | null>(null);

  useEffect(() => {
    getFurnishingOutWorklist().then((res) => setAwaitingOut(res.data.length));
    getFurnishingInList().then((res) => {
      setTotal(res.data.length);
      setCompleted(res.data.filter((r) => r.status === "FURNISHING_OUT").length);
    });
  }, []);

  return (
    <StatGrid>
      <StatCard icon={Clock} color="amber" label="Awaiting Furnishing Out" value={awaitingOut ?? "…"} description="Furnishing In done, Out pending" to="/furnishing-in" />
      <StatCard icon={CheckCircle2} color="green" label="Furnishing Out Completed" value={completed ?? "…"} description="Now eligible for Paint In" to="/furnishing-in" />
      <StatCard icon={ClipboardList} color="blue" label="Total Furnishing In Records" value={total ?? "…"} description="All-time count" to="/furnishing-in" />
      <StatCard icon={PackageCheck} color="purple" label="Furnishing In / Out" value="Open" description="Go to worklist" to="/furnishing-in" />
    </StatGrid>
  );
}

function PaintStats() {
  const [awaiting, setAwaiting] = useState<number | null>(null);
  const [occupied, setOccupied] = useState<number | null>(null);
  const [available, setAvailable] = useState<number | null>(null);

  useEffect(() => {
    getPaintInWorklist().then((res) => setAwaiting(res.data.length));
    getPaintLines().then((res) => {
      const occ = res.data.reduce((sum, l) => sum + l.occupied_slots, 0);
      const total = res.data.reduce((sum, l) => sum + l.total_slots, 0);
      setOccupied(occ);
      setAvailable(total - occ);
    });
  }, []);

  return (
    <StatGrid>
      <StatCard icon={Clock} color="amber" label="Awaiting Paint In" value={awaiting ?? "…"} description="Furnished-out coaches pending allocation" to="/line-management" />
      <StatCard icon={PaintBucket} color="blue" label="Occupied Slots" value={occupied ?? "…"} description="Currently in paint lines" to="/line-management" />
      <StatCard icon={CheckCircle2} color="green" label="Available Slots" value={available ?? "…"} description="Free capacity across all lines" to="/line-management" />
    </StatGrid>
  );
}

const ACTIVITY_LABEL: Record<RecentActivityRow["type"], string> = {
  SHELL_OUTTURN: "Shell Outturn",
  FURNISHING_OUT: "Furnishing Out",
  PAINT_IN: "Paint In",
};

const ACTIVITY_COLOR: Record<RecentActivityRow["type"], string> = {
  SHELL_OUTTURN: "bg-amber-100 text-amber-700",
  FURNISHING_OUT: "bg-purple-100 text-purple-700",
  PAINT_IN: "bg-blue-100 text-blue-700",
};

function RecentActivity() {
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
          {filtered.map((row, i) => (
            <div key={i} className="flex items-center justify-between py-3">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HomePage() {
  const { user } = useAuth();
  const items = visibleNavItems(user?.role);
  const hasActivityFeed = user?.role && ["ADMIN", "SHELL_PRODUCTION", "FURNISHING", "PAINT"].includes(user.role);

  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>

      {user?.role === "ADMIN" && <AdminStats />}
      {user?.role === "SHELL_PRODUCTION" && <ShellProductionStats />}
      {user?.role === "FURNISHING" && <FurnishingStats />}
      {user?.role === "PAINT" && <PaintStats />}

      {hasActivityFeed && <RecentActivity />}

      {items.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">
          No modules have been built for this role yet. Check back once that module is available.
        </p>
      )}
    </div>
  );
}
