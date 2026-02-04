import apiClient from "@/utils/apiClient";
import {
  ServicePlan,
  CreateServicePlanRequest,
  UpdateServicePlanRequest,
  ServicePlanFilters,
} from "@/types/api.types";

/**
 * Create a new service plan
 */
export async function createServicePlan(
  data: CreateServicePlanRequest,
): Promise<ServicePlan> {
  const response = await apiClient.post("/service-plans", data);
  return response.data;
}

/**
 * Get all service plans with filters
 */
export async function getAllServicePlans(
  filters?: ServicePlanFilters,
): Promise<ServicePlan[]> {
  const response = await apiClient.get("/service-plans", { params: filters });
  return response.data;
}

/**
 * Get service plan by ID
 */
export async function getServicePlanById(id: string): Promise<ServicePlan> {
  const response = await apiClient.get(`/service-plans/${id}`);
  return response.data;
}

/**
 * Update service plan
 */
export async function updateServicePlan(
  id: string,
  data: UpdateServicePlanRequest,
): Promise<ServicePlan> {
  const response = await apiClient.patch(`/service-plans/${id}`, data);
  return response.data;
}

/**
 * Activate service plan
 */
export async function activateServicePlan(id: string): Promise<ServicePlan> {
  const response = await apiClient.patch(`/service-plans/${id}`, {
    isActive: true,
  });
  return response.data;
}

/**
 * Deactivate service plan
 */
export async function deactivateServicePlan(id: string): Promise<ServicePlan> {
  const response = await apiClient.patch(`/service-plans/${id}`, {
    isActive: false,
  });
  return response.data;
}
