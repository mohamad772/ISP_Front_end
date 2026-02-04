import apiClient from "@/utils/apiClient";
import {
  StaticIP,
  CreateStaticIPRequest,
  UpdateStaticIPRequest,
  StaticIPFilters,
} from "@/types/api.types";

/**
 * Create a new static IP
 */
export async function createStaticIP(
  data: CreateStaticIPRequest,
): Promise<StaticIP> {
  const response = await apiClient.post("/static-ip", data);
  return response.data;
}

/**
 * Get all static IPs with filters
 */
export async function getAllStaticIPs(
  filters?: StaticIPFilters,
): Promise<StaticIP[]> {
  const response = await apiClient.get("/static-ip", { params: filters });
  return response.data;
}

/**
 * Get static IP by ID
 */
export async function getStaticIPById(id: string): Promise<StaticIP> {
  const response = await apiClient.get(`/static-ip/${id}`);
  return response.data;
}

/**
 * Update static IP configuration
 */
export async function updateStaticIP(
  id: string,
  data: UpdateStaticIPRequest,
): Promise<StaticIP> {
  const response = await apiClient.patch(`/static-ip/${id}`, data);
  return response.data;
}

/**
 * Release static IP from assignment
 */
export async function releaseStaticIP(id: string): Promise<StaticIP> {
  const response = await apiClient.patch(`/static-ip/${id}/release`);
  return response.data;
}
