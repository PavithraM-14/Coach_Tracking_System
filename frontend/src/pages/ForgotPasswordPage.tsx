import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { requestPasswordResetOtp, verifyPasswordResetOtp, resetPassword } from "../api/auth";
import { ApiError } from "../api/client";
import { ValidationMessage } from "../components/ui/ValidationMessage";
import railwaysLogo from "../assets/indian-railways-logo.svg";

type Step = "EMAIL" | "OTP" | "NEW_PASSWORD" | "SUCCESS";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordResetOtp(email.trim());
      setStep("OTP");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!otp.trim()) {
      setError("Enter the OTP sent to your email.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await verifyPasswordResetOtp(email.trim(), otp.trim());
      setResetToken(res.reset_token);
      setStep("NEW_PASSWORD");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid or expired OTP.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!newPassword || !confirmPassword) {
      setError("Both password fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(email.trim(), resetToken, newPassword);
      setStep("SUCCESS");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  }

  const stepCopy: Record<Step, { title: string; subtitle: string }> = {
    EMAIL: {
      title: "Forgot Password?",
      subtitle: "Enter your registered email address and we'll send you an OTP to reset your password",
    },
    OTP: {
      title: "Enter OTP",
      subtitle: `We've sent a 6-digit code to ${email}`,
    },
    NEW_PASSWORD: {
      title: "Set New Password",
      subtitle: "Choose a new password for your account",
    },
    SUCCESS: {
      title: "Password Reset",
      subtitle: "Your password has been changed successfully",
    },
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-10">
      <img src={railwaysLogo} alt="Indian Railways" className="h-24 w-24" />
      <h1 className="mt-4 text-center text-3xl font-bold text-slate-900">Coach Tracking System</h1>
      <p className="mt-1 text-sm text-slate-500">Integral Coach Factory, Chennai</p>

      <h2 className="mt-6 text-center text-xl font-bold text-slate-900">{stepCopy[step].title}</h2>
      <p className="mt-1 max-w-sm text-center text-sm text-slate-500">{stepCopy[step].subtitle}</p>

      <div className="mt-6 w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        {step === "EMAIL" && (
          <form onSubmit={handleSendOtp}>
            <label className="block text-sm font-medium text-slate-700">
              Email Address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@icf.railnet.gov.in"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoComplete="email"
                autoFocus
              />
            </label>

            {error && (
              <div className="mt-3">
                <ValidationMessage kind="error" message={error} />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Send OTP"}
            </button>

            <p className="mt-4 text-center text-sm text-slate-500">
              Remember your password?{" "}
              <Link to="/login" className="font-medium text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        )}

        {step === "OTP" && (
          <form onSubmit={handleVerifyOtp}>
            <label className="block text-sm font-medium text-slate-700">
              OTP
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="6-digit code"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-center text-lg tracking-[0.5em] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoComplete="one-time-code"
                autoFocus
              />
            </label>

            {error && (
              <div className="mt-3">
                <ValidationMessage kind="error" message={error} />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Verifying..." : "Verify OTP"}
            </button>

            <p className="mt-4 text-center text-sm text-slate-500">
              Didn't get it?{" "}
              <button
                type="button"
                onClick={() => {
                  setStep("EMAIL");
                  setOtp("");
                  setError(null);
                }}
                className="font-medium text-blue-600 hover:underline"
              >
                Try again
              </button>
            </p>
          </form>
        )}

        {step === "NEW_PASSWORD" && (
          <form onSubmit={handleResetPassword}>
            <label className="block text-sm font-medium text-slate-700">
              New Password
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoComplete="new-password"
                  autoFocus
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

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Confirm New Password
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoComplete="new-password"
              />
            </label>

            {error && (
              <div className="mt-3">
                <ValidationMessage kind="error" message={error} />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Reset Password"}
            </button>
          </form>
        )}

        {step === "SUCCESS" && (
          <div className="text-center">
            <p className="text-sm text-slate-600">
              Your password has been changed. You can now sign in with your new password.
            </p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
