import { getAllStaticIPs, getStaticIPById, createStaticIP, updateStaticIP, releaseStaticIP } from "@/service/staticip.service";
import { StaticIPFilters, StaticIP, CreateStaticIPRequest, UpdateStaticIPRequest } from "@/types/api.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";




export const staticIPKeys = {
  all: ["staticIPs"] as const,
  lists: () => [...staticIPKeys.all, "list"] as const,
  list: (filters?: StaticIPFilters) =>
    [...staticIPKeys.lists(), { filters }] as const,
  details: () => [...staticIPKeys.all, "detail"] as const,
  detail: (id: string) => [...staticIPKeys.details(), id] as const,
};

export function useStaticIPs(
  filters?: StaticIPFilters,
): UseQueryResult<StaticIP[], Error> {
  return useQuery({
    queryKey: staticIPKeys.list(filters),
    queryFn: () => getAllStaticIPs(filters),
  });
}

export function useStaticIP(id: string): UseQueryResult<StaticIP, Error> {
  return useQuery({
    queryKey: staticIPKeys.detail(id),
    queryFn: () => getStaticIPById(id),
    enabled: !!id,
  });
}

export function useCreateStaticIP(): UseMutationResult<
  StaticIP,
  Error,
  CreateStaticIPRequest
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStaticIP,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staticIPKeys.lists() });
    },
  });
}

export function useUpdateStaticIP(): UseMutationResult<
  StaticIP,
  Error,
  { id: string; data: UpdateStaticIPRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateStaticIP(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: staticIPKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: staticIPKeys.detail(variables.id),
      });
    },
  });
}

export function useReleaseStaticIP(): UseMutationResult<
  StaticIP,
  Error,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: releaseStaticIP,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: staticIPKeys.lists() });
      queryClient.invalidateQueries({ queryKey: staticIPKeys.detail(id) });
    },
  });
}
