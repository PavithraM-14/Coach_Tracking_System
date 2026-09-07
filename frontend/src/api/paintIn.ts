import { apiRequest } from "./client";
import type { PaintInCreateResponse, PaintInListRow, PaintLine, WorklistCoach } from "../types";

export function getPaintLines(): Promise<{ data: PaintLine[]; booked_count: number }> {
  return apiRequest("/paint-in/lines.php");
}

export function setPaintLineActive(lineId: number, isActive: boolean): Promise<{ line_id: number; is_active: boolean }> {
  return apiRequest("/admin/paint_lines_set_active.php", {
    method: "POST",
    body: { line_id: lineId, is_active: isActive },
  });
}

export function setPaintSlotActive(slotId: number, isActive: boolean): Promise<{ slot_id: number; is_active: boolean }> {
  return apiRequest("/admin/paint_slots_set_active.php", {
    method: "POST",
    body: { slot_id: slotId, is_active: isActive },
  });
}

export function getPaintInList(): Promise<{ data: PaintInListRow[] }> {
  return apiRequest("/paint-in/list.php");
}

export function getPaintInWorklist(): Promise<{ data: WorklistCoach[] }> {
  return apiRequest("/paint-in/worklist.php");
}

export type VendorCode = "ICF" | "A" | "B" | "C";

export interface PaintInCreateInput {
  coach_id: number;
  slot_id: number;
  paint_in_date: string; // YYYY-MM-DD
  paint_in_time: string; // HH:MM
  remarks?: string;
  vendor: VendorCode;
}

export function createPaintIn(input: PaintInCreateInput): Promise<PaintInCreateResponse> {
  return apiRequest("/paint-in/create.php", {
    method: "POST",
    body: input,
  });
}

export interface MoveCoachInput {
  coach_id: number;
  to_slot_id: number;
}

export function movePaintCoach(
  input: MoveCoachInput,
): Promise<{ coach_number: string; paint_line: string; slot_number: number }> {
  return apiRequest("/paint-in/move.php", {
    method: "POST",
    body: input,
  });
}
