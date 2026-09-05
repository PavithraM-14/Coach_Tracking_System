import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import railwaysLogo from "../assets/indian-railways-logo.svg";

export function WelcomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 px-4 py-16 text-center">
      {/* Subtle railway-track pattern */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="tracks" width="64" height="64" patternUnits="userSpaceOnUse">
            <line x1="18" y1="0" x2="18" y2="64" stroke="white" strokeWidth="2" />
            <line x1="46" y1="0" x2="46" y2="64" stroke="white" strokeWidth="2" />
            <line x1="0" y1="10" x2="64" y2="10" stroke="white" strokeWidth="2" />
            <line x1="0" y1="34" x2="64" y2="34" stroke="white" strokeWidth="2" />
            <line x1="0" y1="58" x2="64" y2="58" stroke="white" strokeWidth="2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tracks)" />
      </svg>

      {/* Soft glow behind the emblem */}
      <div className="pointer-events-none absolute top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative flex flex-col items-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-300/80">
          Government of India &middot; Ministry of Railways
        </p>

        <img src={railwaysLogo} alt="Indian Railways" className="mt-6 h-24 w-24 drop-shadow-lg sm:h-28 sm:w-28" />

        <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
          Integral Coach <span className="text-blue-400">Factory</span>
        </h1>
        <p className="mt-2 text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Chennai</p>

        <p className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-blue-200/90 sm:text-base">
          Coach Tracking System
        </p>
        <p className="mt-3 max-w-md text-sm text-slate-400">
          End-to-end visibility of every coach, from shell outturn to final dispatch.
        </p>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-10 rounded-full bg-blue-600 px-10 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:bg-blue-500"
        >
          Login
        </button>
      </div>
    </div>
  );
}
