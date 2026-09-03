import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

interface DatePickerFieldProps {
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
}

function formatDisplay(date: Date): string {
  return date.toLocaleDateString("en-CA"); // YYYY-MM-DD, consistent across the app
}

export function DatePickerField({ label, value, onChange, placeholder }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-0.5 w-full rounded border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-800 hover:border-slate-400"
      >
        {value ? formatDisplay(value) : (placeholder ?? "Select a date")}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 rounded border border-slate-200 bg-white p-2 shadow-lg">
          <DayPicker
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date);
              setOpen(false);
            }}
            captionLayout="dropdown"
            defaultMonth={value}
          />
        </div>
      )}
    </div>
  );
}

export { formatDisplay as formatDateForDisplay };
