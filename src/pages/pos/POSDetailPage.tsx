import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { posApi } from '@/api/pos';
import { clientsApi } from '@/api/clients';
import type { POS, Client } from '@/types';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Wifi, Users, Globe, Activity, Edit } from 'lucide-react';

export function POSDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pos, setPOS] = useState<POS | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const [posData, clientsData] = await Promise.all([
          posApi.getById(id),
          clientsApi.getAll({ posId: id }),
        ]);
        setPOS(posData || null);
        setClients(clientsData);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!pos) {
    return <div>POS not found</div>;
  }

  const bandwidthUsage = Math.round((pos.usedBandwidth / pos.allocatedBandwidth) * 100);

  const clientColumns = [
    { key: 'fullName', header: 'Name' },
    { key: 'type', header: 'Type', render: (c: Client) => <span className="capitalize">{c.type.replace('_', ' ')}</span> },
    { key: 'status', header: 'Status', render: (c: Client) => <StatusBadge status={c.status} /> },
    { key: 'planName', header: 'Plan' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={pos.name}
        description={`${pos.location} • ${pos.address}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/pos')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit POS
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Allocated Bandwidth" value={`${pos.allocatedBandwidth} Mbps`} icon={Wifi} variant="accent" />
        <StatCard title="Active Clients" value={pos.activeClients} subtitle={`of ${pos.totalClients} total`} icon={Users} variant="success" />
        <StatCard title="Static IPs Used" value={`${pos.usedStaticIps} / ${pos.staticIpPool}`} icon={Globe} />
        <Card className="stat-card">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Bandwidth Usage</p>
              <p className="text-2xl font-bold">{bandwidthUsage}%</p>
            </div>
            <div className="p-3 rounded-lg bg-accent/10">
              <Activity className="w-5 h-5 text-accent" />
            </div>
          </div>
          <Progress value={bandwidthUsage} className="mt-3 h-2" />
        </Card>
      </div>

      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">Clients ({clients.length})</TabsTrigger>
          <TabsTrigger value="usage">Usage Charts</TabsTrigger>
          <TabsTrigger value="static-ips">Static IPs</TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Active Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={clientColumns}
                data={clients}
                emptyMessage="No clients in this POS"
                onRowClick={(client) => navigate(`/clients/${client.id}`)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Bandwidth Usage Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg border border-dashed border-border">
                <p className="text-muted-foreground">Usage chart placeholder</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="static-ips">
          <Card>
            <CardHeader>
              <CardTitle>Static IP Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Static IP management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
