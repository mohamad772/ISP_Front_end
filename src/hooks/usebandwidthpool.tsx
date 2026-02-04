import { getBandwidthPool, updateBandwidthPool } from "@/service/bandwidth-pool.service";
import { BandwidthPool, UpdateBandwidthPoolRequest } from "@/types/api.types";
import { UseQueryResult, useQuery, UseMutationResult, useQueryClient, useMutation } from "@tanstack/react-query";

export const bandwidthPoolKeys = {
  all: ["bandwidthPool"] as const,
  detail: () => [...bandwidthPoolKeys.all, "detail"] as const,
};

export function useBandwidthPool(): UseQueryResult<BandwidthPool, Error> {
  return useQuery({
    queryKey: bandwidthPoolKeys.detail(),
    queryFn: getBandwidthPool,
  });
}

export function useUpdateBandwidthPool(): UseMutationResult<
  BandwidthPool,
  Error,
  UpdateBandwidthPoolRequest
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBandwidthPool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bandwidthPoolKeys.detail() });
    },
  });
}
