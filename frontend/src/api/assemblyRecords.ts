import { apiRequest } from "./client";
import type { AssemblyRecordRow } from "../types";

export function getAssemblyRecords(): Promise<{ data: AssemblyRecordRow[] }> {
  return apiRequest("/assembly-records/list.php");
}
