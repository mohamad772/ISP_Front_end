import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type Store = {
  access_token: string;

  setToken: (access_token: string) => void;
  clearToken: () => void;
};

export const useStore = create<Store>()(
  persist(
    (set) => ({
      access_token: "",
      setToken: (access_token) => set({ access_token }),
      clearToken: () => set({ access_token: "" }),
    }),
    {
      name: "WSP-Storge",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
