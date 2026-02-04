import apiClient from "@/utils/apiClient";
import {
  Subscription,
  CreateSubscriptionRequest,
  RenewSubscriptionRequest,
  UpgradeSubscriptionRequest,
  UsageLog,
  CreateUsageLogRequest,
  SubscriptionFilters,
} from "@/types/api.types";

/**
 * Create a new subscription
 */
export async function createSubscription(
  data: CreateSubscriptionRequest,
): Promise<Subscription> {
  const response = await apiClient.post("/subscriptions", data);
  return response.data;
}

/**
 * Get all subscriptions with filters
 */
export async function getAllSubscriptions(
  filters?: SubscriptionFilters,
): Promise<Subscription[]> {
  const response = await apiClient.get("/subscriptions", { params: filters });
  return response.data;
}

/**
 * Get subscription by ID
 */
export async function getSubscriptionById(id: string): Promise<Subscription> {
  const response = await apiClient.get(`/subscriptions/${id}`);
  return response.data;
}

/**
 * Renew subscription
 */
export async function renewSubscription(
  id: string,
  data?: RenewSubscriptionRequest,
): Promise<Subscription> {
  const response = await apiClient.post(
    `/subscriptions/${id}/renew`,
    data || {},
  );
  return response.data;
}

/**
 * Upgrade subscription to a higher-tier plan
 */
export async function upgradeSubscription(
  id: string,
  data: UpgradeSubscriptionRequest,
): Promise<Subscription> {
  const response = await apiClient.post(`/subscriptions/${id}/upgrade`, data);
  return response.data;
}

/**
 * Terminate subscription
 */
export async function terminateSubscription(id: string): Promise<Subscription> {
  const response = await apiClient.patch(`/subscriptions/${id}/terminate`);
  return response.data;
}

/**
 * Create usage log for subscription
 */
export async function createUsageLog(
  subscriptionId: string,
  data: CreateUsageLogRequest,
): Promise<UsageLog> {
  const response = await apiClient.post(
    `/subscriptions/${subscriptionId}/usage-log`,
    data,
  );
  return response.data;
}

/**
 * Get usage logs for subscription
 */
export async function getUsageLogs(
  subscriptionId: string,
): Promise<UsageLog[]> {
  const response = await apiClient.get(
    `/subscriptions/${subscriptionId}/usage-log`,
  );
  return response.data;
}
