import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import {
  getAllPOS,
  getPOSById,
  createPOS,
  updatePOS,
  activatePOS,
  deactivatePOS,
  updatePOSBandwidth,
  getPOSClients,
  getPOSManagers,
  assignManagerToPOS,
  removeManagerFromPOS,
} from "@/service/pos.service";
import {
  POS,
  CreatePOSRequest,
  UpdatePOSRequest,
  UpdatePOSBandwidthRequest,
  AssignManagerRequest,
  Client,
  User,
  POSFilters,
} from "@/types/api.types";

// Query keys
export const posKeys = {
  all: ["pos"] as const,
  lists: () => [...posKeys.all, "list"] as const,
  list: (filters?: POSFilters) => [...posKeys.lists(), { filters }] as const,
  details: () => [...posKeys.all, "detail"] as const,
  detail: (id: string) => [...posKeys.details(), id] as const,
  clients: (id: string) => [...posKeys.detail(id), "clients"] as const,
  managers: (id: string) => [...posKeys.detail(id), "managers"] as const,
};

/**
 * Hook to fetch all POS locations
 */
export function usePOSList(
  options?: { enabled?: boolean },
): UseQueryResult<POS[], Error> {
  return useQuery({
    queryKey: posKeys.lists(),
    queryFn: getAllPOS,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to fetch a single POS by ID
 */
export function usePOS(id: string): UseQueryResult<POS, Error> {
  return useQuery({
    queryKey: posKeys.detail(id),
    queryFn: () => getPOSById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch clients for a POS
 */
export function usePOSClients(id: string): UseQueryResult<Client[], Error> {
  return useQuery({
    queryKey: posKeys.clients(id),
    queryFn: () => getPOSClients(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch managers for a POS
 */
export function usePOSManagers(id: string): UseQueryResult<User[], Error> {
  return useQuery({
    queryKey: posKeys.managers(id),
    queryFn: () => getPOSManagers(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new POS
 */
export function useCreatePOS(): UseMutationResult<
  POS,
  Error,
  CreatePOSRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPOS,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.lists() });
    },
  });
}

/**
 * Hook to update a POS
 */
export function useUpdatePOS(): UseMutationResult<
  POS,
  Error,
  { id: string; data: UpdatePOSRequest }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updatePOS(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: posKeys.lists() });
      queryClient.invalidateQueries({ queryKey: posKeys.detail(variables.id) });
    },
  });
}

/**
 * Hook to activate a POS
 */
export function useActivatePOS(): UseMutationResult<POS, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activatePOS,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: posKeys.lists() });
      queryClient.invalidateQueries({ queryKey: posKeys.detail(id) });
    },
  });
}

/**
 * Hook to deactivate a POS
 */
export function useDeactivatePOS(): UseMutationResult<POS, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivatePOS,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: posKeys.lists() });
      queryClient.invalidateQueries({ queryKey: posKeys.detail(id) });
    },
  });
}

/**
 * Hook to update POS bandwidth
 */
export function useUpdatePOSBandwidth(): UseMutationResult<
  POS,
  Error,
  { id: string; data: UpdatePOSBandwidthRequest }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updatePOSBandwidth(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: posKeys.lists() });
      queryClient.invalidateQueries({ queryKey: posKeys.detail(variables.id) });
    },
  });
}

/**
 * Hook to assign a manager to POS
 */
export function useAssignManagerToPOS(): UseMutationResult<
  void,
  Error,
  { id: string; data: AssignManagerRequest }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => assignManagerToPOS(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: posKeys.managers(variables.id),
      });
    },
  });
}

/**
 * Hook to remove a manager from POS
 */
export function useRemoveManagerFromPOS(): UseMutationResult<
  void,
  Error,
  { id: string; userId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userId }) => removeManagerFromPOS(id, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: posKeys.managers(variables.id),
      });
    },
  });
}
