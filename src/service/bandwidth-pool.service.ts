import apiClient from "@/utils/apiClient";
import { BandwidthPool, UpdateBandwidthPoolRequest } from "@/types/api.types";

const normalizeBandwidthPool = (data: any): BandwidthPool => {
  const totalBandwidthMbps = Number(
    data?.totalBandwidthMbps ?? data?.totalBandwidth ?? 0,
  );
  const allocatedBandwidthMbps = Number(
    data?.allocatedBandwidthMbps ?? data?.allocatedMbps ?? data?.allocatedBandwidth ?? 0,
  );
  const availableBandwidthMbps = Number(
    data?.availableBandwidthMbps ?? data?.remainingMbps ?? data?.availableBandwidth ?? 0,
  );
  const updatedAt =
    data?.updatedAt ?? data?.poolUpdatedAt ?? new Date().toISOString();

  return {
    id: data?.id ?? "bandwidth-pool",
    totalBandwidthMbps,
    allocatedBandwidthMbps,
    availableBandwidthMbps,
    updatedAt,
  };
};

/**
 * Get bandwidth pool summary
 */
export async function getBandwidthPool(): Promise<BandwidthPool> {
  const response = await apiClient.get("/bandwidth-pool");
  return normalizeBandwidthPool(response.data);
}

/**
 * Update bandwidth pool total capacity
 */
export async function updateBandwidthPool(
  data: UpdateBandwidthPoolRequest,
): Promise<BandwidthPool> {
  const response = await apiClient.patch("/bandwidth-pool", data);
  return normalizeBandwidthPool(response.data);
}
