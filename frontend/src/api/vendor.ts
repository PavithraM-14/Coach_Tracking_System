import { apiRequest } from "./client";
import type { VendorCoachRow } from "../types";

export function getVendorCoaches(): Promise<{ data: VendorCoachRow[] }> {
  return apiRequest("/vendor/coaches.php");
}
