import type {
  SystemSettings,
  UpdateSystemSettingsRequest,
  SystemHealth,
  ActiveSession,
} from "@/types/api.types";
import {
  getSystemSettings,
  updateSystemSettings,
  exportSystemData,
  getSystemHealth,
  clearSystemCache,
  getActiveSessions,
} from "@/service/settings.service";
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";

export const settingsKeys = {
  all: ["settings"] as const,
  detail: () => [...settingsKeys.all, "detail"] as const,
};

export function useSettings(): UseQueryResult<SystemSettings, Error> {
  return useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: getSystemSettings,
  });
}

export function useUpdateSettings(): UseMutationResult<
  SystemSettings,
  Error,
  UpdateSystemSettingsRequest
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.detail() });
    },
  });
}

export function useExportSystemData(): UseMutationResult<Blob, Error, void> {
  return useMutation({
    mutationFn: () => exportSystemData(),
  });
}

export function useSystemHealth(): UseMutationResult<SystemHealth, Error, void> {
  return useMutation({
    mutationFn: () => getSystemHealth(),
  });
}

export function useClearSystemCache(): UseMutationResult<
  { success: boolean; message?: string },
  Error,
  void
> {
  return useMutation({
    mutationFn: () => clearSystemCache(),
  });
}

export function useActiveSessions(): UseMutationResult<
  ActiveSession[],
  Error,
  void
> {
  return useMutation({
    mutationFn: () => getActiveSessions(),
  });
}
