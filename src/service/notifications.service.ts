import apiClient from "@/utils/apiClient";
import { Notification } from "@/types/api.types";

export async function getMyNotifications(limit?: number): Promise<Notification[]> {
  const response = await apiClient.get("/notifications/me", {
    params: limit ? { limit } : undefined,
  });
  return response.data;
}

export async function registerDevice(token: string): Promise<void> {
  await apiClient.post("/notifications/register-device", { token , channel: "FIREBASE" });
}
