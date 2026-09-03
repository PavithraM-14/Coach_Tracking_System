interface ValidationMessageProps {
  kind: "error" | "success";
  message: string;
}

export function ValidationMessage({ kind, message }: ValidationMessageProps) {
  const classes =
    kind === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-green-200 bg-green-50 text-green-700";

  return <div className={`mt-1 rounded border px-3 py-2 text-sm ${classes}`}>{message}</div>;
}
