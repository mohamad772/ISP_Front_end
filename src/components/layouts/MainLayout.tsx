import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useStore } from "../../utils/store";

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { access_token } = useStore.getState();

  if (!access_token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <Header onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
