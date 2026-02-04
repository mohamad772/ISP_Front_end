import { getAllSubscriptions, getSubscriptionById, getUsageLogs, createSubscription, renewSubscription, upgradeSubscription, terminateSubscription, createUsageLog } from "@/service/Subscriptions.service";
import { Subscription } from "@/types/api.types";
import { SubscriptionFilters, UsageLog, CreateSubscriptionRequest, RenewSubscriptionRequest, UpgradeSubscriptionRequest, CreateUsageLogRequest } from "@/types/api.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";





export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  lists: () => [...subscriptionKeys.all, "list"] as const,
  list: (filters?: SubscriptionFilters) =>
    [...subscriptionKeys.lists(), { filters }] as const,
  details: () => [...subscriptionKeys.all, "detail"] as const,
  detail: (id: string) => [...subscriptionKeys.details(), id] as const,
  usageLogs: (id: string) =>
    [...subscriptionKeys.detail(id), "usageLogs"] as const,
};

export function useSubscriptions(
  filters?: SubscriptionFilters,
): UseQueryResult<Subscription[], Error> {
  return useQuery({
    queryKey: subscriptionKeys.list(filters),
    queryFn: () => getAllSubscriptions(filters),
  });
}

export function useSubscription(
  id: string,
): UseQueryResult<Subscription, Error> {
  return useQuery({
    queryKey: subscriptionKeys.detail(id),
    queryFn: () => getSubscriptionById(id),
    enabled: !!id,
  });
}

export function useUsageLogs(
  subscriptionId: string,
): UseQueryResult<UsageLog[], Error> {
  return useQuery({
    queryKey: subscriptionKeys.usageLogs(subscriptionId),
    queryFn: () => getUsageLogs(subscriptionId),
    enabled: !!subscriptionId,
  });
}

export function useCreateSubscription(): UseMutationResult<
  Subscription,
  Error,
  CreateSubscriptionRequest
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
  });
}

export function useRenewSubscription(): UseMutationResult<
  Subscription,
  Error,
  { id: string; data?: RenewSubscriptionRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => renewSubscription(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.detail(variables.id),
      });
    },
  });
}

export function useUpgradeSubscription(): UseMutationResult<
  Subscription,
  Error,
  { id: string; data: UpgradeSubscriptionRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => upgradeSubscription(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.detail(variables.id),
      });
    },
  });
}

export function useTerminateSubscription(): UseMutationResult<
  Subscription,
  Error,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: terminateSubscription,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(id) });
    },
  });
}

export function useCreateUsageLog(): UseMutationResult<
  UsageLog,
  Error,
  { subscriptionId: string; data: CreateUsageLogRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subscriptionId, data }) =>
      createUsageLog(subscriptionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.usageLogs(variables.subscriptionId),
      });
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.detail(variables.subscriptionId),
      });
    },
  });
}
