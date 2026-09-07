import { apiRequest } from "./client";
import type { PaintRecordRow } from "../types";

export function getPaintRecords(): Promise<{ data: PaintRecordRow[] }> {
  return apiRequest("/paint-records/list.php");
}
