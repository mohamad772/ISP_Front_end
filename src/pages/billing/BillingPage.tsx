import { useEffect, useState } from 'react';
import { billingApi } from '@/api/billing';
import type { ServicePlan, Invoice, Payment } from '@/types';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, FileText, CreditCard, Package, Plus, Wifi } from 'lucide-react';

export function BillingPage() {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [plansData, invoicesData, paymentsData] = await Promise.all([
          billingApi.getPlans(),
          billingApi.getInvoices(),
          billingApi.getPayments(),
        ]);
        setPlans(plansData);
        setInvoices(invoicesData);
        setPayments(paymentsData);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const unpaidAmount = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.amount, 0);

  const invoiceColumns = [
    { key: 'id', header: 'Invoice #' },
    { key: 'clientName', header: 'Client' },
    { key: 'amount', header: 'Amount', render: (i: Invoice) => `$${i.amount.toFixed(2)}` },
    { key: 'dueDate', header: 'Due Date', render: (i: Invoice) => new Date(i.dueDate).toLocaleDateString() },
    { key: 'status', header: 'Status', render: (i: Invoice) => <StatusBadge status={i.status} /> },
  ];

  const paymentColumns = [
    { key: 'reference', header: 'Reference' },
    { key: 'clientName', header: 'Client' },
    { key: 'amount', header: 'Amount', render: (p: Payment) => `$${p.amount.toFixed(2)}` },
    { key: 'method', header: 'Method', render: (p: Payment) => <span className="capitalize">{p.method.replace('_', ' ')}</span> },
    { key: 'date', header: 'Date', render: (p: Payment) => new Date(p.date).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Billing & Plans"
        description="Manage service plans, invoices, and payments"
        actions={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Monthly Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} variant="success" />
        <StatCard title="Unpaid Amount" value={`$${unpaidAmount.toLocaleString()}`} icon={FileText} variant="warning" />
        <StatCard title="Total Invoices" value={invoices.length} icon={CreditCard} />
        <StatCard title="Active Plans" value={plans.filter(p => p.isActive).length} icon={Package} variant="accent" />
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">Service Plans</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <Card key={plan.id} className={!plan.isActive ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {!plan.isActive && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4 text-accent">
                    <Wifi className="w-4 h-4" />
                    <span className="font-medium">{plan.bandwidth} Mbps</span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full mt-4">Edit Plan</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardContent className="pt-6">
              <DataTable columns={invoiceColumns} data={invoices} isLoading={isLoading} emptyMessage="No invoices" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="pt-6">
              <DataTable columns={paymentColumns} data={payments} isLoading={isLoading} emptyMessage="No payments" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
