import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { login, logout, refreshToken } from "@/service/auth.service";
import type { LoginRequest, LoginResponse } from "@/types/api.types";
import { useStore } from "@/store/auth-store";

/**
 * Hook for user login
 */
export function useLogin(): UseMutationResult<
  LoginResponse,
  Error,
  LoginRequest
> {
  const loginStore = useStore((state) => state.login);

  return useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
    onSuccess: (data) => {
      loginStore(data.user, data.access_token);
    },
  });
}

/**
 * Hook for user logout
 */
export function useLogout(): UseMutationResult<void, Error, void> {
  const logoutStore = useStore((state) => state.logout);

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      logoutStore();
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
  const loginStore = useStore((state) => state.login);

  return useMutation({
    mutationFn: refreshToken,
    onSuccess: (data) => {
      loginStore(data.user, data.access_token);
    },
  });
}
