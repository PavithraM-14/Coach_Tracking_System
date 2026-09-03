import { apiRequest } from "./client";
import type { PaintInCreateResponse, PaintLine, WorklistCoach } from "../types";

export function getPaintLines(): Promise<{ data: PaintLine[]; booked_count: number }> {
  return apiRequest("/paint-in/lines.php");
}

export function getPaintInWorklist(): Promise<{ data: WorklistCoach[] }> {
  return apiRequest("/paint-in/worklist.php");
}

export interface PaintInCreateInput {
  coach_id: number;
  slot_id: number;
  paint_in_date: string; // YYYY-MM-DD
  paint_in_time: string; // HH:MM
  remarks?: string;
}

export function createPaintIn(input: PaintInCreateInput): Promise<PaintInCreateResponse> {
  return apiRequest("/paint-in/create.php", {
    method: "POST",
    body: input,
  });
}
