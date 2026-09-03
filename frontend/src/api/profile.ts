import { apiRequest } from "./client";
import type { MyProfile } from "../types";

export function getMyProfile(): Promise<MyProfile> {
  return apiRequest("/profile/me.php");
}

export function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  return apiRequest("/profile/change-password.php", {
    method: "POST",
    body: { current_password: currentPassword, new_password: newPassword },
  });
}
