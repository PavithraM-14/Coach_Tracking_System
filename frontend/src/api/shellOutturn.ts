import { apiRequest } from "./client";
import type { ShellOutturnCreateResponse, WorklistCoach } from "../types";

export function getShellOutturnWorklist(): Promise<{ data: WorklistCoach[] }> {
  return apiRequest("/shell-outturn/worklist.php");
}

export interface ShellOutturnCreateInput {
  coach_id: number;
  outturn_date: string; // YYYY-MM-DD
  outturn_time: string; // HH:MM
  remarks?: string;
}

export function createShellOutturn(
  input: ShellOutturnCreateInput,
): Promise<ShellOutturnCreateResponse> {
  return apiRequest("/shell-outturn/create.php", {
    method: "POST",
    body: input,
  });
}
