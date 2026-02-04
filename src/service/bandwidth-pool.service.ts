import apiClient from "@/utils/apiClient";
import { BandwidthPool, UpdateBandwidthPoolRequest } from "@/types/api.types";

/**
 * Get bandwidth pool summary
 */
export async function getBandwidthPool(): Promise<BandwidthPool> {
  const response = await apiClient.get("/bandwidth-pool");
  return response.data;
}

/**
 * Update bandwidth pool total capacity
 */
export async function updateBandwidthPool(
  data: UpdateBandwidthPoolRequest,
): Promise<BandwidthPool> {
  const response = await apiClient.patch("/bandwidth-pool", data);
  return response.data;
}
