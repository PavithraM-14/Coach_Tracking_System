import { apiRequest } from "./client";
import type { PhysicalDispatchCreateResponse, PhysicalDispatchListRow, PhysicalDispatchWorklistCoach } from "../types";

export function getPhysicalDispatchList(): Promise<{ data: PhysicalDispatchListRow[] }> {
  return apiRequest("/physical-dispatch/list.php");
}

export function getPhysicalDispatchWorklist(): Promise<{ data: PhysicalDispatchWorklistCoach[] }> {
  return apiRequest("/physical-dispatch/worklist.php");
}

export interface PhysicalDispatchCreateInput {
  coach_id: number;
  dispatch_date: string; // YYYY-MM-DD
  dispatch_time: string; // HH:MM
  remarks?: string;
}

export function createPhysicalDispatch(input: PhysicalDispatchCreateInput): Promise<PhysicalDispatchCreateResponse> {
  return apiRequest("/physical-dispatch/create.php", {
    method: "POST",
    body: input,
  });
}
