import apiClient from "@/utils/apiClient";
import { AuditLog, AuditLogFilters } from "@/types/api.types";

/**
 * Get all audit logs with filters
 */
export async function getAllAuditLogs(
  filters?: AuditLogFilters,
): Promise<AuditLog[]> {
  const response = await apiClient.get("/audit-logs", { params: filters });
  return response.data;
}

/**
 * Get audit log by ID
 */
export async function getAuditLogById(id: string): Promise<AuditLog> {
  const response = await apiClient.get(`/audit-logs/${id}`);
  return response.data;
}
