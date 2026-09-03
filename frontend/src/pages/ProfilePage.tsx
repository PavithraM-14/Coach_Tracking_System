import { useEffect, useState, type FormEvent } from "react";
import { getMyProfile, changePassword } from "../api/profile";
import type { MyProfile } from "../types";
import { ApiError } from "../api/client";
import { FieldReadOnly } from "../components/ui/FieldReadOnly";
import { ValidationMessage } from "../components/ui/ValidationMessage";

export function ProfilePage() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMyProfile().then(setProfile);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to change password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">My Profile</h2>

      {profile && (
        <div className="mt-4 grid max-w-xl grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <FieldReadOnly label="Full Name" value={profile.full_name} />
          <FieldReadOnly label="Employee No." value={profile.employee_no} />
          <FieldReadOnly label="Username" value={profile.username} />
          <FieldReadOnly label="Role" value={profile.role_name} />
          {profile.skills.length > 0 && (
            <div className="col-span-2">
              <FieldReadOnly label="Skills" value={profile.skills.join(", ")} />
            </div>
          )}
          <FieldReadOnly label="Account Created" value={profile.created_at} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Change Password</h3>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Current Password
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          New Password
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Confirm New Password
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        {error && <ValidationMessage kind="error" message={error} />}
        {success && <ValidationMessage kind="success" message={success} />}

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Updating..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
