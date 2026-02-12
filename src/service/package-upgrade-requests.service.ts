import apiClient from "@/utils/apiClient";
import {
  PackageUpgradeRequest,
  CreatePackageUpgradeRequest,
  ApprovePackageUpgradeRequest,
  RejectPackageUpgradeRequest,
  PackageUpgradeRequestFilters,
} from "@/types/api.types";

export async function getPackageUpgradeRequests(
  filters?: PackageUpgradeRequestFilters,
): Promise<PackageUpgradeRequest[]> {
  const response = await apiClient.get("/package-upgrade-requests", {
    params: filters,
  });
  return response.data;
}

export async function getPackageUpgradeRequestById(
  id: string,
): Promise<PackageUpgradeRequest> {
  const response = await apiClient.get(`/package-upgrade-requests/${id}`);
  return response.data;
}

export async function createPackageUpgradeRequest(
  data: CreatePackageUpgradeRequest,
): Promise<PackageUpgradeRequest> {
  const response = await apiClient.post("/package-upgrade-requests", data);
  return response.data;
}

export async function approvePackageUpgradeRequest(
  id: string,
  data?: ApprovePackageUpgradeRequest,
): Promise<PackageUpgradeRequest> {
  const response = await apiClient.patch(
    `/package-upgrade-requests/${id}/approve`,
    data ?? {},
  );
  return response.data;
}

export async function rejectPackageUpgradeRequest(
  id: string,
  data: RejectPackageUpgradeRequest,
): Promise<PackageUpgradeRequest> {
  const response = await apiClient.patch(
    `/package-upgrade-requests/${id}/reject`,
    data,
  );
  return response.data;
}
