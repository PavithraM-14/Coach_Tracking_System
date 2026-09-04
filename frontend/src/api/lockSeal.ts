import { apiRequest } from "./client";
import type { LockSealCreateResponse, LockSealListRow, LockSealWorklistCoach } from "../types";

export function getLockSealList(): Promise<{ data: LockSealListRow[] }> {
  return apiRequest("/lock-seal/list.php");
}

export function getLockSealWorklist(): Promise<{ data: LockSealWorklistCoach[] }> {
  return apiRequest("/lock-seal/worklist.php");
}

export interface LockSealCreateInput {
  coach_id: number;
  lock_seal_date: string; // YYYY-MM-DD
  lock_seal_time: string; // HH:MM
  remarks?: string;
}

export function createLockSeal(input: LockSealCreateInput): Promise<LockSealCreateResponse> {
  return apiRequest("/lock-seal/create.php", {
    method: "POST",
    body: input,
  });
}
