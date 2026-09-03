import { useEffect, useState, type FormEvent } from "react";
import { getProductionOrders, createProductionOrder, getAdminLookups } from "../api/admin";
import type { AdminLookups, ProductionOrderRow } from "../types";
import { ApiError } from "../api/client";
import { ValidationMessage } from "../components/ui/ValidationMessage";

export function AdminProductionOrdersPage() {
  const [orders, setOrders] = useState<ProductionOrderRow[] | null>(null);
  const [lookups, setLookups] = useState<AdminLookups | null>(null);
  const [form, setForm] = useState({
    plant_id: "",
    production_year_id: "",
    coach_type_id: "",
    bo_number: "",
    bo_item: "",
    bo_date: "",
    from_serial: "",
    to_serial: "",
    installation_no: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    getProductionOrders().then((res) => setOrders(res.data));
    getAdminLookups().then(setLookups);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (
      !form.plant_id ||
      !form.production_year_id ||
      !form.coach_type_id ||
      !form.bo_number ||
      !form.bo_item ||
      !form.bo_date ||
      !form.from_serial ||
      !form.to_serial
    ) {
      setError("All fields except installation number are required.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createProductionOrder({
        plant_id: Number(form.plant_id),
        production_year_id: Number(form.production_year_id),
        coach_type_id: Number(form.coach_type_id),
        bo_number: form.bo_number,
        bo_item: Number(form.bo_item),
        bo_date: form.bo_date,
        from_serial: form.from_serial,
        to_serial: form.to_serial,
        installation_no: form.installation_no || undefined,
      });
      setSuccess(`BO ${result.bo_number}-${result.bo_item} created with ${result.coach_count} coaches.`);
      setForm({
        plant_id: "",
        production_year_id: "",
        coach_type_id: "",
        bo_number: "",
        bo_item: "",
        bo_date: "",
        from_serial: "",
        to_serial: "",
        installation_no: "",
      });
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create production order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">Production Orders (BO)</h2>
      <p className="mt-1 text-sm text-slate-500">
        Create SAP/BO production orders. Coaches are generated automatically for the entered
        serial range and become selectable across the app immediately.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 grid max-w-2xl grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <select
          value={form.plant_id}
          onChange={(e) => setForm({ ...form, plant_id: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Select plant</option>
          {lookups?.plants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.name}
            </option>
          ))}
        </select>
        <select
          value={form.production_year_id}
          onChange={(e) => setForm({ ...form, production_year_id: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Select production year</option>
          {lookups?.production_years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.year_code}
            </option>
          ))}
        </select>
        <select
          value={form.coach_type_id}
          onChange={(e) => setForm({ ...form, coach_type_id: e.target.value })}
          className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Select coach type</option>
          {lookups?.coach_types.map((ct) => (
            <option key={ct.id} value={ct.id}>
              {ct.name} ({ct.category_name})
            </option>
          ))}
        </select>
        <input
          placeholder="BO Number"
          value={form.bo_number}
          onChange={(e) => setForm({ ...form, bo_number: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="BO Item"
          type="number"
          value={form.bo_item}
          onChange={(e) => setForm({ ...form, bo_item: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <label className="col-span-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          BO Date
          <input
            type="date"
            value={form.bo_date}
            onChange={(e) => setForm({ ...form, bo_date: e.target.value })}
            className="mt-0.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal normal-case"
          />
        </label>
        <input
          placeholder="From Serial (e.g. 2848)"
          value={form.from_serial}
          onChange={(e) => setForm({ ...form, from_serial: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="To Serial (e.g. 2855)"
          value={form.to_serial}
          onChange={(e) => setForm({ ...form, to_serial: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Installation No. (optional)"
          value={form.installation_no}
          onChange={(e) => setForm({ ...form, installation_no: e.target.value })}
          className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />

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
          {submitting ? "Creating..." : "Create BO / Production Order"}
        </button>
      </form>

      {orders && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">BO Number</th>
                <th className="px-4 py-2">Coach Type</th>
                <th className="px-4 py-2">Plant</th>
                <th className="px-4 py-2">Production Year</th>
                <th className="px-4 py-2">Serial Range</th>
                <th className="px-4 py-2">Coaches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-2 font-medium text-slate-800">
                    {o.bo_number}-{o.bo_item}
                  </td>
                  <td className="px-4 py-2">{o.coach_type}</td>
                  <td className="px-4 py-2">{o.plant}</td>
                  <td className="px-4 py-2">{o.production_year}</td>
                  <td className="px-4 py-2">
                    {o.from_serial}–{o.to_serial}
                  </td>
                  <td className="px-4 py-2">{o.coach_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
