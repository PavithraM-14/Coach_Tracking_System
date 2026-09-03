import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import { ValidationMessage } from "../components/ui/ValidationMessage";
import railwaysLogo from "../assets/indian-railways-logo.svg";

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }
    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-10">
      <img src={railwaysLogo} alt="Indian Railways" className="h-24 w-24" />
      <h1 className="mt-4 text-center text-3xl font-bold text-slate-900">Coach Tracking System</h1>
      <p className="mt-1 text-sm text-slate-500">Integral Coach Factory, Chennai</p>
      <p className="mt-4 text-sm text-slate-500">Sign in to your account</p>

      <form onSubmit={handleSubmit} className="mt-6 w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <label className="block text-sm font-medium text-slate-700">
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. shell1"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoComplete="username"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Password
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <p className="mt-2 text-right text-sm">
          <Link to="/forgot-password" className="font-medium text-blue-600 hover:underline">
            Forgot password?
          </Link>
        </p>

        {error && <ValidationMessage kind="error" message={error} />}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
