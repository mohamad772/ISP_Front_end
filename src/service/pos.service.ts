import apiClient from "@/utils/apiClient";
import {
  POS,
  CreatePOSRequest,
  UpdatePOSRequest,
  UpdatePOSBandwidthRequest,
  AssignManagerRequest,
  Client,
  User,
} from "@/types/api.types";

/**
 * Create a new POS location
 */
export async function createPOS(data: CreatePOSRequest): Promise<POS> {
  const response = await apiClient.post("/pos", data);
  return response.data;
}

/**
 * Get all POS locations
 */
export async function getAllPOS(): Promise<POS[]> {
  const response = await apiClient.get("/pos");
  return response.data;
}

/**
 * Get POS by ID
 */
export async function getPOSById(id: string): Promise<POS> {
  const response = await apiClient.get(`/pos/${id}`);
  return response.data;
}

/**
 * Update POS location
 */
export async function updatePOS(
  id: string,
  data: UpdatePOSRequest,
): Promise<POS> {
  const response = await apiClient.patch(`/pos/${id}`, data);
  return response.data;
}

/**
 * Activate POS location
 */
export async function activatePOS(id: string): Promise<POS> {
  const response = await apiClient.patch(`/pos/${id}/activate`);
  return response.data;
}

/**
 * Deactivate POS location
 */
export async function deactivatePOS(id: string): Promise<POS> {
  const response = await apiClient.patch(`/pos/${id}/deactivate`);
  return response.data;
}

/**
 * Update POS bandwidth allocation
 */
export async function updatePOSBandwidth(
  id: string,
  data: UpdatePOSBandwidthRequest,
): Promise<POS> {
  const response = await apiClient.patch(`/pos/${id}/bandwidth`, data);
  return response.data;
}

/**
 * Get all clients for a POS
 */
export async function getPOSClients(id: string): Promise<Client[]> {
  const response = await apiClient.get(`/pos/${id}/clients`);
  return response.data;
}

/**
 * Get all managers for a POS
 */
export async function getPOSManagers(id: string): Promise<User[]> {
  const response = await apiClient.get(`/pos/${id}/managers`);
  return response.data;
}

/**
 * Assign manager to POS
 */
export async function assignManagerToPOS(
  id: string,
  data: AssignManagerRequest,
): Promise<void> {
  const response = await apiClient.post(`/pos/${id}/managers`, data);
  return response.data;
}

/**
 * Remove manager from POS
 */
export async function removeManagerFromPOS(
  id: string,
  userId: string,
): Promise<void> {
  const response = await apiClient.delete(`/pos/${id}/managers/${userId}`);
  return response.data;
}
