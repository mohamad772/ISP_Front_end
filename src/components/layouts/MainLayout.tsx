import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useStore } from "@/store/auth-store";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isAuthenticated = useStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <Header
          onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`transition-[padding] duration-500 ease-in-out ${
            sidebarCollapsed ? "md:pl-16" : "md:pl-64"
          }`}
        />
        <main
          className={`flex-1 p-4 md:p-6 overflow-auto transition-[padding] duration-500 ease-in-out ${
            sidebarCollapsed ? "md:pl-16" : "md:pl-64"
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
