import { apiRequest } from "./client";
import type { PaintMatrixCell, PaintMatrixResponse } from "../types";

// Structurally identical to the Paint matrix (coach type x employee grid,
// independent can_in/can_out per cell) — reuses the same response/cell
// shape rather than duplicating types.
export function getAssemblyTypeAssignments(): Promise<PaintMatrixResponse> {
  return apiRequest("/admin/assembly_type_assignments_list.php");
}

export function saveAssemblyTypeAssignments(assignments: PaintMatrixCell[]): Promise<{ saved: number }> {
  return apiRequest("/admin/assembly_type_assignments_save.php", {
    method: "POST",
    body: { assignments },
  });
}
