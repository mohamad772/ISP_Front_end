import apiClient from "@/utils/apiClient";
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
} from "@/types/api.types";

/**
 * Create a new user
 */
export async function createUser(data: CreateUserRequest): Promise<User> {
  const response = await apiClient.post("/users", data);
  return response.data;
}

/**
 * Get all users
 */
export async function getAllUsers(
  filters?: UserFilters,
): Promise<User[]> {
  const response = await apiClient.get("/users", { params: filters });
  return response.data;
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User> {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
}

/**
 * Update user
 */
export async function updateUser(
  id: string,
  data: UpdateUserRequest,
): Promise<User> {
  const response = await apiClient.patch(`/users/${id}`, data);
  return response.data;
}

/**
 * Activate user
 */
export async function activateUser(id: string): Promise<User> {
  const response = await apiClient.patch(`/users/${id}/activate`);
  return response.data;
}

/**
 * Deactivate user
 */
export async function deactivateUser(id: string): Promise<User> {
  const response = await apiClient.patch(`/users/${id}/deactivate`);
  return response.data;
}
