import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientsApi } from '@/api/clients';
import { billingApi } from '@/api/billing';
import type { Client, Invoice, Subscription } from '@/types';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Edit, Ban, CheckCircle, Trash2, Key, Mail, Phone, MapPin, Globe, User } from 'lucide-react';

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const [clientData, invoicesData, subsData] = await Promise.all([
          clientsApi.getById(id),
          billingApi.getInvoices({ clientId: id }),
          billingApi.getSubscriptions(id),
        ]);
        setClient(clientData || null);
        setInvoices(invoicesData);
        setSubscriptions(subsData);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleSuspend = async () => {
    if (!client) return;
    try {
      await clientsApi.suspend(client.id);
      setClient({ ...client, status: 'suspended' });
      toast({ title: 'Client suspended' });
    } catch {
      toast({ title: 'Failed to suspend client', variant: 'destructive' });
    }
  };

  const handleReactivate = async () => {
    if (!client) return;
    try {
      await clientsApi.reactivate(client.id);
      setClient({ ...client, status: 'active' });
      toast({ title: 'Client reactivated' });
    } catch {
      toast({ title: 'Failed to reactivate client', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!client) {
    return <div>Client not found</div>;
  }

  const invoiceColumns = [
    { key: 'id', header: 'Invoice #' },
    { key: 'amount', header: 'Amount', render: (i: Invoice) => `$${i.amount.toFixed(2)}` },
    { key: 'dueDate', header: 'Due Date', render: (i: Invoice) => new Date(i.dueDate).toLocaleDateString() },
    { key: 'status', header: 'Status', render: (i: Invoice) => <StatusBadge status={i.status} /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={client.fullName}
        description={`Status: ${client.status.charAt(0).toUpperCase() + client.status.slice(1)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/clients')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            {client.status === 'active' ? (
              <Button variant="destructive" onClick={handleSuspend}>
                <Ban className="w-4 h-4 mr-2" />
                Suspend
              </Button>
            ) : client.status === 'suspended' ? (
              <Button variant="default" onClick={handleReactivate}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Reactivate
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{client.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{client.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{client.address}</span>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">Connection Type</p>
              <p className="font-medium capitalize">{client.type.replace('_', ' ')}</p>
            </div>
            {client.staticIp && (
              <div>
                <p className="text-xs text-muted-foreground">Static IP</p>
                <p className="font-medium font-mono">{client.staticIp}</p>
              </div>
            )}
            {client.pppoeUsername && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">PPPoE Username</p>
                  <p className="font-medium font-mono">{client.pppoeUsername}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Key className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Current Plan</p>
              <p className="font-medium text-lg">{client.planName || 'No plan'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monthly Rate</p>
              <p className="font-medium text-lg">${client.monthlyRate.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">POS</p>
              <p className="font-medium">{client.posName}</p>
            </div>
            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full">Upgrade Plan</Button>
            </div>
          </CardContent>
        </Card>

        {/* Balance Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`text-3xl font-bold ${client.balance < 0 ? 'text-destructive' : 'text-success'}`}>
              ${client.balance.toFixed(2)}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Payment</p>
              <p className="font-medium">{client.lastPayment ? new Date(client.lastPayment).toLocaleDateString() : 'None'}</p>
            </div>
            <div className="pt-4 border-t space-y-2">
              <Button className="w-full">Record Payment</Button>
              <Button variant="outline" className="w-full">Generate Invoice</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="history">Suspension History</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card>
            <CardContent className="pt-6">
              <DataTable columns={invoiceColumns} data={invoices} emptyMessage="No invoices" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="pt-6 text-center py-12 text-muted-foreground">
              Payment history will be displayed here
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6 text-center py-12 text-muted-foreground">
              Suspension history will be displayed here
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
