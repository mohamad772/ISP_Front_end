import type {
  DashboardStats,
  POSDashboardStats,
} from "@/types/api.types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getAdminDashboardStats(): Promise<DashboardStats> {
  await delay(800);

  return {
    totalBandwidth: 10000, // Mbps
    usedBandwidth: 6500,
    totalPOS: 12,
    activePOS: 10,
    totalClients: 2450,
    activeClients: 2180,
    monthlyRevenue: 125000,
    unpaidInvoices: 45,
    recentAlerts: [
      {
        id: "1",
        type: "warning",
        message: "POS Downtown bandwidth usage at 85%",
        timestamp: new Date().toISOString(),
      },
      {
        id: "2",
        type: "error",
        message: "Client payment overdue - ID #1234",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "3",
        type: "info",
        message: "System backup completed successfully",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
  };
}

export async function getPOSDashboardStats(
  posId: string,
): Promise<POSDashboardStats> {
  void posId;
  await delay(800);

  return {
    allocatedBandwidth: 1000,
    usedBandwidth: 720,
    activeClients: 185,
    unpaidInvoices: 12,
    bandwidthHistory: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000)
        .toISOString()
        .split("T")[0],
      usage: 600 + Math.floor(Math.random() * 200),
    })),
  };
}
