import apiClient from "@/utils/apiClient";
import {
  PasswordChangeRequest,
  CreatePasswordChangeRequest,
  ApprovePasswordChangeRequest,
  RejectPasswordChangeRequest,
  PasswordChangeRequestFilters,
} from "@/types/api.types";

export async function getPasswordChangeRequests(
  filters?: PasswordChangeRequestFilters,
): Promise<PasswordChangeRequest[]> {
  const response = await apiClient.get("/password-change-requests", {
    params: filters,
  });
  return response.data;
}

export async function createPasswordChangeRequest(
  data: CreatePasswordChangeRequest,
): Promise<PasswordChangeRequest> {
  const response = await apiClient.post("/password-change-requests", data);
  return response.data;
}

export async function approvePasswordChangeRequest(
  id: string,
  data?: ApprovePasswordChangeRequest,
): Promise<PasswordChangeRequest> {
  const response = await apiClient.patch(
    `/password-change-requests/${id}/approve`,
    data ?? {},
  );
  return response.data;
}

export async function rejectPasswordChangeRequest(
  id: string,
  data: RejectPasswordChangeRequest,
): Promise<PasswordChangeRequest> {
  const response = await apiClient.patch(
    `/password-change-requests/${id}/reject`,
    data,
  );
  return response.data;
}
