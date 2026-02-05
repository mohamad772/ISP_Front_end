import apiClient from "@/utils/apiClient";
import type {
  SystemSettings,
  UpdateSystemSettingsRequest,
  SystemHealth,
  ActiveSession,
} from "@/types/api.types";

export async function getSystemSettings(): Promise<SystemSettings> {
  const response = await apiClient.get("/settings");
  return response.data;
}

export async function updateSystemSettings(
  data: UpdateSystemSettingsRequest,
): Promise<SystemSettings> {
  const response = await apiClient.patch("/settings", data);
  return response.data;
}

export async function exportSystemData(): Promise<Blob> {
  const response = await apiClient.get("/system/export", {
    responseType: "blob",
  });
  return response.data;
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const response = await apiClient.get("/system/health");
  return response.data;
}

export async function clearSystemCache(): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.post("/system/cache/clear");
  return response.data;
}

export async function getActiveSessions(): Promise<ActiveSession[]> {
  const response = await apiClient.get("/sessions/active");
  return response.data;
}
