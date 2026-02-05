import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";

import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
} from "@/types/api.types";
import { activateUser, createUser, deactivateUser, getAllUsers, getUserById, updateUser } from "@/service/user.service";

// Query keys
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters?: UserFilters) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

/**
 * Hook to fetch all users
 */
export function useUsers(
  filters?: UserFilters,
): UseQueryResult<User[], Error> {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => getAllUsers(filters),
  });
}

/**
 * Hook to fetch a single user by ID
 */
export function useUser(id: string): UseQueryResult<User, Error> {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new user
 */
export function useCreateUser(): UseMutationResult<
  User,
  Error,
  CreateUserRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

/**
 * Hook to update a user
 */
export function useUpdateUser(): UseMutationResult<
  User,
  Error,
  { id: string; data: UpdateUserRequest }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.id),
      });
    },
  });
}

/**
 * Hook to activate a user
 */
export function useActivateUser(): UseMutationResult<User, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateUser,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

/**
 * Hook to deactivate a user
 */
export function useDeactivateUser(): UseMutationResult<User, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}
