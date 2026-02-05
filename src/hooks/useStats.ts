import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  getAdminDashboardStats,
  getPOSDashboardStats,
} from "@/service/stats.service";
import type { DashboardStats, POSDashboardStats } from "@/types/api.types";

export const statsKeys = {
  all: ["stats"] as const,
  admin: () => [...statsKeys.all, "admin"] as const,
  pos: (posId: string) => [...statsKeys.all, "pos", posId] as const,
};

export function useAdminDashboardStats(): UseQueryResult<
  DashboardStats,
  Error
> {
  return useQuery({
    queryKey: statsKeys.admin(),
    queryFn: getAdminDashboardStats,
  });
}

export function usePOSDashboardStats(
  posId: string,
): UseQueryResult<POSDashboardStats, Error> {
  return useQuery({
    queryKey: statsKeys.pos(posId),
    queryFn: () => getPOSDashboardStats(posId),
    enabled: !!posId,
  });
}
