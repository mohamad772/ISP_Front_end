import {
  getAllServicePlans,
  getServicePlanById,
  createServicePlan,
  updateServicePlan,
  activateServicePlan,
  deactivateServicePlan,
} from "@/service/seviceplane.service";
import { ServicePlan } from "@/types/api.types";
import {
  ServicePlanFilters,
  CreateServicePlanRequest,
  UpdateServicePlanRequest,
} from "@/types/api.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";

export const servicePlanKeys = {
  all: ["servicePlans"] as const,
  lists: () => [...servicePlanKeys.all, "list"] as const,
  list: (filters?: ServicePlanFilters) =>
    [...servicePlanKeys.lists(), { filters }] as const,
  details: () => [...servicePlanKeys.all, "detail"] as const,
  detail: (id: string) => [...servicePlanKeys.details(), id] as const,
};

export function useServicePlans(
  filters?: ServicePlanFilters,
): UseQueryResult<ServicePlan[], Error> {
  return useQuery({
    queryKey: servicePlanKeys.list(filters),
    queryFn: () => getAllServicePlans(filters),
  });
}

export function useServicePlan(id: string): UseQueryResult<ServicePlan, Error> {
  return useQuery({
    queryKey: servicePlanKeys.detail(id),
    queryFn: () => getServicePlanById(id),
    enabled: !!id,
  });
}

export function useCreateServicePlan(): UseMutationResult<
  ServicePlan,
  Error,
  CreateServicePlanRequest
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createServicePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: servicePlanKeys.lists() });
    },
  });
}

export function useUpdateServicePlan(): UseMutationResult<
  ServicePlan,
  Error,
  { id: string; data: UpdateServicePlanRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateServicePlan(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: servicePlanKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: servicePlanKeys.detail(variables.id),
      });
    },
  });
}

export function useActivateServicePlan(): UseMutationResult<
  ServicePlan,
  Error,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: activateServicePlan,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: servicePlanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: servicePlanKeys.detail(id) });
    },
  });
}

export function useDeactivateServicePlan(): UseMutationResult<
  ServicePlan,
  Error,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateServicePlan,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: servicePlanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: servicePlanKeys.detail(id) });
    },
  });
}
