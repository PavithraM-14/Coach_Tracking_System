import { apiRequest } from "./client";
import type { FurnishingInRow } from "../types";

export function getFurnishingInList(): Promise<{ data: FurnishingInRow[] }> {
  return apiRequest("/furnishing-in/list.php");
}
