import { apiRequest } from "./client";
import type { FurnishingOutCreateResponse, WorklistCoach } from "../types";

export function getFurnishingOutWorklist(): Promise<{ data: WorklistCoach[] }> {
  return apiRequest("/furnishing-out/worklist.php");
}

export interface FurnishingOutCreateInput {
  coach_id: number;
  furnishing_out_date: string; // YYYY-MM-DD
  furnishing_out_time: string; // HH:MM
  remarks?: string;
}

export function createFurnishingOut(
  input: FurnishingOutCreateInput,
): Promise<FurnishingOutCreateResponse> {
  return apiRequest("/furnishing-out/create.php", {
    method: "POST",
    body: input,
  });
}
