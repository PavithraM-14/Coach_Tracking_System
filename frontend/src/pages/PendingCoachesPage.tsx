import { useEffect, useState } from "react";
import type { WorklistCoach } from "../types";
import { ApiError } from "../api/client";
import { PendingCoachesTable } from "../components/ui/PendingCoachesTable";

interface PendingCoachesPageProps {
  title: string;
  description: string;
  emptyMessage: string;
  fetchWorklist: () => Promise<{ data: WorklistCoach[] }>;
}

// Generic "Pending Coaches" page — one component reused (with different
// props) for every stage's own sidebar entry, same idea as Shell
// Production's dedicated pending-list page next to Shell Outturn Entry.
export function PendingCoachesPage({ title, description, emptyMessage, fetchWorklist }: PendingCoachesPageProps) {
  const [coaches, setCoaches] = useState<WorklistCoach[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorklist()
      .then((res) => setCoaches(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load worklist."));
  }, [fetchWorklist]);

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {!error && <PendingCoachesTable coaches={coaches} emptyMessage={emptyMessage} />}
    </div>
  );
}
