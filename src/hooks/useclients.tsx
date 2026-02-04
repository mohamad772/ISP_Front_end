import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  activateClient,
  suspendClient,
  terminateClient,
  updateConnectionType,
  assignStaticIP,
  releaseStaticIP,
} from "@/service/clients.service";
import {
  Client,
  PaginatedClients,
  CreateClientRequest,
  UpdateClientRequest,
  SuspendClientRequest,
  UpdateConnectionTypeRequest,
  AssignStaticIPRequest,
  ClientFilters,
} from "@/types/api.types";

// Query keys
export const clientKeys = {
  all: ["clients"] as const,
  lists: () => [...clientKeys.all, "list"] as const,
  list: (filters?: ClientFilters) =>
    [...clientKeys.lists(), { filters }] as const,
  details: () => [...clientKeys.all, "detail"] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
};

/**
 * Hook to fetch all clients with pagination
 */
export function useClients(
  filters?: ClientFilters,
): UseQueryResult<PaginatedClients, Error> {
  return useQuery({
    queryKey: clientKeys.list(filters),
    queryFn: () => getAllClients(filters),
  });
}

/**
 * Hook to fetch a single client by ID
 */
export function useClient(id: string): UseQueryResult<Client, Error> {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => getClientById(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new client
 */
export function useCreateClient(): UseMutationResult<
  Client,
  Error,
  CreateClientRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

/**
 * Hook to update a client
 */
export function useUpdateClient(): UseMutationResult<
  Client,
  Error,
  { id: string; data: UpdateClientRequest }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateClient(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(variables.id),
      });
    },
  });
}

/**
 * Hook to activate a client
 */
export function useActivateClient(): UseMutationResult<Client, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateClient,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) });
    },
  });
}

/**
 * Hook to suspend a client
 */
export function useSuspendClient(): UseMutationResult<
  Client,
  Error,
  { id: string; data: SuspendClientRequest }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => suspendClient(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(variables.id),
      });
    },
  });
}

/**
 * Hook to terminate a client
 */
export function useTerminateClient(): UseMutationResult<Client, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: terminateClient,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) });
    },
  });
}

/**
 * Hook to update client connection type
 */
export function useUpdateConnectionType(): UseMutationResult<
  Client,
  Error,
  { id: string; data: UpdateConnectionTypeRequest }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateConnectionType(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(variables.id),
      });
    },
  });
}

/**
 * Hook to assign static IP to client
 */
export function useAssignStaticIP(): UseMutationResult<
  Client,
  Error,
  { id: string; data: AssignStaticIPRequest }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => assignStaticIP(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(variables.id),
      });
    },
  });
}

/**
 * Hook to release static IP from client
 */
export function useReleaseStaticIP(): UseMutationResult<Client, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: releaseStaticIP,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) });
    },
  });
}
