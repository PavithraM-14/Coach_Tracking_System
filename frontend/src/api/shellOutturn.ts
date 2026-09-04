import { apiRequest } from "./client";
import type {
  ShellOutturnBatchCreateResponse,
  ShellOutturnCreateResponse,
  ShellOutturnListRow,
  WorklistCoach,
} from "../types";

export function getShellOutturnWorklist(): Promise<{ data: WorklistCoach[] }> {
  return apiRequest("/shell-outturn/worklist.php");
}

export function getShellOutturnList(): Promise<{ data: ShellOutturnListRow[] }> {
  return apiRequest("/shell-outturn/list.php");
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

export interface ShellOutturnBatchCreateInput {
  coach_ids: number[];
  outturn_date: string; // YYYY-MM-DD
  outturn_time: string; // HH:MM
  remarks?: string;
}

export function createShellOutturnBatch(
  input: ShellOutturnBatchCreateInput,
): Promise<ShellOutturnBatchCreateResponse> {
  return apiRequest("/shell-outturn/create_batch.php", {
    method: "POST",
    body: input,
  });
}
