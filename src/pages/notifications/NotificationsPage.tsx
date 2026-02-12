import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import {
  useApprovePasswordChangeRequest,
  useRejectPasswordChangeRequest,
  usePasswordChangeRequests,
} from "@/hooks/usePasswordChangeRequests";
import {
  useApprovePPPoERequest,
  useRejectPPPoERequest,
  usePPPoERequests,
} from "@/hooks/usepppoeRequests";
import {
  useApprovePackageUpgradeRequest,
  useRejectPackageUpgradeRequest,
  usePackageUpgradeRequests,
} from "@/hooks/usePackageUpgradeRequests";
import { useStore } from "@/store/auth-store";
import {
  Notification,
  PPPoERequestStatus,
  RequestStatus,
} from "@/types/api.types";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function NotificationsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: notifications = [], isLoading } = useNotifications();
  const { user } = useStore();
  const isAdmin = user?.role === "WSP_ADMIN" || user?.role === "SUB_ADMIN";

  const { data: passwordRequests = [], isLoading: isLoadingRequests } =
    usePasswordChangeRequests(
      isAdmin ? { status: RequestStatus.PENDING } : undefined,
    );
  const { data: pppoeRequests = [], isLoading: isLoadingPppoe } =
    usePPPoERequests(isAdmin ? { status: PPPoERequestStatus.PENDING } : undefined);
  const { data: packageRequests = [], isLoading: isLoadingPackages } =
    usePackageUpgradeRequests(
      isAdmin ? { status: RequestStatus.PENDING } : undefined,
    );

  const { mutate: approveRequest, isPending: isApproving } =
    useApprovePasswordChangeRequest();
  const { mutate: rejectRequest, isPending: isRejecting } =
    useRejectPasswordChangeRequest();
  const { mutate: approvePppoe, isPending: isApprovingPppoe } =
    useApprovePPPoERequest();
  const { mutate: rejectPppoe, isPending: isRejectingPppoe } =
    useRejectPPPoERequest();
  const { mutate: approvePackage, isPending: isApprovingPackage } =
    useApprovePackageUpgradeRequest();
  const { mutate: rejectPackage, isPending: isRejectingPackage } =
    useRejectPackageUpgradeRequest();

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

  const pendingPasswordRequests = useMemo(() => {
    if (!isAdmin) return [];
    return passwordRequests.filter(
      (request) =>
        request.status === RequestStatus.PENDING &&
        !requestIdsFromNotifications.has(request.id),
    );
  }, [isAdmin, passwordRequests, requestIdsFromNotifications]);

  const pendingPppoeRequests = useMemo(() => {
    if (!isAdmin) return [];
    return pppoeRequests.filter(
      (request) =>
        request.status === PPPoERequestStatus.PENDING &&
        !requestIdsFromNotifications.has(request.id),
    );
  }, [isAdmin, pppoeRequests, requestIdsFromNotifications]);

  const pendingPackageRequests = useMemo(() => {
    if (!isAdmin) return [];
    return packageRequests.filter(
      (request) => request.status === RequestStatus.PENDING,
    );
  }, [isAdmin, packageRequests]);

  const getErrorMessage = (error: unknown) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as any).response === "object" &&
      (error as any).response !== null
    ) {
      const message = (error as any).response?.data?.message;
      if (Array.isArray(message)) {
        return message.join(", ");
      }
      if (typeof message === "string") {
        return message;
      }
    }
    return t("Request failed. Please try again.");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Notifications" description="All system notifications" />

      <Card>
        <CardHeader>
          <CardTitle>{t("All Notifications")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          )}

          {!isLoading &&
            !isLoadingRequests &&
            !isLoadingPppoe &&
            notifications.length === 0 &&
            pendingPasswordRequests.length === 0 &&
            pendingPppoeRequests.length === 0 &&
            pendingPackageRequests.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {t("No notifications found.")}
            </div>
          )}

          {isAdmin && pendingPasswordRequests.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("Pending Password Change Requests")}
              </div>
              <div className="mt-3 space-y-3">
                {pendingPasswordRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">
                          {t("Password Change Request")}
                        </h3>
                        <Badge variant="outline">{t("PENDING")}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {request.requestedAt
                          ? new Date(request.requestedAt).toLocaleString()
                          : new Date(request.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {request.user?.email ||
                        request.user?.username ||
                        request.userId}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={isApproving || isRejecting}
                        onClick={() => approveRequest({ id: request.id })}
                      >
                        {t("Approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isApproving || isRejecting}
                        onClick={() => {
                          const reason =
                            window.prompt(
                              t("Rejection reason?"),
                              t("Not approved"),
                            ) ?? "";
                          if (!reason.trim()) return;
                          rejectRequest({
                            id: request.id,
                            data: { rejectionReason: reason.trim() },
                          });
                        }}
                      >
                        {t("Reject")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAdmin && pendingPppoeRequests.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("Pending PPPoE Requests")}
              </div>
              <div className="mt-3 space-y-3">
                {pendingPppoeRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">
                          {t("PPPoE Change Request")}
                        </h3>
                        <Badge variant="outline">{t("PENDING")}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {request.createdAt
                          ? new Date(request.createdAt).toLocaleString()
                          : ""}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {request.client?.fullName || request.clientId}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={isApprovingPppoe || isRejectingPppoe}
                        onClick={() => approvePppoe({ id: request.id })}
                      >
                        {t("Approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isApprovingPppoe || isRejectingPppoe}
                        onClick={() => {
                          const reason =
                            window.prompt(
                              t("Rejection reason?"),
                              t("Not approved"),
                            ) ?? "";
                          if (!reason.trim()) return;
                          rejectPppoe({
                            id: request.id,
                            data: { rejectionReason: reason.trim() },
                          });
                        }}
                      >
                        {t("Reject")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAdmin && pendingPackageRequests.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("Pending Package Upgrade Requests")}
              </div>
              <div className="mt-3 space-y-3">
                {pendingPackageRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">
                          {t("Package Upgrade Request")}
                        </h3>
                        <Badge variant="outline">{t("PENDING")}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {request.requestedAt
                          ? new Date(request.requestedAt).toLocaleString()
                          : new Date(request.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {request.currentPlan?.planName || t("Current plan")} →{" "}
                      {request.requestedPlan?.planName || t("Requested plan")}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={isApprovingPackage || isRejectingPackage}
                        onClick={() =>
                          approvePackage(
                            { id: request.id },
                            {
                              onSuccess: () => {
                                toast({
                                  title: t("Request approved"),
                                  description: t(
                                    "The package request has been approved.",
                                  ),
                                });
                              },
                              onError: (error) => {
                                toast({
                                  title: t("Approve failed"),
                                  description: getErrorMessage(error),
                                  variant: "destructive",
                                });
                              },
                            },
                          )
                        }
                      >
                        {t("Approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isApprovingPackage || isRejectingPackage}
                        onClick={() => {
                          const reason =
                            window.prompt(
                              t("Rejection reason?"),
                              t("Not approved"),
                            ) ?? "";
                          if (!reason.trim()) return;
                          rejectPackage(
                            {
                              id: request.id,
                              data: { rejectionReason: reason.trim() },
                            },
                            {
                              onSuccess: () => {
                                toast({
                                  title: t("Request rejected"),
                                  description: t(
                                    "The package request has been rejected.",
                                  ),
                                });
                              },
                              onError: (error) => {
                                toast({
                                  title: t("Reject failed"),
                                  description: getErrorMessage(error),
                                  variant: "destructive",
                                });
                              },
                            },
                          );
                        }}
                      >
                        {t("Reject")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading &&
            sortedNotifications.map((notification: Notification) => (
              <div
                key={notification.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">
                      {notification.title}
                    </h3>
                    <Badge variant="outline">{notification.type}</Badge>
                    <Badge
                      variant="secondary"
                      className="uppercase tracking-wide"
                    >
                      {notification.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {notification.sentAt
                      ? new Date(notification.sentAt).toLocaleString()
                      : new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {notification.message}
                </p>
                {notification.errorMessage && (
                  <p className="text-xs text-destructive">
                    {notification.errorMessage}
                  </p>
                )}
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
