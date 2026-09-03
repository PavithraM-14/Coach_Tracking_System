interface FieldReadOnlyProps {
  label: string;
  value: string | number | null | undefined;
}

export function FieldReadOnly({ label, value }: FieldReadOnlyProps) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value ?? "—"}</p>
    </div>
  );
}
