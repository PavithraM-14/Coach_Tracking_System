import { apiRequest } from "./client";
import type { AssignmentSummary } from "../types";

// module is required for roles covering more than one pipeline stage
// (PAINT: PAINT/PAINT_OUT; ASSEMBLY_PRODUCTION: ASSEMBLY_IN/ASSEMBLY_OUT).
export function getMyAssignmentSummary(module?: string): Promise<AssignmentSummary> {
  const suffix = module ? `?module=${encodeURIComponent(module)}` : "";
  return apiRequest(`/assignments/my-summary.php${suffix}`);
}

// Which pipeline modules this employee is actually configured for (matrix
// cell / skill), not just role-eligible for — e.g. a PAINT user might only
// be set up for Paint In, only Paint Out, or both.
export function getMyCapabilities(): Promise<{ modules: string[] }> {
  return apiRequest("/assignments/my-capabilities.php");
}
