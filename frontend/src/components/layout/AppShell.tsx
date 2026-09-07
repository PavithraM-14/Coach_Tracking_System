import { useState, type ReactNode } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Factory,
  ClipboardCheck,
  PackageCheck,
  PaintBucket,
  Layers,
  LayoutGrid,
  LogOut,
  Menu,
  User,
  Lock,
  Landmark,
  Truck,
  Clock,
  Wrench,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { RoleCode } from "../../types";
import railwaysLogo from "../../assets/indian-railways-logo.svg";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: RoleCode[];
  // Modules covering more than one stage per role (PAINT: Paint In/Paint
  // Out; ASSEMBLY_PRODUCTION: Assembly In/Assembly Out; FURNISHING:
  // Furnishing In) are per-employee, not per-role — a login only sees a
  // stage's nav link if it's actually configured (matrix cell / skill) for
  // it, on top of passing the role check. See AuthContext's `capabilities`.
  module?: string;
}

// Strict allow-list: a role only ever sees the modules listed here.
// Line Management (Admin's read-only, multi-tab overview) and Paint In
// (the Paint employee's own data-entry page) are deliberately separate
// modules/pages now, not one shared component branching on role.
export const NAV_ITEMS: NavItem[] = [
  { to: "/admin/production-orders", label: "Production Orders", icon: FileText, roles: ["ADMIN"] },
  { to: "/admin/users", label: "User Management", icon: Users, roles: ["ADMIN", "PAINT_ADMIN", "ASSEMBLY_ADMIN"] },
  { to: "/admin/paint-assignments", label: "Paint Assignments", icon: LayoutGrid, roles: ["PAINT_ADMIN"] },
  { to: "/admin/assembly-assignments", label: "Assembly Assignments", icon: LayoutGrid, roles: ["ASSEMBLY_ADMIN"] },
  { to: "/admin/assembly-operations", label: "Assembly Operations", icon: Wrench, roles: ["ASSEMBLY_ADMIN"] },
  { to: "/line-management", label: "Line Management", icon: Layers, roles: ["ADMIN", "PAINT_ADMIN", "ASSEMBLY_ADMIN"] },
  { to: "/shell-production", label: "Shell Production", icon: Factory, roles: ["SHELL_PRODUCTION"] },
  { to: "/shell-outturn", label: "Shell Outturn", icon: ClipboardCheck, roles: ["SHELL_PRODUCTION"] },
  { to: "/furnishing-in/pending", label: "Furnishing Pending", icon: Clock, roles: ["FURNISHING"], module: "FURNISHING" },
  { to: "/furnishing-in", label: "Furnishing In", icon: PackageCheck, roles: ["FURNISHING"], module: "FURNISHING" },
  { to: "/paint-in/pending", label: "Paint In Pending", icon: Clock, roles: ["PAINT"], module: "PAINT" },
  { to: "/paint-in", label: "Paint In", icon: PaintBucket, roles: ["PAINT"], module: "PAINT" },
  { to: "/paint-out/pending", label: "Paint Out Pending", icon: Clock, roles: ["PAINT"], module: "PAINT_OUT" },
  { to: "/paint-out", label: "Paint Out", icon: PaintBucket, roles: ["PAINT"], module: "PAINT_OUT" },
  { to: "/assembly-in/pending", label: "Assembly In Pending", icon: Clock, roles: ["ASSEMBLY_PRODUCTION"], module: "ASSEMBLY_IN" },
  { to: "/assembly-in", label: "Assembly In", icon: Layers, roles: ["ASSEMBLY_PRODUCTION"], module: "ASSEMBLY_IN" },
  { to: "/assembly-out/pending", label: "Assembly Out Pending", icon: Clock, roles: ["ASSEMBLY_PRODUCTION"], module: "ASSEMBLY_OUT" },
  { to: "/assembly-out", label: "Assembly Out", icon: Layers, roles: ["ASSEMBLY_PRODUCTION"], module: "ASSEMBLY_OUT" },
  {
    to: "/assembly-operations",
    label: "Assembly Operations",
    icon: Wrench,
    roles: ["ASSEMBLY_OPERATION", "MECHANICAL_INSPECTION", "ELECTRICAL_INSPECTION"],
  },
  { to: "/local-outturn/pending", label: "Local Outturn Pending", icon: Clock, roles: ["OUTTURN_DISPATCH"], module: "LOCAL_OUTTURN" },
  { to: "/local-outturn", label: "Local Outturn", icon: ClipboardCheck, roles: ["OUTTURN_DISPATCH"], module: "LOCAL_OUTTURN" },
  { to: "/lock-seal/pending", label: "Lock & Seal Pending", icon: Clock, roles: ["OUTTURN_DISPATCH"], module: "LOCK_SEAL" },
  { to: "/lock-seal", label: "Lock & Seal", icon: Lock, roles: ["OUTTURN_DISPATCH"], module: "LOCK_SEAL" },
  { to: "/board-outturn/pending", label: "Board Outturn Pending", icon: Clock, roles: ["OUTTURN_DISPATCH"], module: "BOARD_OUTTURN" },
  { to: "/board-outturn", label: "Railway Board Outturn", icon: Landmark, roles: ["OUTTURN_DISPATCH"], module: "BOARD_OUTTURN" },
  { to: "/physical-dispatch/pending", label: "Physical Dispatch Pending", icon: Clock, roles: ["OUTTURN_DISPATCH"], module: "PHYSICAL_DISPATCH" },
  { to: "/physical-dispatch", label: "Physical Dispatch", icon: Truck, roles: ["OUTTURN_DISPATCH"], module: "PHYSICAL_DISPATCH" },
  { to: "/vendor/coaches", label: "My Coaches", icon: Building2, roles: ["VENDOR_SNI"] },
];

export function visibleNavItems(role: RoleCode | undefined, capabilities: string[] = []): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => item.roles.includes(role) && (!item.module || capabilities.includes(item.module)));
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
  }`;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout, capabilities } = useAuth();
  const items = visibleNavItems(user?.role, capabilities);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  function handleLogout() {
    logout();
    // A hard redirect (not useNavigate) so the auth-state update and the
    // route change can't race — ProtectedRoute would otherwise sometimes
    // win that race and send the now-logged-out user to /welcome instead.
    window.location.href = "/login";
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside
        className={`flex h-screen flex-shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white transition-all duration-200 ${
          sidebarOpen ? "w-60" : "w-0 border-r-0"
        }`}
      >
        <div className="flex w-60 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4">
            <img src={railwaysLogo} alt="" className="h-9 w-9 flex-shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Indian Railways
              </p>
              <span className="text-xl font-extrabold text-slate-900">CTS</span>
            </div>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            <NavLink to="/" end className={navLinkClass}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            {items.length === 0 && (
              <p className="px-3 py-2 text-xs text-slate-400">No modules assigned to this role yet.</p>
            )}
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} end className={navLinkClass}>
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
            <NavLink to="/profile" className={navLinkClass}>
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <User size={14} />
              </span>
              My Profile
            </NavLink>
          </nav>
          <div className="border-t border-slate-100 px-3 py-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600"
            >
              <LogOut size={18} />
              Log out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <header className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <Menu size={20} />
            </button>
            <img src={railwaysLogo} alt="Indian Railways" className="h-9 w-9 flex-shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-xs uppercase tracking-wide text-slate-400">Integral Coach Factory</p>
              <h1 className="truncate text-base font-semibold text-slate-900">Coach Tracking System</h1>
            </div>
          </div>
          {user && (
            <Link to="/profile" title="My Profile" className="flex flex-shrink-0 items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-800">
                  Welcome, <span className="font-semibold">{user.full_name}</span>
                </p>
                <p className="text-xs text-slate-500">{user.role}</p>
              </div>
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                {user.full_name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </Link>
          )}
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
