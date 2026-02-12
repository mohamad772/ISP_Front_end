import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { WelcomePage } from "@/pages/auth/WelcomePage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { UsersPage } from "@/pages/users/UsersPage";
import { POSPage } from "@/pages/pos/POSPage";
import { POSDetailPage } from "@/pages/pos/POSDetailPage";
import { ClientsPage } from "@/pages/clients/ClientsPage";
import { ClientDetailPage } from "@/pages/clients/ClientDetailPage";
import { BillingPage } from "@/pages/billing/BillingPage";
import { NetworkPage } from "@/pages/network/NetworkPage";
import { ProfilePage } from "@/pages/profile/ProfilePage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { ClientPortalPage } from "@/pages/client/ClientPortalPage";
import { NotificationsPage } from "@/pages/notifications/NotificationsPage";
import { useStore } from "@/store/auth-store";
import { initializeTheme } from "@/utils/theme";
import { UserRole } from "@/types/api.types";
import NotFound from "./pages/NotFound";
import { LogsRequestsPage } from "./pages/LogsandRequests/LogsRequestsPage";

const queryClient = new QueryClient();

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const user = useStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const LockedPage = ({ section }: { section: string }) => (
  <div className="relative rounded-xl border border-border/60 bg-card/70 p-10 overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 backdrop-blur-[2px] opacity-80" />
    </div>
    <div className="relative z-10 text-center">
      <h2 className="text-2xl font-semibold mb-3">{section}</h2>
      <p className="text-muted-foreground">This section is disabled for your account.</p>
    </div>
  </div>
);

const App = () => {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const user = useStore((state) => state.user);

  const hasCapability = (capability: string) => {
    if (!user) return false;
    if (user.role === UserRole.WSP_ADMIN) return true;
    return !!user.capabilities?.includes(capability);
  };

  const canAccessUsers =
    !!user &&
    [UserRole.WSP_ADMIN, UserRole.SUB_ADMIN].includes(user.role) &&
    hasCapability("USERS_READ");

  const canAccessPosList =
    !!user &&
    [UserRole.WSP_ADMIN, UserRole.SUB_ADMIN].includes(user.role) &&
    hasCapability("POS_READ");

  const canAccessSettings =
    !!user &&
    [UserRole.WSP_ADMIN, UserRole.SUB_ADMIN, UserRole.POS_MANAGER].includes(
      user.role,
    );

  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate
                    to={user?.role === "CLIENT" ? "/client" : "/welcome"}
                    replace
                  />
                ) : (
                  <LoginPage />
                )
              }
            />
            <Route
              path="/welcome"
              element={
                <RequireAuth>
                  <WelcomePage />
                </RequireAuth>
              }
            />
            <Route
              path="/client"
              element={
                <RequireAuth>
                  <ClientPortalPage />
                </RequireAuth>
              }
            />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <MainLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route
                path="users"
                element={canAccessUsers ? <UsersPage /> : <LockedPage section="Users" />}
              />
              <Route
                path="users/:id"
                element={canAccessUsers ? <UsersPage /> : <LockedPage section="Users" />}
              />
              <Route
                path="pos"
                element={canAccessPosList ? <POSPage /> : <LockedPage section="POS Management" />}
              />
              <Route path="pos/:id" element={<POSDetailPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="clients/:id" element={<ClientDetailPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="network" element={<NetworkPage />} />
              <Route path="logs" element={<LogsRequestsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route
                path="settings"
                element={canAccessSettings ? <SettingsPage /> : <LockedPage section="Settings" />}
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
