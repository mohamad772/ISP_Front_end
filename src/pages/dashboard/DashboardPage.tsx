import { statsApi } from "@/api/stats";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLogs } from "@/hooks/useAuditLog";
import { useBandwidthPool } from "@/hooks/usebandwidthpool";
import { useClients } from "@/hooks/useclients";
import { useInvoices } from "@/hooks/useInvoices";
import { usePayments } from "@/hooks/usepayments";
import { usePOSList } from "@/hooks/usePos";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { DashboardStats } from "@/types";



// Import types
import type { InvoiceFilters } from "@/types/api.types";

// Import icons
import {
  Activity,
  AlertTriangle,
  Building2,
  DollarSign,
  FileWarning,
  Users,
  Wifi,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

export function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Bandwidth pool data
  const {
    data: bandwidthData,
    isLoading: isBandwidthLoading,
    isError: isBandwidthError,
    error: bandwidthError,
  } = useBandwidthPool();

  // POS data
  const {
    data: posData,
    isLoading: isPosLoading,
    isSuccess: isPosSuccess,
  } = usePOSList();

  // Payments data
  const { data: paymentData, isLoading: isPaymentLoading } = usePayments();

  // Audit logs data
  const {
    data: auditData,
    isLoading: isAuditLoading,
    isSuccess: isAuditSuccess,
  } = useAuditLogs();

  // Unpaid invoices data
  const {
    data: unpaidInvoicesData,
    isLoading: isUnpaidInvoicesLoading,
    isSuccess: isUnpaidInvoicesSuccess,
  } = useInvoices({ status: "UNPAID" } as InvoiceFilters);

  // Clients data
  const { data: clientsData, isLoading: isClientsLoading } = useClients();

  // Calculate totals
  const totalPos = isPosSuccess && posData ? posData.length : 0;
  const totalActivePos =
    isPosSuccess && posData
      ? posData.filter((item) => item.isActive).length
      : 0;

  // Load stats from API
  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await statsApi.getAdminDashboard();
        setStats(data);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

  const isAdmin = user?.role === "WSP_ADMIN"; // Updated to match the enum

  // Handle bandwidth error
  if (isBandwidthError) {
    console.error(bandwidthError);
  }

  // Calculate bandwidth usage
  const bandwidthUsage = bandwidthData
    ? Math.round(
        (bandwidthData.allocatedBandwidthMbps /
          bandwidthData.totalBandwidthMbps) *
          100,
      )
    : stats
      ? Math.round((stats.usedBandwidth / stats.totalBandwidth) * 100)
      : 0;

  // Get bandwidth values from either source
  const totalBandwidth =
    bandwidthData?.totalBandwidthMbps || stats?.totalBandwidth || 0;
  const allocatedBandwidth =
    bandwidthData?.allocatedBandwidthMbps || stats?.usedBandwidth || 0;

  // Calculate total payments
  const totalPayments = useMemo(() => {
    if (!paymentData) return 0;

    return paymentData.reduce((sum, payment) => {
      return (
        sum + Number(payment.amountPaid || 0) + Number(payment.extraAmount || 0)
      );
    }, 0);
  }, [paymentData]);

  console.log("totalPayments : ", totalPayments);

  // Calculate total and active clients
  const totalClients = clientsData?.total || 0;
  const activeClients =
    clientsData?.data?.filter((client) => client.status === "ACTIVE").length ||
    0;

  // Show loading state
  if (
    isLoading ||
    isBandwidthLoading ||
    isPosLoading ||
    isAuditLoading ||
    isUnpaidInvoicesLoading ||
    isClientsLoading
  ) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Welcome back, ${user?.username || "User"}`}
        description={
          isAdmin ? "System overview and key metrics" : "Your POS overview"
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Bandwidth"
          value={`${totalBandwidth.toLocaleString()} Mbps`}
          subtitle={`${bandwidthUsage}% utilized (${allocatedBandwidth.toLocaleString()} Mbps allocated)`}
          icon={Wifi}
          variant="accent"
        />
        <StatCard
          title="Active POS"
          value={`${totalActivePos} / ${totalPos}`}
          subtitle="Points of Sale"
          icon={Building2}
          variant="success"
        />
        <StatCard
          title="Total Clients"
          value={`${activeClients.toLocaleString()}`}
          subtitle={`${totalClients.toLocaleString()} registered`}
          icon={Users}
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatCard
          title="Monthly Revenue"
          value={
            isPaymentLoading
              ? "Loading..."
              : `$${totalPayments.toLocaleString()}`
          }
          icon={DollarSign}
          variant="success"
          trend={{ value: 12.8, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity Logs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {auditData && auditData.length > 0 ? (
              <div className="space-y-2">
                <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2">
                  {auditData.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border hover:bg-accent/5 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-accent/10 text-accent font-semibold text-sm">
                        {item.user?.username
                          ? item.user.username.charAt(0).toUpperCase()
                          : "?"}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">
                              {item.user?.username || "Unknown User"}
                            </p>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground font-medium">
                              {item.userRole}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <p className="text-sm font-medium text-foreground">
                          {item.action}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="truncate">
                            {item.user?.email || "N/A"}
                          </span>
                          {item.posId && (
                            <>
                              <span>•</span>
                              <span className="px-2 py-0.5 rounded bg-accent/10 text-accent font-medium">
                                POS: {item.posId.substring(0, 8)}...
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center bg-muted/30 rounded-lg border border-dashed border-border">
                <Activity className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">
                  No recent activity
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  User activity logs will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!stats?.recentAlerts || stats?.recentAlerts.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No recent alerts
                </p>
              </div>
            ) : (
              stats?.recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "p-3 rounded-lg text-sm border",
                    alert.type === "error" &&
                      "bg-destructive/10 text-destructive border-destructive/20",
                    alert.type === "warning" &&
                      "bg-warning/10 text-warning border-warning/20",
                    alert.type === "info" &&
                      "bg-accent/10 text-accent border-accent/20",
                  )}
                >
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-warning/10">
                <FileWarning className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {unpaidInvoicesData?.length ?? 0}
                </p>
                <p className="text-sm text-muted-foreground">Unpaid Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <Users className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {activeClients.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Active Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <Building2 className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalActivePos}</p>
                <p className="text-sm text-muted-foreground">Active Branches</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
