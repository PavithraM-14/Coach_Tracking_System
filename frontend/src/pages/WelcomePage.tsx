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
    <div className="flex min-h-screen flex-col bg-slate-50">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <img src={railwaysLogo} alt="Indian Railways" className="h-24 w-24" />

        <h1 className="mt-6 text-4xl font-bold text-slate-900 sm:text-5xl">Integral Coach Factory</h1>
        <p className="mt-2 text-lg text-slate-500">Chennai</p>

        <p className="mt-6 text-base font-semibold uppercase tracking-[0.2em] text-blue-600">
          Coach Tracking System
        </p>
        <p className="mt-3 max-w-lg text-base text-slate-500">
          End-to-end visibility of every coach, from shell outturn to final dispatch.
        </p>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-8 rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white hover:bg-blue-700"
        >
          Login
        </button>
      </main>
    </div>
  );
}
