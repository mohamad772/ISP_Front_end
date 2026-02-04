import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { login, logout, refreshToken } from "@/service/auth.service";
import type { LoginRequest, LoginResponse } from "@/types/api.types";
import { useStore } from "@/utils/store";

/**
 * Hook for user login
 */
export function useLogin(): UseMutationResult<
  LoginResponse,
  Error,
  LoginRequest
> {
  const { setToken } = useStore();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
    onSuccess: (data) => {
      setToken(data.access_token);
    },
  });
}

/**
 * Hook for user logout
 */
export function useLogout(): UseMutationResult<void, Error, void> {
  const { clearToken } = useStore();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearToken();
    },
  });
}

/**
 * Hook for refreshing access token
 */
export function useRefreshToken(): UseMutationResult<
  LoginResponse,
  Error,
  void
> {
  const { setToken } = useStore();

  return useMutation({
    mutationFn: refreshToken,
    onSuccess: (data) => {
      setToken(data.access_token);
    },
  });
}
