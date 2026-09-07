import { apiRequest } from "./client";
import type { PaintOutCreateResponse, PaintOutListRow, WorklistCoach } from "../types";

export function getPaintOutList(): Promise<{ data: PaintOutListRow[] }> {
  return apiRequest("/paint-out/list.php");
}

export function getPaintOutWorklist(): Promise<{ data: WorklistCoach[] }> {
  return apiRequest("/paint-out/worklist.php");
}

export interface PaintOutCreateInput {
  coach_id: number;
  paint_out_date: string; // YYYY-MM-DD
  paint_out_time: string; // HH:MM
  remarks?: string;
}

export function createPaintOut(input: PaintOutCreateInput): Promise<PaintOutCreateResponse> {
  return apiRequest("/paint-out/create.php", {
    method: "POST",
    body: input,
  });
}
