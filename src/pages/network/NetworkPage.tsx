import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wifi,
  Globe,
  Server,
  HardDrive,
  Activity,
  Zap,
} from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { useToast } from "@/hooks/use-toast";
import { usePOSList } from "@/hooks/usePos";
import { useCreateStaticIP } from "@/hooks/useStaticIp";
import { useStaticIPPools } from "@/hooks/useStaticIPPools";
import type { CreateStaticIPRequest, StaticIPPool } from "@/types/api.types";

export function NetworkPage() {
  const { toast } = useToast();
  const { data: ipPoolsByPOS = [], isLoading: poolsLoading } =
    useStaticIPPools();
  const { data: posList = [] } = usePOSList();
  const createStaticIPMutation = useCreateStaticIP();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newStaticIP, setNewStaticIP] = useState<CreateStaticIPRequest>({
    posId: "",
    subnetMask: "",
    gateway: "",
    dnsPrimary: "",
    dnsSecondary: "",
  });
  const [ipRange, setIpRange] = useState({
    start: "",
    end: "",
  });

  const isLoading = poolsLoading;

  const parseIPv4 = (value: string) => {
    const parts = value.trim().split(".");
    if (parts.length !== 4) return null;
    const nums = parts.map((part) => Number(part));
    if (nums.some((num) => !Number.isInteger(num) || num < 0 || num > 255)) {
      return null;
    }
    return nums;
  };

  const handleCreateStaticIP = async () => {
    if (isCreating) return;
    if (
      !newStaticIP.posId ||
      !ipRange.start.trim() ||
      !ipRange.end.trim() ||
      !newStaticIP.subnetMask.trim() ||
      !newStaticIP.gateway.trim()
    ) {
      toast({
        title: "POS, IP range, subnet mask, and gateway are required",
        variant: "destructive",
      });
      return;
    }
    const startParts = parseIPv4(ipRange.start);
    const endParts = parseIPv4(ipRange.end);
    if (!startParts || !endParts) {
      toast({
        title: "Enter valid IPv4 addresses",
        variant: "destructive",
      });
      return;
    }
    const samePrefix =
      startParts[0] === endParts[0] &&
      startParts[1] === endParts[1] &&
      startParts[2] === endParts[2];
    if (!samePrefix) {
      toast({
        title: "Start and end IP must be in the same /24 range",
        variant: "destructive",
      });
      return;
    }
    if (endParts[3] < startParts[3]) {
      toast({
        title: "End IP must be greater than or equal to start IP",
        variant: "destructive",
      });
      return;
    }
    const count = endParts[3] - startParts[3] + 1;
    if (count > 512) {
      toast({
        title: "IP range is too large (max 512)",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsCreating(true);
      for (let last = startParts[3]; last <= endParts[3]; last += 1) {
        const ipAddress = `${startParts[0]}.${startParts[1]}.${startParts[2]}.${last}`;
        await createStaticIPMutation.mutateAsync({
          posId: newStaticIP.posId,
          ipAddress,
          subnetMask: newStaticIP.subnetMask.trim(),
          gateway: newStaticIP.gateway.trim(),
          dnsPrimary: newStaticIP.dnsPrimary?.trim() || undefined,
          dnsSecondary: newStaticIP.dnsSecondary?.trim() || undefined,
        });
      }
      toast({ title: `Created ${count} static IPs` });
      setIsCreateOpen(false);
      setNewStaticIP({
        posId: "",
        subnetMask: "",
        gateway: "",
        dnsPrimary: "",
        dnsSecondary: "",
      });
      setIpRange({ start: "", end: "" });
    } catch (error) {
      const rawMessage =
        (error as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage || "Failed to create static IP";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

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
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>Add Static IP</Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-2rem)] max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Static IP</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>POS</Label>
                  <Select
                    value={newStaticIP.posId}
                    onValueChange={(value) =>
                      setNewStaticIP({ ...newStaticIP, posId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select POS" />
                    </SelectTrigger>
                    <SelectContent>
                      {posList.length === 0 && (
                        <SelectItem value="none" disabled>
                          No POS available
                        </SelectItem>
                      )}
                      {posList.map((pos) => (
                        <SelectItem key={pos.id} value={pos.id}>
                          {pos.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start IP</Label>
                    <Input
                      value={ipRange.start}
                      onChange={(e) =>
                        setIpRange({ ...ipRange, start: e.target.value })
                      }
                      placeholder="e.g. 180.150.1.2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End IP</Label>
                    <Input
                      value={ipRange.end}
                      onChange={(e) =>
                        setIpRange({ ...ipRange, end: e.target.value })
                      }
                      placeholder="e.g. 180.150.1.100"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subnet Mask</Label>
                  <Input
                    value={newStaticIP.subnetMask}
                    onChange={(e) =>
                      setNewStaticIP({
                        ...newStaticIP,
                        subnetMask: e.target.value,
                      })
                    }
                    placeholder="e.g. 255.255.255.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gateway</Label>
                  <Input
                    value={newStaticIP.gateway}
                    onChange={(e) =>
                      setNewStaticIP({
                        ...newStaticIP,
                        gateway: e.target.value,
                      })
                    }
                    placeholder="e.g. 192.168.1.1"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Primary DNS (optional)</Label>
                    <Input
                      value={newStaticIP.dnsPrimary || ""}
                      onChange={(e) =>
                        setNewStaticIP({
                          ...newStaticIP,
                          dnsPrimary: e.target.value,
                        })
                      }
                      placeholder="e.g. 8.8.8.8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary DNS (optional)</Label>
                    <Input
                      value={newStaticIP.dnsSecondary || ""}
                      onChange={(e) =>
                        setNewStaticIP({
                          ...newStaticIP,
                          dnsSecondary: e.target.value,
                        })
                      }
                      placeholder="e.g. 8.8.4.4"
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreateStaticIP}
                  disabled={isCreating}
                >
                  {isCreating ? "Creating..." : "Create Static IP"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
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
