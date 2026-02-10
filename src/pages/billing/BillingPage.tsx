import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getInvoiceStatus, isInvoicePaid } from "@/utils/invoiceStatus";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  FileText,
  CreditCard,
  Package,
  Plus,
  Wifi,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useInvoices, useCreateInvoice } from "@/hooks/useInvoices";
import { usePayments, useCreatePayment } from "@/hooks/usepayments";
import type { ServicePlan, Invoice, Payment } from "@/types/api.types";
import { PaymentMethod, ServiceType, DurationType } from "@/types/api.types";
import {
  useServicePlans,
  useCreateServicePlan,
  useUpdateServicePlan,
  useActivateServicePlan,
  useDeactivateServicePlan,
} from "@/hooks/useServicePlan";
import { useClients } from "@/hooks/useclients";

const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/25 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/2 -right-32 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute -bottom-24 left-1/3 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-2000" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
    </div>
  );
};

export function BillingPage() {
  const { toast } = useToast();
  const { data: plans = [], isLoading: plansLoading } = useServicePlans();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: payments = [], isLoading: paymentsLoading } = usePayments();
  const { data: clientsData } = useClients({ page: 1, limit: 1000 });
  const clients = clientsData?.data ?? [];
  const createInvoiceMutation = useCreateInvoice();
  const createPaymentMutation = useCreatePayment();
  const createPlanMutation = useCreateServicePlan();
  const updatePlanMutation = useUpdateServicePlan();
  const activatePlanMutation = useActivateServicePlan();
  const deactivatePlanMutation = useDeactivateServicePlan();

  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | null>(null);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  const [invoiceForm, setInvoiceForm] = useState({
    clientId: "none",
    amount: "",
    issueDate: "",
    dueDate: "",
    notes: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    invoiceId: "none",
    amountPaid: "",
    paymentMethod: PaymentMethod.CASH as PaymentMethod,
    paymentReference: "",
    notes: "",
  });
  const [planForm, setPlanForm] = useState({
    planName: "",
    description: "",
    serviceType: ServiceType.PREPAID as ServiceType,
    durationType: DurationType.MONTHLY as DurationType,
    durationDays: "",
    cost: "",
    downloadSpeedMbps: "",
    uploadSpeedMbps: "",
    dataCapacityGb: "",
    isActive: true,
  });

  const isLoading = plansLoading || invoicesLoading || paymentsLoading;

  const totalRevenue = payments.reduce(
    (sum, p) => sum + Number(p.amountPaid || 0) + Number(p.extraAmount || 0),
    0,
  );
  const unpaidAmount = invoices
    .filter((i) => !isInvoicePaid(i))
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const invoiceColumns = [
    { key: "invoiceNumber", header: "Invoice #" },
    {
      key: "clientName",
      header: "Client",
      render: (i: Invoice) => i.client?.fullName || "N/A",
    },
    {
      key: "amount",
      header: "Amount",
      render: (i: Invoice) => `$${Number(i.amount || 0).toFixed(2)}`,
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (i: Invoice) =>
        i.dueDate ? new Date(i.dueDate).toLocaleDateString() : "-",
    },
    {
      key: "status",
      header: "Status",
      render: (i: Invoice) => (
        <StatusBadge status={getInvoiceStatus(i).toLowerCase()} />
      ),
    },
  ];

  const paymentColumns = [
    { key: "paymentReference", header: "Reference" },
    {
      key: "clientName",
      header: "Client",
      render: (p: Payment) => p.invoice?.client?.fullName || "N/A",
    },
    {
      key: "amount",
      header: "Amount",
      render: (p: Payment) =>
        `$${(Number(p.amountPaid) + Number(p.extraAmount || 0)).toFixed(2)}`,
    },
    {
      key: "method",
      header: "Method",
      render: (p: Payment) => (
        <span className="capitalize">
          {(p.paymentMethod || "CASH").toLowerCase().replace("_", " ")}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (p: Payment) => new Date(p.paymentDate).toLocaleDateString(),
    },
  ];

  const openInvoice = () => {
    setInvoiceForm({
      clientId: "none",
      amount: "",
      issueDate: "",
      dueDate: "",
      notes: "",
    });
    setIsInvoiceOpen(true);
  };

  const openPayment = () => {
    const unpaid = invoices.filter((i) => !isInvoicePaid(i));
    const first = unpaid[0];
    setPaymentForm({
      invoiceId: first ? first.id : "none",
      amountPaid: "",
      paymentMethod: PaymentMethod.CASH,
      paymentReference: "",
      notes: "",
    });
    setIsPaymentOpen(true);
  };

  const openCreatePlan = () => {
    setPlanForm({
      planName: "",
      description: "",
      serviceType: ServiceType.PREPAID,
      durationType: DurationType.MONTHLY,
      durationDays: "",
      cost: "",
      downloadSpeedMbps: "",
      uploadSpeedMbps: "",
      dataCapacityGb: "",
      isActive: true,
    });
    setIsPlanOpen(true);
  };

  const openEditPlan = (plan: ServicePlan) => {
    setSelectedPlan(plan);
    setPlanForm({
      planName: plan.planName,
      description: plan.description || "",
      serviceType: plan.serviceType,
      durationType: plan.durationType,
      durationDays: String(plan.durationDays),
      cost: String(plan.cost),
      downloadSpeedMbps: String(plan.downloadSpeedMbps),
      uploadSpeedMbps: String(plan.uploadSpeedMbps),
      dataCapacityGb: plan.dataCapacityGb ? String(plan.dataCapacityGb) : "",
      isActive: plan.isActive,
    });
    setIsEditPlanOpen(true);
  };

  const handleCreateInvoice = async () => {
    if (isSavingInvoice) return;
    const amount = Number(invoiceForm.amount);
    if (
      invoiceForm.clientId === "none" ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !invoiceForm.issueDate ||
      !invoiceForm.dueDate
    ) {
      toast({
        title: "Client, amount, issue date, and due date are required",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsSavingInvoice(true);
      const issueDateIso = new Date(invoiceForm.issueDate).toISOString();
      const dueDateIso = new Date(invoiceForm.dueDate).toISOString();
      await createInvoiceMutation.mutateAsync({
        clientId: invoiceForm.clientId,
        amount,
        issueDate: issueDateIso,
        dueDate: dueDateIso,
        notes: invoiceForm.notes || undefined,
      });
      toast({ title: "Invoice created" });
      setIsInvoiceOpen(false);
    } catch {
      toast({ title: "Failed to create invoice", variant: "destructive" });
    } finally {
      setIsSavingInvoice(false);
    }
  };

  const handleCreatePayment = async () => {
    if (isSavingPayment) return;
    if (paymentForm.invoiceId === "none") {
      toast({ title: "Select an invoice", variant: "destructive" });
      return;
    }
    const amountPaid = Number(paymentForm.amountPaid);
    if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
      toast({ title: "Amount paid must be positive", variant: "destructive" });
      return;
    }
    try {
      setIsSavingPayment(true);
      await createPaymentMutation.mutateAsync({
        invoiceId: paymentForm.invoiceId,
        amountPaid,
        paymentMethod: paymentForm.paymentMethod,
        paymentReference: paymentForm.paymentReference || undefined,
        notes: paymentForm.notes || undefined,
      });
      toast({ title: "Payment recorded" });
      setIsPaymentOpen(false);
    } catch {
      toast({ title: "Failed to record payment", variant: "destructive" });
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleSavePlan = async (isEdit: boolean) => {
    if (isSavingPlan) return;
    const durationDays = Number(planForm.durationDays);
    const cost = Number(planForm.cost);
    const download = Number(planForm.downloadSpeedMbps);
    const upload = Number(planForm.uploadSpeedMbps);
    const dataGb = planForm.dataCapacityGb
      ? Number(planForm.dataCapacityGb)
      : undefined;
    if (
      !planForm.planName ||
      !Number.isFinite(durationDays) ||
      !Number.isFinite(cost) ||
      !Number.isFinite(download) ||
      !Number.isFinite(upload)
    ) {
      toast({
        title: "Please fill required fields",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsSavingPlan(true);
      if (isEdit && selectedPlan) {
        await updatePlanMutation.mutateAsync({
          id: selectedPlan.id,
          data: {
            planName: planForm.planName,
            description: planForm.description || undefined,
            cost,
            downloadSpeedMbps: download,
            uploadSpeedMbps: upload,
            dataCapacityGb: dataGb,
            isActive: planForm.isActive,
          },
        });
        if (planForm.isActive !== selectedPlan.isActive) {
          if (planForm.isActive) {
            await activatePlanMutation.mutateAsync(selectedPlan.id);
          } else {
            await deactivatePlanMutation.mutateAsync(selectedPlan.id);
          }
        }
        toast({ title: "Plan updated" });
        setIsEditPlanOpen(false);
      } else {
        await createPlanMutation.mutateAsync({
          planName: planForm.planName,
          description: planForm.description || undefined,
          serviceType: planForm.serviceType,
          durationType: planForm.durationType,
          durationDays,
          cost,
          downloadSpeedMbps: download,
          uploadSpeedMbps: upload,
          dataCapacityGb: dataGb,
        });
        toast({ title: "Plan created" });
        setIsPlanOpen(false);
      }
    } catch {
      toast({ title: "Failed to save plan", variant: "destructive" });
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleTogglePlan = async (plan: ServicePlan) => {
    try {
      if (plan.isActive) {
        await deactivatePlanMutation.mutateAsync(plan.id);
        toast({ title: "Plan deactivated" });
      } else {
        await activatePlanMutation.mutateAsync(plan.id);
        toast({ title: "Plan activated" });
      }
    } catch {
      toast({ title: "Failed to update plan", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <style>{`
        .glass-morphism {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
      <PageHeader
        title="Billing & Plans"
        description="Manage service plans, invoices, and payments"
        actions={
          <div className="flex gap-2">
            <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
              <DialogTrigger asChild>
                <Button onClick={openInvoice}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[95vw] sm:max-w-xl max-h-[90vh] p-0 overflow-hidden border-2 border-primary/20">
                <AnimatedBackground />
                <div className="relative glass-morphism p-6 border-b border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Create Invoice</DialogTitle>
                  </DialogHeader>
                </div>
                <div className="relative p-6 space-y-4 max-h-[calc(90vh-6rem)] overflow-y-auto">
                  <div className="space-y-2">
                    <Label>Client</Label>
                    <Select
                      value={invoiceForm.clientId}
                      onValueChange={(v) =>
                        setInvoiceForm({ ...invoiceForm, clientId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      value={invoiceForm.amount}
                      onChange={(e) =>
                        setInvoiceForm({
                          ...invoiceForm,
                          amount: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Issue Date</Label>
                    <Input
                      type="date"
                      value={invoiceForm.issueDate}
                      onChange={(e) =>
                        setInvoiceForm({
                          ...invoiceForm,
                          issueDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={invoiceForm.dueDate}
                      onChange={(e) =>
                        setInvoiceForm({
                          ...invoiceForm,
                          dueDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Input
                      value={invoiceForm.notes}
                      onChange={(e) =>
                        setInvoiceForm({
                          ...invoiceForm,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleCreateInvoice}
                    disabled={isSavingInvoice}
                  >
                    {isSavingInvoice ? "Creating..." : "Create Invoice"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={openPayment}>
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[95vw] sm:max-w-xl max-h-[90vh] p-0 overflow-hidden border-2 border-primary/20">
                <AnimatedBackground />
                <div className="relative glass-morphism p-6 border-b border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-xl">
                      Record Payment
                    </DialogTitle>
                  </DialogHeader>
                </div>
                <div className="relative p-6 space-y-4 max-h-[calc(90vh-6rem)] overflow-y-auto">
                  <div className="space-y-2">
                    <Label>Invoice</Label>
                    <Select
                      value={paymentForm.invoiceId}
                      onValueChange={(v) =>
                        setPaymentForm({ ...paymentForm, invoiceId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select invoice" />
                      </SelectTrigger>
                      <SelectContent>
                        {invoices
                          .filter(
      (i) => !isInvoicePaid(i),
                          )
                          .map((inv) => (
                            <SelectItem key={inv.id} value={inv.id}>
                              {inv.invoiceNumber} - $
                              {Number(inv.amount).toFixed(2)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount Paid</Label>
                    <Input
                      type="number"
                      min="0"
                      value={paymentForm.amountPaid}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          amountPaid: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select
                      value={paymentForm.paymentMethod}
                      onValueChange={(v) =>
                        setPaymentForm({
                          ...paymentForm,
                          paymentMethod: v as PaymentMethod,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="BANK_TRANSFER">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="CARD">Card</SelectItem>
                        <SelectItem value="ONLINE">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reference (optional)</Label>
                    <Input
                      value={paymentForm.paymentReference}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          paymentReference: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Input
                      value={paymentForm.notes}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleCreatePayment}
                    disabled={isSavingPayment}
                  >
                    {isSavingPayment ? "Saving..." : "Record Payment"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isPlanOpen} onOpenChange={setIsPlanOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={openCreatePlan}>
                  Add Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[95vw] sm:max-w-xl max-h-[90vh] p-0 overflow-hidden border-2 border-primary/20">
                <AnimatedBackground />
                <div className="relative glass-morphism p-6 border-b border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Create Plan</DialogTitle>
                  </DialogHeader>
                </div>
                <div className="relative p-6 space-y-4 max-h-[calc(90vh-6rem)] overflow-y-auto">
                  <div className="space-y-2">
                    <Label>Plan Name</Label>
                    <Input
                      value={planForm.planName}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, planName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={planForm.description}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Service Type</Label>
                    <Select
                      value={planForm.serviceType}
                      onValueChange={(v) =>
                        setPlanForm({
                          ...planForm,
                          serviceType: v as ServiceType,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PREPAID">Prepaid</SelectItem>
                        <SelectItem value="POSTPAID">Postpaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration Type</Label>
                    <Select
                      value={planForm.durationType}
                      onValueChange={(v) =>
                        setPlanForm({
                          ...planForm,
                          durationType: v as DurationType,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HALF_MONTHLY">
                          Half Monthly
                        </SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                        <SelectItem value="HALF_ANNUAL">Half Annual</SelectItem>
                        <SelectItem value="ANNUAL">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration Days</Label>
                    <Input
                      type="number"
                      min="1"
                      value={planForm.durationDays}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          durationDays: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost</Label>
                    <Input
                      type="number"
                      min="0"
                      value={planForm.cost}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, cost: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Download Speed (Mbps)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={planForm.downloadSpeedMbps}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          downloadSpeedMbps: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Upload Speed (Mbps)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={planForm.uploadSpeedMbps}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          uploadSpeedMbps: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Capacity (GB)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={planForm.dataCapacityGb}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          dataCapacityGb: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleSavePlan(false)}
                    disabled={isSavingPlan}
                  >
                    {isSavingPlan ? "Saving..." : "Create Plan"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Monthly Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          title="Unpaid Amount"
          value={`$${unpaidAmount.toLocaleString()}`}
          icon={FileText}
          variant="warning"
        />
        <StatCard
          title="Total Invoices"
          value={invoices.length}
          icon={CreditCard}
        />
        <StatCard
          title="Active Plans"
          value={plans.filter((p) => p.isActive).length}
          icon={Package}
          variant="accent"
        />
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
              <Card
                key={plan.id}
                className={!plan.isActive ? "opacity-60" : ""}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.planName}</CardTitle>
                    {!plan.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold">
                      ${Number(plan.cost).toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">
                      /{plan.durationType.toLowerCase().replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-4 text-accent">
                    <Wifi className="w-4 h-4" />
                    <span className="font-medium">
                      {plan.downloadSpeedMbps} Mbps / {plan.uploadSpeedMbps}{" "}
                      Mbps
                    </span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      {plan.downloadSpeedMbps} Mbps Download
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      {plan.uploadSpeedMbps} Mbps Upload
                    </li>
                    {plan.dataCapacityGb && (
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        {plan.dataCapacityGb} GB Data
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      {plan.serviceType === "POSTPAID" ? "Postpaid" : "Prepaid"}
                    </li>
                  </ul>
                  <div className="grid gap-2 mt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => openEditPlan(plan)}
                    >
                      Edit Plan
                    </Button>
                    <Button
                      variant={plan.isActive ? "destructive" : "secondary"}
                      className="w-full"
                      onClick={() => handleTogglePlan(plan)}
                      disabled={
                        activatePlanMutation.isPending ||
                        deactivatePlanMutation.isPending
                      }
                    >
                      {plan.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardContent className="pt-6">
              <DataTable
                columns={invoiceColumns}
                data={invoices}
                isLoading={isLoading}
                emptyMessage="No invoices"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="pt-6">
              <DataTable
                columns={paymentColumns}
                data={payments}
                isLoading={isLoading}
                emptyMessage="No payments"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditPlanOpen} onOpenChange={setIsEditPlanOpen}>
        <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[95vw] sm:max-w-xl max-h-[90vh] p-0 overflow-hidden border-2 border-primary/20">
          <AnimatedBackground />
          <div className="relative glass-morphism p-6 border-b border-white/10">
            <DialogHeader>
              <DialogTitle className="text-xl">Edit Plan</DialogTitle>
            </DialogHeader>
          </div>
          <div className="relative p-6 space-y-4 max-h-[calc(90vh-6rem)] overflow-y-auto">
            <div className="space-y-2">
              <Label>Plan Name</Label>
              <Input
                value={planForm.planName}
                onChange={(e) =>
                  setPlanForm({ ...planForm, planName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={planForm.description}
                onChange={(e) =>
                  setPlanForm({ ...planForm, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Cost</Label>
              <Input
                type="number"
                min="0"
                value={planForm.cost}
                onChange={(e) =>
                  setPlanForm({ ...planForm, cost: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Download Speed (Mbps)</Label>
              <Input
                type="number"
                min="0"
                value={planForm.downloadSpeedMbps}
                onChange={(e) =>
                  setPlanForm({
                    ...planForm,
                    downloadSpeedMbps: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Upload Speed (Mbps)</Label>
              <Input
                type="number"
                min="0"
                value={planForm.uploadSpeedMbps}
                onChange={(e) =>
                  setPlanForm({
                    ...planForm,
                    uploadSpeedMbps: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Data Capacity (GB)</Label>
              <Input
                type="number"
                min="0"
                value={planForm.dataCapacityGb}
                onChange={(e) =>
                  setPlanForm({
                    ...planForm,
                    dataCapacityGb: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={planForm.isActive ? "active" : "inactive"}
                onValueChange={(v) =>
                  setPlanForm({ ...planForm, isActive: v === "active" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => handleSavePlan(true)}
              disabled={isSavingPlan}
            >
              {isSavingPlan ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
