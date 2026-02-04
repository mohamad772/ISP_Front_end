import { useEffect, useState } from 'react';
import { networkApi } from '@/api/network';
import type { StaticIPPool } from '@/types';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable } from '@/components/common/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Wifi, Globe, Server, HardDrive } from 'lucide-react';

export function NetworkPage() {
  const [ipPools, setIPPools] = useState<StaticIPPool[]>([]);
  const [bandwidth, setBandwidth] = useState({ total: 0, allocated: 0, available: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pools, bw] = await Promise.all([
          networkApi.getIPPools(),
          networkApi.getBandwidthSummary(),
        ]);
        setIPPools(pools);
        setBandwidth(bw);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const bandwidthUsage = Math.round((bandwidth.allocated / bandwidth.total) * 100);

  const poolColumns = [
    { key: 'posName', header: 'POS' },
    { key: 'subnet', header: 'Subnet', render: (p: StaticIPPool) => <code className="bg-muted px-2 py-0.5 rounded text-sm">{p.subnet}</code> },
    { key: 'totalIps', header: 'Total IPs' },
    {
      key: 'usage',
      header: 'Usage',
      render: (pool: StaticIPPool) => {
        const usage = Math.round((pool.assignedIps / pool.totalIps) * 100);
        return (
          <div className="w-32">
            <div className="flex justify-between text-xs mb-1">
              <span>{pool.assignedIps} used</span>
              <span className="text-muted-foreground">{usage}%</span>
            </div>
            <Progress value={usage} className="h-2" />
          </div>
        );
      },
    },
    { key: 'availableIps', header: 'Available' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Network Resources"
        description="Manage bandwidth pool and static IP allocations"
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Bandwidth" value={`${bandwidth.total.toLocaleString()} Mbps`} icon={Wifi} variant="accent" />
        <StatCard title="Allocated" value={`${bandwidth.allocated.toLocaleString()} Mbps`} icon={Server} />
        <StatCard title="Available" value={`${bandwidth.available.toLocaleString()} Mbps`} icon={HardDrive} variant="success" />
        <Card className="stat-card">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Utilization</p>
              <p className="text-2xl font-bold">{bandwidthUsage}%</p>
            </div>
            <div className="p-3 rounded-lg bg-accent/10">
              <Globe className="w-5 h-5 text-accent" />
            </div>
          </div>
          <Progress value={bandwidthUsage} className="mt-3 h-2" />
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Static IP Pools</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={poolColumns}
            data={ipPools}
            isLoading={isLoading}
            emptyMessage="No IP pools configured"
          />
        </CardContent>
      </Card>
    </div>
  );
}
