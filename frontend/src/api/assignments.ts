import { apiRequest } from "./client";
import type { AssignmentSummary } from "../types";

export function getMyAssignmentSummary(): Promise<AssignmentSummary> {
  return apiRequest("/assignments/my-summary.php");
}
