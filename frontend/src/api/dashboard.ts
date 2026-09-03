import { apiRequest } from "./client";
import type { RecentActivityRow } from "../types";

export function getRecentActivity(): Promise<{ data: RecentActivityRow[] }> {
  return apiRequest("/dashboard/recent-activity.php");
}
