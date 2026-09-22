import { apiRequest } from "./client";
import type { NotificationRow } from "../types";

export function getNotifications(): Promise<{ data: NotificationRow[]; unread_count: number }> {
  return apiRequest("/notifications/list.php");
}

export function markNotificationRead(id?: number): Promise<{ ok: boolean }> {
  return apiRequest("/notifications/mark_read.php", {
    method: "POST",
    body: id !== undefined ? { id } : {},
  });
}
