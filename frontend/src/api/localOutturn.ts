import { apiRequest } from "./client";
import type { LocalOutturnCreateResponse, LocalOutturnListRow, LocalOutturnWorklistCoach } from "../types";

export function getLocalOutturnList(): Promise<{ data: LocalOutturnListRow[] }> {
  return apiRequest("/local-outturn/list.php");
}

export function getLocalOutturnWorklist(): Promise<{ data: LocalOutturnWorklistCoach[] }> {
  return apiRequest("/local-outturn/worklist.php");
}

export type RailwayCode = "ICF" | "SR";

export interface LocalOutturnCreateInput {
  coach_id: number;
  local_outturn_date: string; // YYYY-MM-DD
  local_outturn_time: string; // HH:MM
  remarks?: string;
  outturn_serial_no: string;
  railway: RailwayCode;
}

export function createLocalOutturn(input: LocalOutturnCreateInput): Promise<LocalOutturnCreateResponse> {
  return apiRequest("/local-outturn/create.php", {
    method: "POST",
    body: input,
  });
}
