import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLogs } from "@/hooks/useAuditLog";
import { useBandwidthPool } from "@/hooks/usebandwidthpool";
import { useClients } from "@/hooks/useclients";
import { useInvoices } from "@/hooks/useInvoices";
import { usePayments } from "@/hooks/usepayments";
import { usePOS, usePOSList } from "@/hooks/usePos";
import { useSubscriptions } from "@/hooks/useSubscription";
import { useAdminDashboardStats } from "@/hooks/useStats";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";

// Import types
import type { InvoiceFilters, Subscription } from "@/types/api.types";

// Import icons
import {
  Activity,
  AlertTriangle,
  Building2,
  DollarSign,
  FileDown,
  FileSpreadsheet,
  FileText,
  FileWarning,
  Users,
  Wifi,
} from "lucide-react";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { jsPDF } from "jspdf";

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useStore();
  const { toast } = useToast();
  const localeWithLatinDigits = "en-US";
  const exportLocale = localeWithLatinDigits;
  const { data: stats, isLoading: isStatsLoading } = useAdminDashboardStats();
  const isPosManager = user?.role === "POS_MANAGER";
  const { data: posDetails, isLoading: isPosDetailsLoading } = usePOS(
    isPosManager ? (user?.posId ?? "") : "",
  );

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
  const { data: allInvoicesData } = useInvoices();

  // Clients data
  const { data: clientsData, isLoading: isClientsLoading } = useClients({
    page: 1,
    limit: 1000,
  });

  // Subscriptions data
  const { data: subscriptionsData, isLoading: isSubscriptionsLoading } =
    useSubscriptions();

  // Calculate totals
  const totalPos = isPosSuccess && posData ? posData.length : 0;
  const totalActivePos =
    isPosSuccess && posData
      ? posData.filter((item) => item.isActive).length
      : 0;

  const isAdmin = user?.role === "WSP_ADMIN"; // Updated to match the enum

  // Handle bandwidth error
  if (isBandwidthError) {
    console.error(bandwidthError);
  }

  // Calculate bandwidth usage
  const safePercent = (used: number, total: number) => {
    if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) {
      return 0;
    }
    return Math.round((used / total) * 100);
  };

  const posAllocatedTotal =
    isPosSuccess && posData
      ? posData.reduce(
          (sum, pos) => sum + Number(pos.allocatedBandwidthMbps || 0),
          0,
        )
      : 0;
  const posUsedTotal =
    isPosSuccess && posData
      ? posData.reduce(
          (sum, pos) => sum + Number(pos.usedBandwidthMbps || 0),
          0,
        )
      : 0;

  const globalTotalBandwidth = Number(bandwidthData?.totalBandwidthMbps ?? 0);
  const globalAllocatedBandwidth = Number(
    bandwidthData?.allocatedBandwidthMbps ?? 0,
  );
  const posAllocatedBandwidth = Number(posDetails?.allocatedBandwidthMbps ?? 0);
  const posUsedBandwidth = Number(
    (posDetails as { usedBandwidthMbps?: number; currentUsageMbps?: number })
      ?.usedBandwidthMbps ??
      (posDetails as { usedBandwidthMbps?: number; currentUsageMbps?: number })
        ?.currentUsageMbps ??
      0,
  );

  const bandwidthUsage = isPosManager
    ? safePercent(posUsedBandwidth, posAllocatedBandwidth)
    : globalTotalBandwidth > 0
      ? safePercent(globalAllocatedBandwidth, globalTotalBandwidth)
      : stats
        ? safePercent(stats.usedBandwidth, stats.totalBandwidth)
        : posAllocatedTotal > 0
          ? safePercent(posUsedTotal, posAllocatedTotal)
          : 0;

  // POS managers see their POS allocation. Admins see full WSP allocation from bandwidth pool.
  const totalBandwidth = isPosManager
    ? posAllocatedBandwidth
    : Number(
        globalTotalBandwidth || stats?.totalBandwidth || posAllocatedTotal,
      );
  const totalPosAllocatedBandwidth = isPosManager
    ? posAllocatedBandwidth
    : Number(globalAllocatedBandwidth || posAllocatedTotal);

  // Calculate total payments
  const totalPayments = useMemo(() => {
    if (!paymentData) return 0;

    return paymentData.reduce((sum, payment) => {
      return (
        sum + Number(payment.amountPaid || 0) + Number(payment.extraAmount || 0)
      );
    }, 0);
  }, [paymentData]);

  const normalizedUnpaidCount =
    allInvoicesData?.filter((inv) => {
      const status = String(inv.calculatedStatus || "").toLowerCase();
      return status === "unpaid" || status === "overdue";
    }).length ?? 0;

  const unpaidInvoicesCount =
    unpaidInvoicesData?.length ||
    normalizedUnpaidCount ||
    stats?.unpaidInvoices ||
    0;

  console.log("totalPayments : ", totalPayments);

  // Calculate total and active clients
  const totalClients = clientsData?.total || 0;
  const activeClients =
    clientsData?.data?.filter((client) => client.status === "ACTIVE").length ||
    0;

  const posNameById = useMemo(() => {
    return new Map((posData || []).map((pos) => [pos.id, pos.name]));
  }, [posData]);

  const exportRows = useMemo(() => {
    const clients = clientsData?.data || [];
    const subscriptions = subscriptionsData || [];
    const subsByClient = new Map<string, Subscription[]>();
    for (const sub of subscriptions) {
      const list = subsByClient.get(sub.clientId) || [];
      list.push(sub);
      subsByClient.set(sub.clientId, list);
    }

    return clients.map((client) => {
      const clientSubs = subsByClient.get(client.id) || [];
      const subSummary = clientSubs
        .map((sub) => {
          const planName = sub.plan?.planName || "Plan";
          const status = sub.status.toLowerCase();
          const start = new Date(sub.startDate).toLocaleDateString(
            exportLocale,
          );
          const end = new Date(sub.endDate).toLocaleDateString(exportLocale);
          const speed = sub.plan
            ? `${sub.plan.downloadSpeedMbps}/${sub.plan.uploadSpeedMbps} Mbps`
            : "—";
          const cost = sub.plan?.cost !== undefined ? `$${sub.plan.cost}` : "—";
          return `${planName} (${status}) ${start} → ${end} | ${speed} | ${cost}`;
        })
        .join(" | ");

      const posName =
        client.pos?.name ||
        (client.posId ? posNameById.get(client.posId) : undefined) ||
        "-";

      return {
        "Client Name": client.fullName,
        Email: client.email || "-",
        Phone: client.phone,
        Status: client.status,
        "Connection Type": client.connectionType,
        POS: posName,
        Address: client.address || "-",
        "Auto Renew": client.autoRenewEnabled ? "Yes" : "No",
        "Static IP": client.staticIp?.ipAddress || "-",
        "PPPoE Username": client.pppoeUsername || "-",
        "Subscriptions Count": String(clientSubs.length),
        "Subscriptions Details": subSummary || "No subscriptions",
      };
    });
  }, [clientsData, subscriptionsData, posNameById, exportLocale]);

  const exportHeaders = useMemo(
    () => [
      { key: "Client Name", label: t("Client Name") },
      { key: "Email", label: t("Email") },
      { key: "Phone", label: t("Phone") },
      { key: "Status", label: t("Status") },
      { key: "Connection Type", label: t("Connection Type") },
      { key: "POS", label: t("POS") },
      { key: "Address", label: t("Address") },
      { key: "Auto Renew", label: t("Auto Renew") },
      { key: "Static IP", label: t("Static IP") },
      { key: "PPPoE Username", label: t("PPPoE Username") },
      { key: "Subscriptions Count", label: t("Subscriptions Count") },
      { key: "Subscriptions Details", label: t("Subscriptions Details") },
    ],
    [t],
  );

  const escapeCsv = (value: string) => {
    const needsQuotes = /[",\n]/.test(value);
    const escaped = value.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };

  const handleExportExcel = () => {
    if (!exportRows.length) {
      toast({ title: t("No client data to export"), variant: "destructive" });
      return;
    }
    const lines = [
      exportHeaders.map((h) => h.label).join(","),
      ...exportRows.map((row) =>
        exportHeaders.map((h) => escapeCsv(String(row[h.key]))).join(","),
      ),
    ];
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clients-subscriptions-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    if (!exportRows.length) {
      toast({ title: t("No client data to export"), variant: "destructive" });
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;

    let currentY = margin;
    let pageNumber = 1;

    // Colors
    const primaryColor = [59, 130, 246]; // Blue
    const darkGray = [55, 65, 81];
    const lightGray = [243, 244, 246];
    const textGray = [107, 114, 128];

    const addPageNumber = () => {
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 20, {
        align: "right",
      });
      pageNumber++;
    };

    const checkPageBreak = (spaceNeeded: number) => {
      if (currentY + spaceNeeded > pageHeight - 60) {
        addPageNumber();
        doc.addPage();
        currentY = margin;
        return true;
      }
      return false;
    };

    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 80, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("Clients & Subscriptions Report", margin, 35);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(
      `Generated: ${new Date().toLocaleString(exportLocale)}`,
      margin,
      55,
    );
    doc.text(
      `${t("Total Clients")}: ${exportRows.length}`,
      pageWidth - margin,
      55,
      {
        align: "right",
      },
    );

    currentY = 100;

    // Summary Stats Box
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.roundedRect(margin, currentY, contentWidth, 60, 5, 5, "F");

    const stats = [
      { label: "Total Clients", value: exportRows.length },
      {
        label: "Active",
        value: exportRows.filter((r) => r.Status === "ACTIVE").length,
      },
      {
        label: "Inactive",
        value: exportRows.filter((r) => r.Status !== "ACTIVE").length,
      },
      {
        label: "With Subscriptions",
        value: exportRows.filter((r) => Number(r["Subscriptions Count"]) > 0)
          .length,
      },
    ];

    const statWidth = contentWidth / stats.length;
    stats.forEach((stat, idx) => {
      const x = margin + idx * statWidth + statWidth / 2;

      doc.setTextColor(textGray[0], textGray[1], textGray[2]);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(stat.label, x, currentY + 25, { align: "center" });

      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(String(stat.value), x, currentY + 45, { align: "center" });
    });

    currentY += 80;

    // Client Details
    exportRows.forEach((row, index) => {
      checkPageBreak(160);

      // Client Card Background
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(margin, currentY, contentWidth, 140, 5, 5, "F");

      // Client Number Badge
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.circle(margin + 15, currentY + 15, 12, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(String(index + 1), margin + 15, currentY + 19, {
        align: "center",
      });

      // Client Name
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(String(row["Client Name"]), margin + 35, currentY + 18);

      // Status Badge
      const status = String(row.Status);
      const statusX = pageWidth - margin - 80;
      const statusColor = status === "ACTIVE" ? [34, 197, 94] : [239, 68, 68];
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.roundedRect(statusX, currentY + 8, 70, 20, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(status, statusX + 35, currentY + 20, { align: "center" });

      // Client Details Grid
      const detailsY = currentY + 40;
      const col1X = margin + 20;
      const col2X = margin + contentWidth / 2;
      const rowHeight = 16;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      const details = [
        { label: "Email", value: String(row.Email), col: 1 },
        { label: "Phone", value: String(row.Phone), col: 1 },
        { label: "Connection", value: String(row["Connection Type"]), col: 1 },
        { label: "POS", value: String(row.POS), col: 1 },
        {
          label: "PPPoE Username",
          value: String(row["PPPoE Username"]),
          col: 2,
        },
        { label: "Static IP", value: String(row["Static IP"]), col: 2 },
        { label: "Auto Renew", value: String(row["Auto Renew"]), col: 2 },
        {
          label: "Subscriptions",
          value: String(row["Subscriptions Count"]),
          col: 2,
        },
      ];

      let row1 = 0,
        row2 = 0;
      details.forEach((detail) => {
        const x = detail.col === 1 ? col1X : col2X;
        const y =
          detail.col === 1
            ? detailsY + row1 * rowHeight
            : detailsY + row2 * rowHeight;

        doc.setTextColor(textGray[0], textGray[1], textGray[2]);
        doc.setFont("helvetica", "bold");
        doc.text(`${detail.label}:`, x, y);

        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.setFont("helvetica", "normal");
        const valueX = x + 90;
        const maxValueWidth = contentWidth / 2 - 110;
        const valueText = doc.splitTextToSize(detail.value, maxValueWidth);
        doc.text(valueText[0], valueX, y);

        if (detail.col === 1) row1++;
        else row2++;
      });

      // Subscriptions Details
      if (row["Subscriptions Details"] !== "No subscriptions") {
        const subsY = currentY + 110;
        doc.setTextColor(textGray[0], textGray[1], textGray[2]);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Subscription Details:", margin + 20, subsY);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        const subsText = doc.splitTextToSize(
          String(row["Subscriptions Details"]),
          contentWidth - 80,
        );
        doc.text(subsText[0], margin + 20, subsY + 12);
      }

      currentY += 155;
    });

    // Add final page number
    addPageNumber();

    // Save
    doc.save(
      `clients-subscriptions-${new Date().toISOString().slice(0, 10)}.pdf`,
    );

    toast({
      title: t("PDF exported successfully"),
      description: t("{{count}} clients exported", {
        count: exportRows.length,
      }),
    });
  };

  // Show loading state
  if (
    isStatsLoading ||
    isBandwidthLoading ||
    isPosLoading ||
    (isPosManager && isPosDetailsLoading) ||
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
        title={t("Welcome back")}
        description={
          isAdmin
            ? t("System overview and key metrics")
            : t("Your POS overview")
        }
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2"
                disabled={isClientsLoading || isSubscriptionsLoading}
              >
                <FileDown className="w-4 h-4" />
                {t("Export")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleExportPdf}>
                <FileText className="w-4 h-4 mr-2" />
                {t("Export PDF")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                {t("Export Excel")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={isPosManager ? t("Total Bandwidth") : t("Total Bandwidth")}
          value={`${totalBandwidth.toLocaleString(localeWithLatinDigits)} Mbps`}
          subtitle={`${bandwidthUsage}% utilized (${totalPosAllocatedBandwidth.toLocaleString(
            localeWithLatinDigits,
          )} Mbps POS allocated)`}
          icon={Wifi}
          variant="accent"
        />
        <StatCard
          title={t("Active POS")}
          value={`${totalActivePos} / ${totalPos}`}
          subtitle={t("Points of Sale")}
          icon={Building2}
          variant="success"
        />
        <StatCard
          title={t("Total Clients")}
          value={`${activeClients.toLocaleString(localeWithLatinDigits)}`}
          subtitle={t("{{count}} registered", {
            count: totalClients,
          })}
          icon={Users}
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatCard
          title={t("Monthly Revenue")}
          value={
            isPaymentLoading
              ? t("Loading...")
              : `$${totalPayments.toLocaleString(localeWithLatinDigits)}`
          }
          icon={DollarSign}
          variant="success"
          trend={{ value: 12.8, isPositive: true }}
        />
      </div>

      <div className="grid gap-6">
        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              {t("Recent Alerts")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!stats?.recentAlerts || stats?.recentAlerts.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  {t("No recent alerts")}
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
                  <p className="font-medium">{t(alert.message)}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {new Date(alert.timestamp).toLocaleString(
                      localeWithLatinDigits,
                    )}
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
                <p className="text-2xl font-bold">${unpaidInvoicesCount}</p>
                <p className="text-sm text-muted-foreground">
                  {t("Unpaid Invoices")}
                </p>
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
                  {activeClients.toLocaleString(localeWithLatinDigits)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("Active Clients")}
                </p>
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
                <p className="text-sm text-muted-foreground">
                  {t("Active Branches")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
