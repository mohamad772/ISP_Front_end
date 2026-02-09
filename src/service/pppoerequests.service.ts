import apiClient from "@/utils/apiClient";
import {
  PPPoERequest,
  CreatePPPoERequestRequest,
  ApprovePPPoERequestRequest,
  RejectPPPoERequestRequest,
  CompletePPPoERequestRequest,
  PPPoERequestFilters,
} from "@/types/api.types";

/**
 * Create a new PPPoE change request
 */
export async function createPPPoERequest(
  data: CreatePPPoERequestRequest,
): Promise<PPPoERequest> {
  const response = await apiClient.post("/pppoe-requests", data);
  return response.data;
}

/**
 * Get all PPPoE requests with filters
 */
export async function getAllPPPoERequests(
  filters?: PPPoERequestFilters,
): Promise<PPPoERequest[]> {
  const response = await apiClient.get("/pppoe-requests", { params: filters });
  return response.data;
}

/**
 * Get PPPoE request by ID
 */
export async function getPPPoERequestById(id: string): Promise<PPPoERequest> {
  const response = await apiClient.get(`/pppoe-requests/${id}`);
  return response.data;
}

/**
 * Update PPPoE request credentials
 */
/**
 * Approve PPPoE request
 */
export async function approvePPPoERequest(
  id: string,
  data?: ApprovePPPoERequestRequest,
): Promise<PPPoERequest> {
  const response = await apiClient.patch(
    `/pppoe-requests/${id}/approve`,
    data || {},
  );
  return response.data;
}

/**
 * Reject PPPoE request
 */
export async function rejectPPPoERequest(
  id: string,
  data: RejectPPPoERequestRequest,
): Promise<PPPoERequest> {
  const response = await apiClient.patch(`/pppoe-requests/${id}/reject`, data);
  return response.data;
}

/**
 * Complete PPPoE request (mark as completed)
 */
export async function completePPPoERequest(
  id: string,
  data?: CompletePPPoERequestRequest,
): Promise<PPPoERequest> {
  const response = await apiClient.patch(
    `/pppoe-requests/${id}/complete`,
    data || {},
  );
  return response.data;
}
