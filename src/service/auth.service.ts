import apiClient from "@/utils/apiClient";
import { LoginRequest, LoginResponse } from "@/types/api.types";

/**
 * Login user and receive access token
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post("/auth/login", credentials);
  return response.data;
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  const response = await apiClient.post("/auth/logout");
  return response.data;
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<LoginResponse> {
  const response = await apiClient.post("/auth/refresh");
  return response.data;
}
