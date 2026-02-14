import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Wifi,
} from "lucide-react";
import { useLogout } from "@/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";

import {
  Notification,
  RequestStatus,
  PPPoERequestStatus,
} from "@/types/api.types";

interface HeaderProps {
  onMenuClick: () => void;
  className?: string;
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const isArabic = (i18n.resolvedLanguage || i18n.language).startsWith("ar");
  const translateDynamicText = (value?: string | null) =>
    value ? t(value, { defaultValue: value }) : value;
  const navigate = useNavigate();
  const { user } = useStore();
  const isAdmin = user?.role === "WSP_ADMIN" || user?.role === "SUB_ADMIN";
  const { data: notifications = [], isLoading } = useNotifications(20);
  const [hasOpenedNotifications, setHasOpenedNotifications] = useState(false);

  // Requests functionality removed as per user request

  const requestIdsFromNotifications = useMemo(() => {
    const ids = new Set<string>();
    notifications.forEach((notification) => {
      const meta = notification.metadata as Record<string, unknown> | null;
      if (typeof meta?.requestId === "string") {
        ids.add(meta.requestId);
      }
    });
    return ids;
  }, [notifications]);

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      const aTime = new Date(a.sentAt || a.createdAt).getTime();
      const bTime = new Date(b.sentAt || b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [notifications]);

  const notificationCount = notifications.length;

  const latestActivityAt = useMemo(() => {
    const candidates: Array<string | undefined> = [];
    notifications.forEach((n) => {
      if (n.createdAt) candidates.push(n.createdAt);
    });

    // Removed requests processing

    const dates = candidates
      .map((value) => (value ? new Date(value) : null))
      .filter(
        (value): value is Date =>
          value instanceof Date && !isNaN(value.getTime()),
      );
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates.map((d) => d.getTime())));
  }, [notifications]);

  useEffect(() => {
    if (!latestActivityAt) {
      return;
    }
    const stored = localStorage.getItem("notifications_last_seen");
    if (!stored) {
      setHasOpenedNotifications(false);
      return;
    }
    const lastSeen = new Date(stored);
    if (!isNaN(lastSeen.getTime()) && lastSeen >= latestActivityAt) {
      setHasOpenedNotifications(true);
    } else {
      setHasOpenedNotifications(false);
    }
  }, [latestActivityAt]);

  const actionableNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const meta = notification.metadata as Record<string, unknown> | null;
      return meta?.type === "PASSWORD_CHANGE_REQUEST";
    });
  }, [notifications]);

  const { mutate: logout, isPending } = useLogout();

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        navigate("/login");
      },
    });
  };

  return (
    <header
      className={cn(
        "h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50",
        className,
      )}
    >
      <div className="h-full flex items-center justify-between px-4 mx-auto">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-accent transition-colors"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Wifi className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold hidden sm:block bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              {t("ISP Management System")}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu
            onOpenChange={(open) => {
              if (open) {
                setHasOpenedNotifications(true);
                localStorage.setItem(
                  "notifications_last_seen",
                  new Date().toISOString(),
                );
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-accent transition-all duration-200 group"
              >
                <Bell className="w-5 h-5 transition-transform group-hover:scale-110" />
                {notificationCount > 0 && !hasOpenedNotifications && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-[10px] font-medium text-destructive-foreground animate-in fade-in zoom-in duration-200">
                    {notificationCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 max-w-[90vw] p-2">
              <div dir={isArabic ? "rtl" : "ltr"}>
                <DropdownMenuLabel>{t("Notifications")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isLoading && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {t("Loading...")}
                  </div>
                )}
                {!isLoading && notifications.length === 0 && (
                  <div className="px-3 py-6 text-sm text-muted-foreground text-center">
                    {t("No notifications found.")}
                  </div>
                )}
                {!isLoading &&
                  sortedNotifications.map((notification: Notification) => (
                    <div
                      key={notification.id}
                      className="px-3 py-2 rounded-md hover:bg-accent/60 transition-colors"
                    >
                      <div className="text-sm font-medium">
                        {translateDynamicText(notification.title)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {translateDynamicText(notification.message)}
                      </div>
                    </div>
                  ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 hover:bg-accent transition-all duration-200 group data-[state=open]:bg-accent"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ring-2 ring-transparent group-hover:ring-primary/20 transition-all duration-200">
                  <span className="text-sm font-medium text-primary-foreground">
                    {user?.username?.charAt(0).toUpperCase() ?? "U"}
                  </span>
                </div>
                <span className="hidden sm:block font-medium">
                  {user?.username ?? "User"}
                </span>
                <ChevronDown className="w-4 h-4 hidden sm:block transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
            >
              <div dir={isArabic ? "rtl" : "ltr"}>
                <DropdownMenuLabel>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-base font-medium text-primary-foreground">
                        {user?.username?.charAt(0).toUpperCase() ?? "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {user?.username ?? "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email ?? "-"}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => navigate("/profile")}
                  className="cursor-pointer transition-colors"
                >
                  <User className={`w-4 h-4 ${isArabic ? "ml-2" : "mr-2"}`} />
                  {t("Profile")}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => navigate("/settings")}
                  className="cursor-pointer transition-colors"
                >
                  <Settings
                    className={`w-4 h-4 ${isArabic ? "ml-2" : "mr-2"}`}
                  />
                  {t("Settings")}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive cursor-pointer transition-colors"
                  disabled={isPending}
                >
                  <LogOut className={`w-4 h-4 ${isArabic ? "ml-2" : "mr-2"}`} />
                  {isPending ? t("Logging out...") : t("Logout")}
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
