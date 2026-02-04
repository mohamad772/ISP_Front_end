import apiClient from "@/utils/apiClient";
import { SuspensionHistory, SuspensionHistoryFilters } from "@/types/api.types";

/**
 * Get all suspension history records with filters
 */
export async function getAllSuspensionHistory(
  filters?: SuspensionHistoryFilters,
): Promise<SuspensionHistory[]> {
  const response = await apiClient.get("/suspension-history", {
    params: filters,
  });
  return response.data;
}

/**
 * Get suspension history by ID
 */
export async function getSuspensionHistoryById(
  id: string,
): Promise<SuspensionHistory> {
  const response = await apiClient.get(`/suspension-history/${id}`);
  return response.data;
}
