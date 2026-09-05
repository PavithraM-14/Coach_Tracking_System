import { Navigate, useNavigate } from "react-router-dom";
import { Factory, PackageCheck, PaintBucket, Layers, Truck, type LucideIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import railwaysLogo from "../assets/indian-railways-logo.svg";

interface Stage {
  icon: LucideIcon;
  label: string;
}

const STAGES: Stage[] = [
  { icon: Factory, label: "Shell Outturn" },
  { icon: PackageCheck, label: "Furnishing" },
  { icon: PaintBucket, label: "Paint" },
  { icon: Layers, label: "Assembly" },
  { icon: Truck, label: "Dispatch" },
];

export function WelcomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center gap-2 border-b border-slate-200 bg-white px-6 py-4">
        <img src={railwaysLogo} alt="" className="h-8 w-8 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Indian Railways</p>
          <span className="text-lg font-extrabold text-slate-900">CTS</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <img src={railwaysLogo} alt="Indian Railways" className="h-20 w-20" />

        <h1 className="mt-6 text-3xl font-bold text-slate-900 sm:text-4xl">Integral Coach Factory</h1>
        <p className="mt-1 text-sm text-slate-500">Chennai</p>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Coach Tracking System</p>
        <p className="mt-3 max-w-md text-sm text-slate-500">
          End-to-end visibility of every coach, from shell outturn to final dispatch.
        </p>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-8 rounded-lg bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Login
        </button>

        <div className="mt-14 flex w-full max-w-3xl flex-wrap items-stretch justify-center gap-3">
          {STAGES.map(({ icon: Icon, label }, i) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex w-24 flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Icon size={16} />
                </div>
                <p className="text-[11px] font-medium text-slate-600">{label}</p>
              </div>
              {i < STAGES.length - 1 && <span className="hidden text-slate-300 sm:inline">→</span>}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
