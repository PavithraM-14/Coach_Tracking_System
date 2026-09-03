import { Fragment, useEffect, useState, type FormEvent } from "react";
import { createUser, deleteUser, getRoles, getUsers, getSkills, updateUserSkills } from "../api/admin";
import type { AdminUserRow, RoleOption, Skill } from "../types";
import { ApiError } from "../api/client";
import { ValidationMessage } from "../components/ui/ValidationMessage";
import { useAuth } from "../context/AuthContext";

const SKILL_ROLE_CODES = ["FURNISHING", "PAINT"];

function SkillEditor({ user, skills, onSaved }: { user: AdminUserRow; skills: Skill[]; onSaved: () => void }) {
  const [selected, setSelected] = useState<number[]>(user.skills.map((s) => s.id));
  const [saving, setSaving] = useState(false);
  const roleSkills = skills.filter((s) => s.role_code === user.role);

  function toggle(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function save() {
    setSaving(true);
    try {
      await updateUserSkills(user.id, selected);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap gap-3">
        {roleSkills.map((skill) => (
          <label key={skill.id} className="flex items-center gap-1.5 text-xs text-slate-700">
            <input type="checkbox" checked={selected.includes(skill.id)} onChange={() => toggle(skill.id)} />
            {skill.name}
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-2 rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Skills"}
      </button>
    </div>
  );
}

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [roles, setRoles] = useState<RoleOption[] | null>(null);
  const [skills, setSkills] = useState<Skill[] | null>(null);
  const [form, setForm] = useState({ employee_no: "", full_name: "", username: "", password: "", role_id: "" });
  const [newUserSkillIds, setNewUserSkillIds] = useState<number[]>([]);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    getUsers().then((res) => setUsers(res.data));
    getRoles().then((res) => setRoles(res.data));
    getSkills().then((res) => setSkills(res.data));
  }

  useEffect(() => {
    reload();
  }, []);

  const selectedRoleCode = roles?.find((r) => String(r.id) === form.role_id)?.code;
  const skillsForSelectedRole = selectedRoleCode
    ? skills?.filter((s) => s.role_code === selectedRoleCode) ?? []
    : [];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.employee_no || !form.full_name || !form.username || !form.password || !form.role_id) {
      setError("All fields are required.");
      return;
    }

    setSubmitting(true);
    try {
      await createUser({
        employee_no: form.employee_no,
        full_name: form.full_name,
        username: form.username,
        password: form.password,
        role_id: Number(form.role_id),
        skill_ids: newUserSkillIds,
      });
      setSuccess(`User "${form.username}" created.`);
      setForm({ employee_no: "", full_name: "", username: "", password: "", role_id: "" });
      setNewUserSkillIds([]);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(u: AdminUserRow) {
    setError(null);
    setSuccess(null);
    setDeletingUserId(u.id);
    try {
      const result = await deleteUser(u.id);
      setSuccess(result.message);
      setConfirmingDeleteId(null);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete user.");
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">User Management</h2>
      <p className="mt-1 text-sm text-slate-500">
        Create logins for each role and, for Furnishing/Paint employees, assign the skills that
        drive the auto-assignment queue.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 grid max-w-2xl grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          placeholder="Employee No."
          value={form.employee_no}
          onChange={(e) => setForm({ ...form, employee_no: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Full Name"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={form.role_id}
          onChange={(e) => {
            setForm({ ...form, role_id: e.target.value });
            setNewUserSkillIds([]);
          }}
          className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Select role</option>
          {roles?.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        {selectedRoleCode && !SKILL_ROLE_CODES.includes(selectedRoleCode) && (
          <p className="col-span-2 -mt-1 text-xs text-slate-400">
            Skills only apply to Furnishing and Paint roles — nothing to configure for this role.
          </p>
        )}

        {selectedRoleCode && SKILL_ROLE_CODES.includes(selectedRoleCode) && (
          <div className="col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Skills (which coach categories can this employee work on)
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              {skillsForSelectedRole.map((skill) => (
                <label key={skill.id} className="flex items-center gap-1.5 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={newUserSkillIds.includes(skill.id)}
                    onChange={() =>
                      setNewUserSkillIds((prev) =>
                        prev.includes(skill.id) ? prev.filter((id) => id !== skill.id) : [...prev, skill.id],
                      )
                    }
                  />
                  {skill.name}
                </label>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="col-span-2">
            <ValidationMessage kind="error" message={error} />
          </div>
        )}
        {success && (
          <div className="col-span-2">
            <ValidationMessage kind="success" message={success} />
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="col-span-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create User"}
        </button>
      </form>

      {users && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Employee No.</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Username</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Skills</th>
                <th className="px-4 py-2">Active</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <Fragment key={u.id}>
                  <tr>
                    <td className="px-4 py-2">{u.employee_no}</td>
                    <td className="px-4 py-2">{u.full_name}</td>
                    <td className="px-4 py-2">{u.username}</td>
                    <td className="px-4 py-2">{u.role}</td>
                    <td className="px-4 py-2">
                      {u.skills.length > 0 ? u.skills.map((s) => s.name).join(", ") : "—"}
                    </td>
                    <td className="px-4 py-2">{u.is_active ? "Yes" : "No"}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {SKILL_ROLE_CODES.includes(u.role) && (
                          <button
                            type="button"
                            onClick={() => setEditingUserId(editingUserId === u.id ? null : u.id)}
                            className="text-xs font-medium text-blue-600 hover:underline"
                          >
                            {editingUserId === u.id ? "Close" : "Edit Skills"}
                          </button>
                        )}
                        {currentUser?.id !== u.id && confirmingDeleteId !== u.id && (
                          <button
                            type="button"
                            onClick={() => setConfirmingDeleteId(u.id)}
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                        {confirmingDeleteId === u.id && (
                          <span className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500">Delete?</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(u)}
                              disabled={deletingUserId === u.id}
                              className="font-medium text-red-600 hover:underline disabled:opacity-50"
                            >
                              {deletingUserId === u.id ? "Deleting..." : "Confirm"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingDeleteId(null)}
                              className="font-medium text-slate-500 hover:underline"
                            >
                              Cancel
                            </button>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {editingUserId === u.id && skills && (
                    <tr>
                      <td colSpan={7} className="px-4 pb-3">
                        <SkillEditor
                          user={u}
                          skills={skills}
                          onSaved={() => {
                            setEditingUserId(null);
                            reload();
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
