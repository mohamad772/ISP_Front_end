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

const App = () => {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const user = useStore((state) => state.user);

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
              <Route path="users" element={<UsersPage />} />
              <Route path="users/:id" element={<UsersPage />} />
              <Route path="pos" element={<POSPage />} />
              <Route path="pos/:id" element={<POSDetailPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="clients/:id" element={<ClientDetailPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="network" element={<NetworkPage />} />
              <Route path="logs" element={<LogsRequestsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
