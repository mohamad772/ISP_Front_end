import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wifi,
  Globe,
  Server,
  HardDrive,
  Activity,
  Zap,
} from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { useStaticIPPools } from "@/hooks/useStaticIPPools";
import type { StaticIPPool } from "@/types/api.types";

export function NetworkPage() {
  const { data: ipPoolsByPOS = [], isLoading: poolsLoading } =
    useStaticIPPools();

  const isLoading = poolsLoading;

  const totals = ipPoolsByPOS.reduce(
    (acc, pool) => {
      acc.total += pool.totalIps || 0;
      acc.assigned += pool.assignedIps || 0;
      acc.available += pool.availableIps || 0;
      return acc;
    },
    { total: 0, assigned: 0, available: 0 },
  );

  const utilization =
    totals.total > 0 ? Math.round((totals.assigned / totals.total) * 100) : 0;

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

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        <StatCard
          title="Total IPs"
          value={isLoading ? "--" : totals.total.toLocaleString()}
          subtitle="IPs"
          icon={Wifi}
          variant="accent"
        />
        <StatCard
          title="Allocated"
          value={isLoading ? "--" : totals.assigned.toLocaleString()}
          subtitle="IPs"
          icon={Server}
          variant="default"
        />
        <StatCard
          title="Available"
          value={isLoading ? "--" : totals.available.toLocaleString()}
          subtitle="IPs"
          icon={HardDrive}
          variant="success"
        />
        <StatCard
          title="Utilization"
          value={isLoading ? "--" : `${utilization}%`}
          subtitle="Of total IPs"
          icon={Activity}
          variant="warning"
        />
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
