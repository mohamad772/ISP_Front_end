import apiClient from "@/utils/apiClient";
import {
  Client,
  CreateClientRequest,
  UpdateClientRequest,
  SuspendClientRequest,
  UpdateConnectionTypeRequest,
  AssignStaticIPRequest,
  PaginatedClients,
  ClientFilters,
  UserRole,
} from "@/types/api.types";
import { useStore } from "@/store/auth-store";

/**
 * Create a new client
 */
export async function createClient(data: CreateClientRequest): Promise<Client> {
  const currentUser = useStore.getState().user;
  const isPosManager = currentUser?.role === UserRole.POS_MANAGER;
  const effectivePosId = isPosManager ? currentUser?.posId : data.posId;

  if (!effectivePosId) {
    throw new Error("POS ID is required to create a client.");
  }

  const response = await apiClient.post("/clients", {
    ...data,
    posId: effectivePosId,
  });
  return response.data;
}

/**
 * Get all clients with pagination and filters
 */
export async function getAllClients(
  filters?: ClientFilters,
): Promise<PaginatedClients> {
  const response = await apiClient.get("/clients", { params: filters });
  const data = response.data;
  if (Array.isArray(data)) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? data.length;
    return {
      data,
      total: data.length,
      page,
      limit,
    };
  }
  return data;
}

/**
 * Get client by ID
 */
export async function getClientById(id: string): Promise<Client> {
  const response = await apiClient.get(`/clients/${id}`);
  return response.data;
}

/**
 * Update client information
 */
export async function updateClient(
  id: string,
  data: UpdateClientRequest,
): Promise<Client> {
  const response = await apiClient.patch(`/clients/${id}`, data);
  return response.data;
}

/**
 * Activate client
 */
export async function activateClient(id: string): Promise<Client> {
  const response = await apiClient.patch(`/clients/${id}/activate`);
  return response.data;
}

/**
 * Suspend client
 */
export async function suspendClient(
  id: string,
  data: SuspendClientRequest,
): Promise<Client> {
  const response = await apiClient.patch(`/clients/${id}/suspend`, data);
  return response.data;
}

/**
 * Terminate client
 */
export async function terminateClient(id: string): Promise<Client> {
  const response = await apiClient.patch(`/clients/${id}/terminate`);
  return response.data;
}

/**
 * Update client connection type
 */
export async function updateConnectionType(
  id: string,
  data: UpdateConnectionTypeRequest,
): Promise<Client> {
  const response = await apiClient.patch(
    `/clients/${id}/connection-type`,
    data,
  );
  return response.data;
}

/**
 * Assign static IP to client
 */
export async function assignStaticIP(
  id: string,
  data: AssignStaticIPRequest,
): Promise<Client> {
  const response = await apiClient.post(
    `/clients/${id}/static-ip/assign`,
    data,
  );
  return response.data;
}

/**
 * Release static IP from client
 */
export async function releaseStaticIP(id: string): Promise<Client> {
  const response = await apiClient.patch(`/clients/${id}/static-ip/release`);
  return response.data;
}
