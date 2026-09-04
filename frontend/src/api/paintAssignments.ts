import { apiRequest } from "./client";
import type { PaintMatrixCell, PaintMatrixResponse } from "../types";

export function getPaintTypeAssignments(): Promise<PaintMatrixResponse> {
  return apiRequest("/admin/paint_type_assignments_list.php");
}

export function savePaintTypeAssignments(assignments: PaintMatrixCell[]): Promise<{ saved: number }> {
  return apiRequest("/admin/paint_type_assignments_save.php", {
    method: "POST",
    body: { assignments },
  });
}
