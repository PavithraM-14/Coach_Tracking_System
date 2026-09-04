import { apiRequest } from "./client";
import type { AssemblyInCreateResponse, AssemblyInListRow, AssemblyInLine, WorklistCoach } from "../types";

export function getAssemblyInLines(): Promise<{ data: AssemblyInLine[]; booked_count: number }> {
  return apiRequest("/assembly-in/lines.php");
}

export function getAssemblyInList(): Promise<{ data: AssemblyInListRow[] }> {
  return apiRequest("/assembly-in/list.php");
}

export function getAssemblyInWorklist(): Promise<{ data: WorklistCoach[] }> {
  return apiRequest("/assembly-in/worklist.php");
}

export interface AssemblyInCreateInput {
  coach_id: number;
  slot_id: number;
  assembly_in_date: string; // YYYY-MM-DD
  assembly_in_time: string; // HH:MM
  remarks?: string;
}

export function createAssemblyIn(input: AssemblyInCreateInput): Promise<AssemblyInCreateResponse> {
  return apiRequest("/assembly-in/create.php", {
    method: "POST",
    body: input,
  });
}
