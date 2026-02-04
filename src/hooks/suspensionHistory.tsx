import { getAllSuspensionHistory, getSuspensionHistoryById } from "@/service/suspensionhistory.service";
import { SuspensionHistoryFilters, SuspensionHistory } from "@/types/api.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";



export const suspensionHistoryKeys = {
  all: ["suspensionHistory"] as const,
  lists: () => [...suspensionHistoryKeys.all, "list"] as const,
  list: (filters?: SuspensionHistoryFilters) =>
    [...suspensionHistoryKeys.lists(), { filters }] as const,
  details: () => [...suspensionHistoryKeys.all, "detail"] as const,
  detail: (id: string) => [...suspensionHistoryKeys.details(), id] as const,
};

export function useSuspensionHistory(
  filters?: SuspensionHistoryFilters,
): UseQueryResult<SuspensionHistory[], Error> {
  return useQuery({
    queryKey: suspensionHistoryKeys.list(filters),
    queryFn: () => getAllSuspensionHistory(filters),
  });
}

export function useSuspensionHistoryDetail(
  id: string,
): UseQueryResult<SuspensionHistory, Error> {
  return useQuery({
    queryKey: suspensionHistoryKeys.detail(id),
    queryFn: () => getSuspensionHistoryById(id),
    enabled: !!id,
  });
}
