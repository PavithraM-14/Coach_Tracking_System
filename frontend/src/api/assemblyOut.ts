import { apiRequest } from "./client";
import type { AssemblyOutCreateResponse, AssemblyOutListRow, WorklistCoach } from "../types";

export function getAssemblyOutList(): Promise<{ data: AssemblyOutListRow[] }> {
  return apiRequest("/assembly-out/list.php");
}

export function getAssemblyOutWorklist(): Promise<{ data: WorklistCoach[] }> {
  return apiRequest("/assembly-out/worklist.php");
}

export interface AssemblyOutCreateInput {
  coach_id: number;
  assembly_out_date: string; // YYYY-MM-DD
  assembly_out_time: string; // HH:MM
  remarks?: string;
}

export function createAssemblyOut(input: AssemblyOutCreateInput): Promise<AssemblyOutCreateResponse> {
  return apiRequest("/assembly-out/create.php", {
    method: "POST",
    body: input,
  });
}
