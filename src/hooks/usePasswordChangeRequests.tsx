import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPasswordChangeRequests,
  approvePasswordChangeRequest,
  rejectPasswordChangeRequest,
} from "@/service/password-change-requests.service";
import {
  ApprovePasswordChangeRequest,
  RejectPasswordChangeRequest,
  PasswordChangeRequest,
  PasswordChangeRequestFilters,
} from "@/types/api.types";
import { notificationKeys } from "@/hooks/useNotifications";
import { useQuery } from "@tanstack/react-query";
import { createPasswordChangeRequest } from "@/service/password-change-requests.service";
import { CreatePasswordChangeRequest } from "@/types/api.types";

export const passwordChangeRequestKeys = {
  all: ["passwordChangeRequests"] as const,
  lists: () => [...passwordChangeRequestKeys.all, "list"] as const,
  list: (filters?: PasswordChangeRequestFilters) =>
    [...passwordChangeRequestKeys.lists(), { filters }] as const,
};

export function usePasswordChangeRequests(
  filters?: PasswordChangeRequestFilters,
) {
  return useQuery<PasswordChangeRequest[], Error>({
    queryKey: passwordChangeRequestKeys.list(filters),
    queryFn: () => getPasswordChangeRequests(filters),
  });
}

export function useCreatePasswordChangeRequest() {
  const queryClient = useQueryClient();
  return useMutation<
    PasswordChangeRequest,
    Error,
    CreatePasswordChangeRequest
  >({
    mutationFn: (data) => createPasswordChangeRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: passwordChangeRequestKeys.lists(),
      });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useApprovePasswordChangeRequest() {
  const queryClient = useQueryClient();
  return useMutation<
    PasswordChangeRequest,
    Error,
    { id: string; data?: ApprovePasswordChangeRequest }
  >({
    mutationFn: ({ id, data }) => approvePasswordChangeRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({
        queryKey: passwordChangeRequestKeys.lists(),
      });
    },
  });
}

export function useRejectPasswordChangeRequest() {
  const queryClient = useQueryClient();
  return useMutation<
    PasswordChangeRequest,
    Error,
    { id: string; data: RejectPasswordChangeRequest }
  >({
    mutationFn: ({ id, data }) => rejectPasswordChangeRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({
        queryKey: passwordChangeRequestKeys.lists(),
      });
    },
  });
}
