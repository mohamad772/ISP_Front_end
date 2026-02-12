export type AppTheme = "light" | "dark";

const THEME_STORAGE_KEY = "theme_mode";

export const getStoredTheme = (): AppTheme => {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
};

export const applyTheme = (theme: AppTheme) => {
  if (typeof window === "undefined") return;
  const root = window.document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
};

export const initializeTheme = () => {
  applyTheme(getStoredTheme());
};
