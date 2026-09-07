import { Fragment, useEffect, useState, type FormEvent } from "react";
import {
  createUser,
  deleteUser,
  getRoles,
  getUsers,
  getSkills,
  updateUserSkills,
  createSkill,
  getAdminLookups,
} from "../api/admin";
import type { AdminLookups, AdminUserRow, OperationCode, RoleOption, Skill } from "../types";
import { ApiError } from "../api/client";
import { ValidationMessage } from "../components/ui/ValidationMessage";
import { useAuth } from "../context/AuthContext";

// No PAINT or ASSEMBLY_PRODUCTION here: both moved to their own coach-type-
// level In/Out matrix (see Admin > Paint Assignments / Assembly
// Assignments) instead of this category-level skill checkbox model —
// keeping both would let the two disagree about who's eligible.
const SKILL_ROLE_CODES = ["FURNISHING", "OUTTURN_DISPATCH"] as const;

// Mirrors backend/lib/Operations.php — a skill is "can perform this operation
// on this coach category", not just a role/category tag.
const OPERATIONS: Array<{ code: OperationCode; label: string; live: boolean }> = [
  { code: "FURNISHING_IN", label: "Furnishing In", live: true },
  { code: "LOCAL_OUTTURN", label: "Local Outturn", live: true },
  { code: "LOCK_SEAL", label: "Lock & Seal", live: true },
  { code: "BOARD_OUTTURN", label: "Railway Board Outturn", live: true },
  { code: "PHYSICAL_DISPATCH", label: "Physical Dispatch", live: true },
];

function operationLabel(code: OperationCode): string {
  return OPERATIONS.find((o) => o.code === code)?.label ?? code;
}

function SkillMasterSection({ skills, onSkillsChanged }: { skills: Skill[]; onSkillsChanged: () => void }) {
  const [lookups, setLookups] = useState<AdminLookups | null>(null);
  const [name, setName] = useState("");
  const [operation, setOperation] = useState<OperationCode | "">("");
  const [coachCategoryId, setCoachCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getAdminLookups().then(setLookups);
  }, []);

  function updateNameSuggestion(nextOperation: OperationCode | "", nextCategoryId: string) {
    const categoryName = lookups?.coach_categories.find((c) => String(c.id) === nextCategoryId)?.name;
    if (nextOperation && categoryName) {
      setName(`${operationLabel(nextOperation)} - ${categoryName}`);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !operation || !coachCategoryId) {
      setError("Name, operation and coach category are all required.");
      return;
    }

    setSubmitting(true);
    try {
      await createSkill({ name: name.trim(), operation, coach_category_id: Number(coachCategoryId) });
      setSuccess(`Skill "${name.trim()}" added.`);
      setName("");
      setOperation("");
      setCoachCategoryId("");
      onSkillsChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create skill.");
    } finally {
      setSubmitting(false);
    }
  }

  const skillsByOperation = OPERATIONS.map((op) => ({
    ...op,
    skills: skills.filter((s) => s.operation === op.code),
  }));

  return (
    <div className="mt-4 max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800">Skill Master</h3>
      <p className="mt-1 text-xs text-slate-500">
        A skill is the ability to perform a specific operation on a coach category — the
        auto-assignment queue matches employees to work by operation, e.g. Paint In and Paint Out
        are tracked as separate skills even though both are the Paint role.
      </p>

      <form onSubmit={handleSubmit} className="mt-3 grid grid-cols-3 gap-2">
        <select
          value={operation}
          onChange={(e) => {
            const next = e.target.value as OperationCode | "";
            setOperation(next);
            updateNameSuggestion(next, coachCategoryId);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Operation</option>
          {OPERATIONS.map((op) => (
            <option key={op.code} value={op.code}>
              {op.label}
              {!op.live ? " (not live yet)" : ""}
            </option>
          ))}
        </select>
        <select
          value={coachCategoryId}
          onChange={(e) => {
            setCoachCategoryId(e.target.value);
            updateNameSuggestion(operation, e.target.value);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Coach category</option>
          {lookups?.coach_categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Skill name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />

        {operation && !OPERATIONS.find((o) => o.code === operation)?.live && (
          <p className="col-span-3 -mt-1 text-xs text-amber-600">
            This operation doesn't have a working page yet — the skill can be created and assigned
            now, but nothing will auto-assign against it until that module is built.
          </p>
        )}

        {error && (
          <div className="col-span-3">
            <ValidationMessage kind="error" message={error} />
          </div>
        )}
        {success && (
          <div className="col-span-3">
            <ValidationMessage kind="success" message={success} />
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="col-span-3 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add Skill"}
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {skillsByOperation
          .filter((op) => op.skills.length > 0)
          .map((op) => (
            <div key={op.code}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {op.label}
                {!op.live && " (not live yet)"}
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {op.skills.map((s) => (
                  <span key={s.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                    {s.name} <span className="text-slate-400">· {s.coach_category_name}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

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

// Paint Admin / Assembly Admin manage exactly one worker role each — the
// role dropdown always comes back from the backend with just that single
// option, so it's auto-selected and shown as a fixed label instead of a
// choice. Only the main Admin (with every other role available) sees a
// real dropdown, and Admin never sees PAINT/ASSEMBLY_PRODUCTION in it
// anymore — those are exclusively created by their scoped admin.
const SCOPED_ADMIN_ROLES = ["PAINT_ADMIN", "ASSEMBLY_ADMIN"] as const;

const PAGE_COPY: Record<string, { title: string; description: string }> = {
  PAINT_ADMIN: {
    title: "Paint Worker Management",
    description: "Add, and remove, logins for Paint Shop workers (Paint In / Paint Out).",
  },
  ASSEMBLY_ADMIN: {
    title: "Assembly Worker Management",
    description: "Add, and remove, logins for Assembly Shop workers (Assembly In / Assembly Out).",
  },
};

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const isScopedAdmin = SCOPED_ADMIN_ROLES.includes(currentUser?.role as (typeof SCOPED_ADMIN_ROLES)[number]);
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [roles, setRoles] = useState<RoleOption[] | null>(null);
  const [skills, setSkills] = useState<Skill[] | null>(null);
  const [form, setForm] = useState({
    employee_no: "",
    full_name: "",
    username: "",
    email: "",
    password: "",
    role_id: "",
  });
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
    // Skills only ever apply to Furnishing/Outturn-Dispatch workers (see
    // SKILL_ROLE_CODES below) — Paint Admin/Assembly Admin manage neither,
    // and the endpoint is Admin-only, so skip it entirely for them.
    if (!isScopedAdmin) {
      getSkills().then((res) => setSkills(res.data));
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A scoped admin's role list is always exactly one option — select it as
  // soon as it loads so the form is ready to submit without a manual pick.
  useEffect(() => {
    if (isScopedAdmin && roles && roles.length === 1 && !form.role_id) {
      setForm((f) => ({ ...f, role_id: String(roles[0].id) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScopedAdmin, roles]);

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
        email: form.email.trim() || undefined,
        password: form.password,
        role_id: Number(form.role_id),
        skill_ids: newUserSkillIds,
      });
      setSuccess(`User "${form.username}" created.`);
      setForm({ employee_no: "", full_name: "", username: "", email: "", password: "", role_id: "" });
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

  const copy = currentUser ? PAGE_COPY[currentUser.role] : undefined;

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">{copy?.title ?? "User Management"}</h2>
      <p className="mt-1 text-sm text-slate-500">
        {copy?.description ??
          "Create logins for each role and, for Furnishing/Paint employees, assign the skills that drive the auto-assignment queue."}
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
          placeholder="Email (for password reset)"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        {isScopedAdmin ? (
          <div className="col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Role: <span className="font-medium text-slate-800">{roles?.[0]?.name ?? "…"}</span>
          </div>
        ) : (
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
        )}
        <div className="col-span-2">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Skills</label>
          <select
            value=""
            disabled={
              !selectedRoleCode ||
              !SKILL_ROLE_CODES.includes(selectedRoleCode) ||
              skillsForSelectedRole.filter((s) => !newUserSkillIds.includes(s.id)).length === 0
            }
            onChange={(e) => {
              const id = Number(e.target.value);
              if (id) {
                setNewUserSkillIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
              }
            }}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">
              {!selectedRoleCode
                ? "Select a role first"
                : !SKILL_ROLE_CODES.includes(selectedRoleCode)
                  ? "No skills apply to this role"
                  : skillsForSelectedRole.filter((s) => !newUserSkillIds.includes(s.id)).length === 0
                    ? "All available skills added"
                    : "Add a skill..."}
            </option>
            {skillsForSelectedRole
              .filter((s) => !newUserSkillIds.includes(s.id))
              .map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
          </select>

          {newUserSkillIds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {newUserSkillIds.map((id) => {
                const skill = skills?.find((s) => s.id === id);
                if (!skill) return null;
                return (
                  <span
                    key={id}
                    className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                  >
                    {skill.name}
                    <button
                      type="button"
                      onClick={() => setNewUserSkillIds((prev) => prev.filter((x) => x !== id))}
                      className="text-slate-400 hover:text-slate-700"
                      aria-label={`Remove ${skill.name}`}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

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

      {skills && <SkillMasterSection skills={skills} onSkillsChanged={reload} />}

      {users && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Employee No.</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Username</th>
                <th className="px-4 py-2">Email</th>
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
                    <td className="px-4 py-2">{u.email ?? "—"}</td>
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
                      <td colSpan={8} className="px-4 pb-3">
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
