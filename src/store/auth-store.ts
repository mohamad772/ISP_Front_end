import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "@/types/api.types";

interface AuthState {
  user: User | null;
  access_token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

export const useStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      access_token: null,
      isAuthenticated: false,
      isLoading: false,

      login: (user, token) => {
        set({
          user,
          access_token: token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        set({ user: null, access_token: null, isAuthenticated: false });
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;
        if (user.role === "WSP_ADMIN") return true;
        if (!user.capabilities) return false;
        return user.capabilities.includes(permission);
      },

      hasRole: (roles) => {
        const user = get().user;
        if (!user) return false;
        return roles.includes(user.role);
      },
    }),
    {
      name: "isp-auth-storage",
      partialize: (state) => ({
        user: state.user,
        access_token: state.access_token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
