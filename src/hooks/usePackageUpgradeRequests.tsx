import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPackageUpgradeRequests,
  getPackageUpgradeRequestById,
  createPackageUpgradeRequest,
  approvePackageUpgradeRequest,
  rejectPackageUpgradeRequest,
} from "@/service/package-upgrade-requests.service";
import {
  PackageUpgradeRequest,
  PackageUpgradeRequestFilters,
  CreatePackageUpgradeRequest,
  ApprovePackageUpgradeRequest,
  RejectPackageUpgradeRequest,
} from "@/types/api.types";
import { notificationKeys } from "@/hooks/useNotifications";

export const packageUpgradeRequestKeys = {
  all: ["packageUpgradeRequests"] as const,
  lists: () => [...packageUpgradeRequestKeys.all, "list"] as const,
  list: (filters?: PackageUpgradeRequestFilters) =>
    [...packageUpgradeRequestKeys.lists(), { filters }] as const,
  details: () => [...packageUpgradeRequestKeys.all, "detail"] as const,
  detail: (id: string) => [...packageUpgradeRequestKeys.details(), id] as const,
};

export function usePackageUpgradeRequests(
  filters?: PackageUpgradeRequestFilters,
) {
  return useQuery<PackageUpgradeRequest[], Error>({
    queryKey: packageUpgradeRequestKeys.list(filters),
    queryFn: () => getPackageUpgradeRequests(filters),
  });
}

export function usePackageUpgradeRequest(id: string) {
  return useQuery<PackageUpgradeRequest, Error>({
    queryKey: packageUpgradeRequestKeys.detail(id),
    queryFn: () => getPackageUpgradeRequestById(id),
    enabled: !!id,
  });
}

export function useCreatePackageUpgradeRequest() {
  const queryClient = useQueryClient();
  return useMutation<
    PackageUpgradeRequest,
    Error,
    CreatePackageUpgradeRequest
  >({
    mutationFn: (data) => createPackageUpgradeRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: packageUpgradeRequestKeys.lists(),
      });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useApprovePackageUpgradeRequest() {
  const queryClient = useQueryClient();
  return useMutation<
    PackageUpgradeRequest,
    Error,
    { id: string; data?: ApprovePackageUpgradeRequest }
  >({
    mutationFn: ({ id, data }) => approvePackageUpgradeRequest(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: packageUpgradeRequestKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: packageUpgradeRequestKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useRejectPackageUpgradeRequest() {
  const queryClient = useQueryClient();
  return useMutation<
    PackageUpgradeRequest,
    Error,
    { id: string; data: RejectPackageUpgradeRequest }
  >({
    mutationFn: ({ id, data }) => rejectPackageUpgradeRequest(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: packageUpgradeRequestKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: packageUpgradeRequestKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
