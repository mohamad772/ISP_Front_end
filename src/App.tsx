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
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { LogsRequestsPage } from "./pages/LogsAndRequests/LogsRequestsPage";
import { registerDevice } from "./service/notifications.service";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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
      <p className="text-muted-foreground">
        This section is disabled for your account.
      </p>
    </div>
  </div>
);

const firebaseConfig = {
  apiKey: "AIzaSyD5VRJmvSddj0KJxWMV1R5IJJhwzRjig6o",
  authDomain: "isp2026.firebaseapp.com",
  projectId: "isp2026",
  storageBucket: "isp2026.firebasestorage.app",
  messagingSenderId: "67619569460",
  appId: "1:67619569460:web:fe350ea5cffb6225f26f61",
};

const app = initializeApp(firebaseConfig);
let messaging: any = null;

try {
  if (typeof window !== "undefined" && typeof navigator !== "undefined") {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.error("Firebase messaging not supported:", error);
}

const App = () => {
  const user = useStore((state) => state.user);
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const hasPermission = useStore((state) => state.hasPermission);
  const { i18n } = useTranslation();
  const isClientUser = user?.role === UserRole.CLIENT || Boolean(user?.clientId);
  const isWspAdmin = user?.role === UserRole.WSP_ADMIN;
  const isSubAdmin = user?.role === UserRole.SUB_ADMIN;
  const isPosManager = user?.role === UserRole.POS_MANAGER;

  const canAccessUsers =
    !!user &&
    ((isWspAdmin || isSubAdmin) && hasPermission("USERS_READ"));

  const canAccessPosList =
    !!user &&
    ((isWspAdmin || isSubAdmin) && hasPermission("POS_READ"));

  const canAccessClients =
    !!user &&
    (isWspAdmin || isPosManager || (isSubAdmin && hasPermission("CLIENTS_READ")));

  const canAccessBilling =
    !!user &&
    (isWspAdmin ||
      isPosManager ||
      (isSubAdmin &&
        (hasPermission("INVOICES_READ") || hasPermission("PAYMENTS_READ"))));

  const canAccessNetwork =
    !!user &&
    (isWspAdmin || isPosManager || (isSubAdmin && hasPermission("STATIC_IP_READ")));

  const canAccessLogs =
    !!user &&
    (isWspAdmin || isPosManager || (isSubAdmin && hasPermission("AUDIT_LOGS_READ")));

  const canAccessSettings =
    !!user &&
    [UserRole.WSP_ADMIN, UserRole.SUB_ADMIN, UserRole.POS_MANAGER].includes(
      user.role,
    );

  async function requestPermission() {
    if (
      !messaging ||
      typeof Notification === "undefined" ||
      typeof navigator === "undefined"
    ) {
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const token = await getToken(messaging, {
          vapidKey:
            "BLscDTItBQ0HeZR2j6GcHT3xM2nWKUBfyRonebEjGvEuaza1waz76DUJ_tPqq-6_xqKzaU_AETgu-HiKQY-idQc",
        });
        if (token) {
          console.log("Token:", token);
          try {
            await registerDevice(token);
            console.log("Device registered successfully");
          } catch (error) {
            console.error("Failed to register device:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
    }
  }

  useEffect(() => {
    initializeTheme();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    requestPermission();

    if (!messaging) return;
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Message received. ", payload);
      toast.info(payload.notification?.title || "Notification", {
        description: payload.notification?.body || "New message received",
        duration: 5000,
      });
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner richColors closeButton position="top-right" />
        <BrowserRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate
                    to={isClientUser ? "/client" : "/welcome"}
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
                element={
                  canAccessUsers ? (
                    <UsersPage />
                  ) : (
                    <LockedPage section="Users" />
                  )
                }
              />
              <Route
                path="users/:id"
                element={
                  canAccessUsers ? (
                    <UsersPage />
                  ) : (
                    <LockedPage section="Users" />
                  )
                }
              />
              <Route
                path="pos"
                element={
                  canAccessPosList ? (
                    <POSPage />
                  ) : (
                    <LockedPage section="POS Management" />
                  )
                }
              />
              <Route
                path="pos/:id"
                element={
                  canAccessPosList ? (
                    <POSDetailPage />
                  ) : (
                    <LockedPage section="POS Management" />
                  )
                }
              />
              <Route
                path="clients"
                element={
                  canAccessClients ? (
                    <ClientsPage />
                  ) : (
                    <LockedPage section="Clients" />
                  )
                }
              />
              <Route
                path="clients/:id"
                element={
                  canAccessClients ? (
                    <ClientDetailPage />
                  ) : (
                    <LockedPage section="Clients" />
                  )
                }
              />
              <Route
                path="billing"
                element={
                  canAccessBilling ? (
                    <BillingPage />
                  ) : (
                    <LockedPage section="Billing" />
                  )
                }
              />
              <Route
                path="network"
                element={
                  canAccessNetwork ? (
                    <NetworkPage />
                  ) : (
                    <LockedPage section="Network" />
                  )
                }
              />
              <Route
                path="logs"
                element={
                  canAccessLogs ? (
                    <LogsRequestsPage />
                  ) : (
                    <LockedPage section="Logs & Requests" />
                  )
                }
              />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route
                path="settings"
                element={
                  canAccessSettings ? (
                    <SettingsPage />
                  ) : (
                    <LockedPage section="Settings" />
                  )
                }
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
