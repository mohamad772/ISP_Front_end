import { getAllPPPoERequests, getPPPoERequestById, createPPPoERequest, approvePPPoERequest, rejectPPPoERequest, completePPPoERequest } from "@/service/pppoerequests.service";
import { PPPoERequest } from "@/types/api.types";
import { PPPoERequestFilters, CreatePPPoERequestRequest, ApprovePPPoERequestRequest, RejectPPPoERequestRequest, CompletePPPoERequestRequest } from "@/types/api.types";
import { UseQueryResult, useQuery, UseMutationResult, useQueryClient, useMutation } from "@tanstack/react-query";

export const pppoeRequestKeys = {
  all: ["pppoeRequests"] as const,
  lists: () => [...pppoeRequestKeys.all, "list"] as const,
  list: (filters?: PPPoERequestFilters) =>
    [...pppoeRequestKeys.lists(), { filters }] as const,
  details: () => [...pppoeRequestKeys.all, "detail"] as const,
  detail: (id: string) => [...pppoeRequestKeys.details(), id] as const,
};

export function usePPPoERequests(
  filters?: PPPoERequestFilters,
): UseQueryResult<PPPoERequest[], Error> {
  return useQuery({
    queryKey: pppoeRequestKeys.list(filters),
    queryFn: () => getAllPPPoERequests(filters),
  });
}

export function usePPPoERequest(
  id: string,
): UseQueryResult<PPPoERequest, Error> {
  return useQuery({
    queryKey: pppoeRequestKeys.detail(id),
    queryFn: () => getPPPoERequestById(id),
    enabled: !!id,
  });
}

export function useCreatePPPoERequest(): UseMutationResult<
  PPPoERequest,
  Error,
  CreatePPPoERequestRequest
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPPPoERequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pppoeRequestKeys.lists() });
    },
  });
}

export function useApprovePPPoERequest(): UseMutationResult<
  PPPoERequest,
  Error,
  { id: string; data?: ApprovePPPoERequestRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => approvePPPoERequest(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pppoeRequestKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: pppoeRequestKeys.detail(variables.id),
      });
    },
  });
}

export function useRejectPPPoERequest(): UseMutationResult<
  PPPoERequest,
  Error,
  { id: string; data: RejectPPPoERequestRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => rejectPPPoERequest(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pppoeRequestKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: pppoeRequestKeys.detail(variables.id),
      });
    },
  });
}

export function useCompletePPPoERequest(): UseMutationResult<
  PPPoERequest,
  Error,
  { id: string; data?: CompletePPPoERequestRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => completePPPoERequest(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pppoeRequestKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: pppoeRequestKeys.detail(variables.id),
      });
    },
  });
}
