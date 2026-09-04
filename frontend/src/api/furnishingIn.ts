import { apiRequest } from "./client";
import type { FurnishingInCreateResponse, FurnishingInRow, FurnishingInWorklistCoach } from "../types";

export function getFurnishingInList(): Promise<{ data: FurnishingInRow[] }> {
  return apiRequest("/furnishing-in/list.php");
}

export function getFurnishingInWorklist(): Promise<{ data: FurnishingInWorklistCoach[] }> {
  return apiRequest("/furnishing-in/worklist.php");
}

export interface FurnishingInCreateInput {
  coach_id: number;
  furnishing_in_date: string; // YYYY-MM-DD
  furnishing_in_time: string; // HH:MM
  remarks?: string;
}

export function createFurnishingIn(
  input: FurnishingInCreateInput,
): Promise<FurnishingInCreateResponse> {
  return apiRequest("/furnishing-in/create.php", {
    method: "POST",
    body: input,
  });
}
