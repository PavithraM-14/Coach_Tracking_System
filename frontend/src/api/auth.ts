import { apiRequest } from "./client";
import type { LoginResponse } from "../types";

export function login(username: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login.php", {
    method: "POST",
    body: { username, password },
  });
}

export function requestPasswordResetOtp(email: string): Promise<{ message: string }> {
  return apiRequest("/auth/forgot_password_request.php", {
    method: "POST",
    body: { email },
  });
}

export function verifyPasswordResetOtp(email: string, otp: string): Promise<{ reset_token: string }> {
  return apiRequest("/auth/forgot_password_verify.php", {
    method: "POST",
    body: { email, otp },
  });
}

export function resetPassword(
  email: string,
  resetToken: string,
  newPassword: string,
): Promise<{ message: string }> {
  return apiRequest("/auth/forgot_password_reset.php", {
    method: "POST",
    body: { email, reset_token: resetToken, new_password: newPassword },
  });
}
