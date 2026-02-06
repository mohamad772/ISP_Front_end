import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { DataTable } from "@/components/common/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Wifi,
  Globe,
  Server,
  HardDrive,
  Activity,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useBandwidthPool } from "@/hooks/usebandwidthpool";
import { useStaticIPPools } from "@/hooks/useStaticIPPools";
import type { StaticIPPool } from "@/types/api.types";

export function NetworkPage() {
  const { data: bandwidthPool, isLoading: bandwidthLoading } =
    useBandwidthPool();
  const { data: ipPoolsByPOS = [], isLoading: poolsLoading } =
    useStaticIPPools();

  const isLoading = bandwidthLoading || poolsLoading;

  const bandwidth = {
    total: bandwidthPool?.totalBandwidthMbps || 0,
    allocated: bandwidthPool?.allocatedBandwidthMbps || 0,
    available: bandwidthPool?.availableBandwidthMbps || 0,
  };

  const bandwidthUsage =
    bandwidth.total > 0
      ? Math.round((bandwidth.allocated / bandwidth.total) * 100)
      : 0;

  const poolColumns = [
    {
      key: "posName",
      header: "POS",
      render: (pool: StaticIPPool) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-500/20 dark:to-fuchsia-500/20 flex items-center justify-center border border-violet-200 dark:border-violet-500/20 shadow-sm">
            <Server className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {pool.posName}
          </span>
        </div>
      ),
    },
    {
      key: "subnet",
      header: "Subnet",
      render: (pool: StaticIPPool) => (
        <div className="relative group">
          <code className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900/50 dark:to-slate-800/50 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-mono border border-slate-200 dark:border-slate-700/50 inline-flex items-center gap-2 transition-all duration-300 group-hover:border-violet-300 dark:group-hover:border-violet-500/50 group-hover:shadow-md dark:group-hover:shadow-lg group-hover:shadow-violet-200/50 dark:group-hover:shadow-violet-500/10 text-slate-900 dark:text-slate-100">
            <Globe className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
            {pool.subnet}
          </code>
        </div>
      ),
    },
    {
      key: "totalIps",
      header: "Total IPs",
      render: (pool: StaticIPPool) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shadow-sm">
            <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-500" />
          </div>
          <span className="font-semibold text-lg text-slate-900 dark:text-slate-100">
            {pool.totalIps}
          </span>
        </div>
      ),
    },
    {
      key: "usage",
      header: "Usage",
      render: (pool: StaticIPPool) => {
        const usage =
          pool.totalIps > 0
            ? Math.round((pool.assignedIps / pool.totalIps) * 100)
            : 0;

        const getUsageColor = (usage: number) => {
          if (usage >= 90) return "from-red-500 to-orange-500";
          if (usage >= 70) return "from-amber-500 to-yellow-500";
          return "from-emerald-500 to-teal-500";
        };

        const getUsageBg = (usage: number) => {
          if (usage >= 90)
            return "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400";
          if (usage >= 70)
            return "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400";
          return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
        };

        return (
          <div className="w-40">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {pool.assignedIps} / {pool.totalIps}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${getUsageBg(usage)}`}
              >
                {usage}%
              </span>
            </div>
            <div className="relative h-2.5 bg-slate-200 dark:bg-slate-800/50 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700/50 shadow-inner">
              <div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getUsageColor(usage)} rounded-full transition-all duration-500 shadow-sm`}
                style={{ width: `${usage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "availableIps",
      header: "Available",
      render: (pool: StaticIPPool) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
          </div>
          <span className="font-semibold text-lg text-emerald-600 dark:text-emerald-500">
            {pool.availableIps}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-violet-300/20 dark:bg-violet-500/10 rounded-full blur-3xl animate-[pulse-slow_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-fuchsia-300/20 dark:bg-fuchsia-500/10 rounded-full blur-3xl animate-[pulse-slow_8s_ease-in-out_infinite] [animation-delay:2s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-300/10 dark:bg-blue-500/5 rounded-full blur-3xl animate-[pulse-slow_8s_ease-in-out_infinite] [animation-delay:4s]" />
      </div>

      <PageHeader
        title="Network Resources"
        description="Manage bandwidth pool and static IP allocations"
      />

      {/* Enhanced Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Total Bandwidth Card */}
        <Card className="relative overflow-hidden border-violet-200 dark:border-violet-500/20 bg-gradient-to-br from-white to-violet-50/50 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-violet-300/30 dark:hover:shadow-violet-500/20 hover:-translate-y-1 group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-200/30 dark:from-violet-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Total Bandwidth
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                  {bandwidth.total.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">Mbps</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-500/20 dark:to-fuchsia-500/20 border border-violet-200 dark:border-violet-500/30 shadow-lg shadow-violet-200/50 dark:shadow-violet-500/20">
                <Wifi className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                +12.5%
              </span>
              <span className="text-slate-500">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Allocated Card */}
        <Card className="relative overflow-hidden border-blue-200 dark:border-blue-500/20 bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-blue-300/30 dark:hover:shadow-blue-500/20 hover:-translate-y-1 group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-200/30 dark:from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Allocated
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  {bandwidth.allocated.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">Mbps</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-500/20 dark:to-cyan-500/20 border border-blue-200 dark:border-blue-500/30 shadow-lg shadow-blue-200/50 dark:shadow-blue-500/20">
                <Server className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-slate-600 dark:text-slate-400">
                Active allocations
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Available Card */}
        <Card className="relative overflow-hidden border-emerald-200 dark:border-emerald-500/20 bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-300/30 dark:hover:shadow-emerald-500/20 hover:-translate-y-1 group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/30 dark:from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Available
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                  {bandwidth.available.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">Mbps</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/20 dark:to-teal-500/20 border border-emerald-200 dark:border-emerald-500/30 shadow-lg shadow-emerald-200/50 dark:shadow-emerald-500/20">
                <HardDrive className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-slate-600 dark:text-slate-400">
                Ready to allocate
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Utilization Card */}
        <Card className="relative overflow-hidden border-amber-200 dark:border-amber-500/20 bg-gradient-to-br from-white to-amber-50/50 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-amber-300/30 dark:hover:shadow-amber-500/20 hover:-translate-y-1 group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-200/30 dark:from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Utilization
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                  {bandwidthUsage}%
                </p>
                <p className="text-xs text-slate-500">Of total capacity</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-200 dark:border-amber-500/30 shadow-lg shadow-amber-200/50 dark:shadow-amber-500/20">
                <Globe className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="relative h-2.5 bg-slate-200 dark:bg-slate-800/50 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700/50 shadow-inner">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-full transition-all duration-500 shadow-md dark:shadow-lg shadow-amber-300/50 dark:shadow-amber-500/50"
                style={{ width: `${bandwidthUsage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced IP Pools Table */}
      <Card className="relative overflow-hidden border-slate-200 dark:border-slate-700/50 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-xl shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-100/30 dark:from-violet-500/5 via-transparent to-fuchsia-100/30 dark:to-fuchsia-500/5 pointer-events-none" />
        <CardHeader className="border-b border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-500/20 dark:to-fuchsia-500/20 border border-violet-200 dark:border-violet-500/30 shadow-sm">
                <Server className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-xl bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  Static IP Pools by POS
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Manage and monitor IP address allocations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-medium shadow-sm">
                {ipPoolsByPOS.length} Pools Active
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 relative z-10">
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/30">
            <DataTable
              columns={poolColumns}
              data={ipPoolsByPOS}
              isLoading={isLoading}
              emptyMessage="No IP pools configured"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
