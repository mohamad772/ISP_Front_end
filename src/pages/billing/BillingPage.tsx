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
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useStore } from "@/store/auth-store";
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
import { usePOS } from "@/hooks/usePos";

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
  const { t } = useTranslation();
  const { toast } = useToast();
  const user = useStore((state) => state.user);
  const hasPermission = useStore((state) => state.hasPermission);
  const isPosManager = user?.role === "POS_MANAGER";
  const canCreateInvoice = hasPermission("INVOICES_CREATE");
  const canCreatePayment = hasPermission("PAYMENTS_CREATE");
  const { data: plans = [], isLoading: plansLoading } = useServicePlans();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: payments = [], isLoading: paymentsLoading } = usePayments();
  const { data: clientsData } = useClients({ page: 1, limit: 1000 });
  const { data: posDetails } = usePOS(isPosManager ? user?.posId || "" : "");
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
  const translateApiText = (value?: string | null) =>
    value ? t(value, { defaultValue: value }) : value;
  const getPaymentMethodLabel = (method: PaymentMethod | string) => {
    if (method === PaymentMethod.CASH || method === "CASH") return t("Cash");
    if (method === PaymentMethod.BANK_TRANSFER || method === "BANK_TRANSFER") {
      return t("Bank Transfer");
    }
    if (method === PaymentMethod.CARD || method === "CARD") return t("Card");
    if (method === PaymentMethod.ONLINE || method === "ONLINE") {
      return t("Online");
    }
    return method;
  };

  const getDurationTypeLabel = (durationType: DurationType | string) => {
    if (durationType === DurationType.HALF_MONTHLY || durationType === "HALF_MONTHLY") {
      return t("Half Monthly");
    }
    if (durationType === DurationType.MONTHLY || durationType === "MONTHLY") {
      return t("Monthly");
    }
    if (durationType === DurationType.QUARTERLY || durationType === "QUARTERLY") {
      return t("Quarterly");
    }
    if (durationType === DurationType.HALF_ANNUAL || durationType === "HALF_ANNUAL") {
      return t("Half Annual");
    }
    if (durationType === DurationType.ANNUAL || durationType === "ANNUAL") {
      return t("Annual");
    }
    return durationType;
  };

  const revenueMetrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthRevenue = payments.reduce((sum, payment) => {
      const dateSource = payment.paymentDate || payment.createdAt;
      const paidAt = new Date(dateSource);
      if (Number.isNaN(paidAt.getTime())) return sum;

      if (
        paidAt.getMonth() === currentMonth &&
        paidAt.getFullYear() === currentYear
      ) {
        return (
          sum +
          Number(payment.amountPaid || 0) +
          Number(payment.extraAmount || 0)
        );
      }
      return sum;
    }, 0);

    const previousMonthRevenue = payments.reduce((sum, payment) => {
      const dateSource = payment.paymentDate || payment.createdAt;
      const paidAt = new Date(dateSource);
      if (Number.isNaN(paidAt.getTime())) return sum;

      if (
        paidAt.getMonth() === previousMonth &&
        paidAt.getFullYear() === previousMonthYear
      ) {
        return (
          sum +
          Number(payment.amountPaid || 0) +
          Number(payment.extraAmount || 0)
        );
      }
      return sum;
    }, 0);

    let trendPercent = 0;
    if (previousMonthRevenue > 0) {
      trendPercent =
        ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) *
        100;
    } else if (currentMonthRevenue > 0) {
      trendPercent = 100;
    }

    return {
      currentMonthRevenue,
      trendPercent: Number(trendPercent.toFixed(1)),
      trendIsPositive: trendPercent >= 0,
    };
  }, [payments]);

  const posAllocatedBandwidth = Number(posDetails?.allocatedBandwidthMbps ?? 0);
  const posUsedBandwidth = Number(
    (posDetails as { usedBandwidthMbps?: number; currentUsageMbps?: number })
      ?.usedBandwidthMbps ??
      (posDetails as { usedBandwidthMbps?: number; currentUsageMbps?: number })
        ?.currentUsageMbps ??
      0,
  );
  const posUtilization =
    posAllocatedBandwidth > 0
      ? Math.round((posUsedBandwidth / posAllocatedBandwidth) * 100)
      : 0;

  const unpaidAmount = invoices
    .filter((i) => !isInvoicePaid(i))
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const invoiceColumns = [
    { key: "invoiceNumber", header: t("Invoice #") },
    {
      key: "clientName",
      header: t("Client"),
      render: (i: Invoice) => i.client?.fullName || t("N/A"),
    },
    {
      key: "amount",
      header: t("Amount"),
      render: (i: Invoice) => `$${Number(i.amount || 0).toFixed(2)}`,
    },
    {
      key: "dueDate",
      header: t("Due Date"),
      render: (i: Invoice) =>
        i.dueDate ? new Date(i.dueDate).toLocaleDateString() : "-",
    },
    {
      key: "status",
      header: t("Status"),
      render: (i: Invoice) => (
        <StatusBadge status={getInvoiceStatus(i).toLowerCase()} />
      ),
    },
  ];

  const paymentColumns = [
    { key: "paymentReference", header: t("Reference") },
    {
      key: "clientName",
      header: t("Client"),
      render: (p: Payment) => p.invoice?.client?.fullName || t("N/A"),
    },
    {
      key: "amount",
      header: t("Amount"),
      render: (p: Payment) =>
        `$${(Number(p.amountPaid) + Number(p.extraAmount || 0)).toFixed(2)}`,
    },
    {
      key: "method",
      header: t("Method"),
      render: (p: Payment) => (
        <span className="capitalize">{getPaymentMethodLabel(p.paymentMethod || "CASH")}</span>
      ),
    },
    {
      key: "date",
      header: t("Date"),
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
        title: t("Client, amount, issue date, and due date are required"),
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
      toast({ title: t("Invoice created") });
      setIsInvoiceOpen(false);
    } catch {
      toast({ title: t("Failed to create invoice"), variant: "destructive" });
    } finally {
      setIsSavingInvoice(false);
    }
  };

  const handleCreatePayment = async () => {
    if (isSavingPayment) return;
    if (paymentForm.invoiceId === "none") {
      toast({ title: t("Select an invoice"), variant: "destructive" });
      return;
    }
    const amountPaid = Number(paymentForm.amountPaid);
    if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
      toast({ title: t("Amount paid must be positive"), variant: "destructive" });
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
      toast({ title: t("Payment recorded") });
      setIsPaymentOpen(false);
    } catch {
      toast({ title: t("Failed to record payment"), variant: "destructive" });
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
        title: t("Please fill required fields"),
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
        toast({ title: t("Plan updated") });
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
        toast({ title: t("Plan created") });
        setIsPlanOpen(false);
      }
    } catch {
      toast({ title: t("Failed to save plan"), variant: "destructive" });
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleTogglePlan = async (plan: ServicePlan) => {
    try {
      if (plan.isActive) {
        await deactivatePlanMutation.mutateAsync(plan.id);
        toast({ title: t("Plan deactivated") });
      } else {
        await activatePlanMutation.mutateAsync(plan.id);
        toast({ title: t("Plan activated") });
      }
    } catch {
      toast({ title: t("Failed to update plan"), variant: "destructive" });
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
        title={t("Billing & Plans")}
        description={t("Manage service plans, invoices, and payments")}
        actions={
          <div className="flex gap-2">
            <Dialog
              open={canCreateInvoice ? isInvoiceOpen : false}
              onOpenChange={(open) => {
                if (canCreateInvoice) setIsInvoiceOpen(open);
              }}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={canCreateInvoice ? openInvoice : undefined}
                  disabled={!canCreateInvoice}
                  className={!canCreateInvoice ? "blur-[1px] opacity-60" : ""}
                  title={!canCreateInvoice ? t("No permission for this action") : undefined}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("Create Invoice")}
                </Button>
              </DialogTrigger>
              {canCreateInvoice && (
              <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[95vw] sm:max-w-xl max-h-[90vh] p-0 overflow-hidden border-2 border-primary/20">
                <AnimatedBackground />
                <div className="relative glass-morphism p-6 border-b border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-xl">
                      {t("Create Invoice")}
                    </DialogTitle>
                  </DialogHeader>
                </div>
                <div className="relative p-6 space-y-4 max-h-[calc(90vh-6rem)] overflow-y-auto">
                  <div className="space-y-2">
                    <Label>{t("Client")}</Label>
                    <Select
                      value={invoiceForm.clientId}
                      onValueChange={(v) =>
                        setInvoiceForm({ ...invoiceForm, clientId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select client")} />
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
                    <Label>{t("Amount")}</Label>
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
                    <Label>{t("Issue Date")}</Label>
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
                    <Label>{t("Due Date")}</Label>
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
                    <Label>{t("Notes (optional)")}</Label>
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
                    {isSavingInvoice ? t("Creating...") : t("Create Invoice")}
                  </Button>
                </div>
              </DialogContent>
              )}
            </Dialog>
            <Dialog
              open={canCreatePayment ? isPaymentOpen : false}
              onOpenChange={(open) => {
                if (canCreatePayment) setIsPaymentOpen(open);
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  onClick={canCreatePayment ? openPayment : undefined}
                  disabled={!canCreatePayment}
                  className={!canCreatePayment ? "blur-[1px] opacity-60" : ""}
                  title={!canCreatePayment ? t("No permission for this action") : undefined}
                >
                  {t("Record Payment")}
                </Button>
              </DialogTrigger>
              {canCreatePayment && (
              <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[95vw] sm:max-w-xl max-h-[90vh] p-0 overflow-hidden border-2 border-primary/20">
                <AnimatedBackground />
                <div className="relative glass-morphism p-6 border-b border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-xl">
                      {t("Record Payment")}
                    </DialogTitle>
                  </DialogHeader>
                </div>
                <div className="relative p-6 space-y-4 max-h-[calc(90vh-6rem)] overflow-y-auto">
                  <div className="space-y-2">
                    <Label>{t("Invoice")}</Label>
                    <Select
                      value={paymentForm.invoiceId}
                      onValueChange={(v) =>
                        setPaymentForm({ ...paymentForm, invoiceId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select Invoice")} />
                      </SelectTrigger>
                      <SelectContent>
                        {invoices
                          .filter((i) => !isInvoicePaid(i))
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
                    <Label>{t("Amount Paid")}</Label>
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
                    <Label>{t("Payment Method")}</Label>
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
                        <SelectValue placeholder={t("Select Payment Method")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">{t("Cash")}</SelectItem>
                        <SelectItem value="BANK_TRANSFER">
                          {t("Bank Transfer")}
                        </SelectItem>
                        <SelectItem value="CARD">{t("Card")}</SelectItem>
                        <SelectItem value="ONLINE">{t("Online")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Reference (optional)")}</Label>
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
                    <Label>{t("Notes (optional)")}</Label>
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
                    {isSavingPayment ? t("Saving...") : t("Record Payment")}
                  </Button>
                </div>
              </DialogContent>
              )}
            </Dialog>
            <Dialog open={isPlanOpen} onOpenChange={setIsPlanOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={openCreatePlan}>
                  {t("Add Plan")}
                </Button>
              </DialogTrigger>
              <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[95vw] sm:max-w-xl max-h-[90vh] p-0 overflow-hidden border-2 border-primary/20">
                <AnimatedBackground />
                <div className="relative glass-morphism p-6 border-b border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-xl">
                      {t("Create Plan")}
                    </DialogTitle>
                  </DialogHeader>
                </div>
                <div className="relative p-6 space-y-4 max-h-[calc(90vh-6rem)] overflow-y-auto">
                  <div className="space-y-2">
                    <Label>{t("Plan Name")}</Label>
                    <Input
                      value={planForm.planName}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, planName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Description")}</Label>
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
                    <Label>{t("Service Type")}</Label>
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
                        <SelectValue placeholder={t("Select Service Type")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PREPAID">{t("Prepaid")}</SelectItem>
                        <SelectItem value="POSTPAID">
                          {t("Postpaid")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Duration Type")}</Label>
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
                        <SelectValue placeholder={t("Select Duration Type")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HALF_MONTHLY">
                          {t("Half Monthly")}
                        </SelectItem>
                        <SelectItem value="MONTHLY">{t("Monthly")}</SelectItem>
                        <SelectItem value="QUARTERLY">
                          {t("Quarterly")}
                        </SelectItem>
                        <SelectItem value="HALF_ANNUAL">
                          {t("Half Annual")}
                        </SelectItem>
                        <SelectItem value="ANNUAL">{t("Annual")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Duration Days")}</Label>
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
                    <Label>{t("Cost")}</Label>
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
                    <Label>{t("Download Speed (Mbps)")}</Label>
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
                    <Label>{t("Upload Speed (Mbps)")}</Label>
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
                    <Label>{t("Data Capacity (GB)")}</Label>
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
                    {isSavingPlan ? t("Saving...") : t("Create Plan")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        {isPosManager && (
          <StatCard
            title={t("Total Bandwidth")}
            value={`${posAllocatedBandwidth.toLocaleString()} Mbps`}
            subtitle={`${posUtilization}% utilized (${posUsedBandwidth.toLocaleString()} Mbps used)`}
            icon={Wifi}
            variant="accent"
          />
        )}
        <StatCard
          title={t("Monthly Revenue")}
          value={
            paymentsLoading
              ? t("Loading...")
              : `$${revenueMetrics.currentMonthRevenue.toLocaleString()}`
          }
          icon={DollarSign}
          variant="success"
          trend={{
            value: Math.abs(revenueMetrics.trendPercent),
            isPositive: revenueMetrics.trendIsPositive,
          }}
        />
        <StatCard
          title={t("Unpaid Amount")}
          value={`$${unpaidAmount.toLocaleString()}`}
          icon={FileText}
          variant="warning"
        />
        <StatCard
          title={t("Total Invoices")}
          value={invoices.length}
          icon={CreditCard}
        />
        <StatCard
          title={t("Active Plans")}
          value={plans.filter((p) => p.isActive).length}
          icon={Package}
          variant="accent"
        />
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">{t("Service Plans")}</TabsTrigger>
          <TabsTrigger value="invoices">{t("Invoices")}</TabsTrigger>
          <TabsTrigger value="payments">{t("Payments")}</TabsTrigger>
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
                    <CardTitle className="text-lg">
                      {translateApiText(plan.planName)}
                    </CardTitle>
                    {!plan.isActive && (
                      <Badge variant="secondary">{t("Inactive")}</Badge>
                    )}
                  </div>
                  <CardDescription>
                    {translateApiText(plan.description)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold">
                      ${Number(plan.cost).toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">
                      /{getDurationTypeLabel(plan.durationType)}
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
                      {plan.downloadSpeedMbps} {t("Mbps Download")}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      {plan.uploadSpeedMbps} {t("Mbps Upload")}
                    </li>
                    {plan.dataCapacityGb && (
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        {plan.dataCapacityGb} {t("GB Data")}
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      {plan.serviceType === "POSTPAID" ? t("Postpaid") : t("Prepaid")}
                    </li>
                  </ul>
                  <div className="grid gap-2 mt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => openEditPlan(plan)}
                    >
                      {t("Edit Plan")}
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
                      {plan.isActive ? t("Deactivate") : t("Activate")}
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
                emptyMessage={t("No invoices")}
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
                emptyMessage={t("No payments")}
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
              <DialogTitle className="text-xl">{t("Edit Plan")}</DialogTitle>
            </DialogHeader>
          </div>
          <div className="relative p-6 space-y-4 max-h-[calc(90vh-6rem)] overflow-y-auto">
            <div className="space-y-2">
              <Label>{t("Plan Name")}</Label>
              <Input
                value={planForm.planName}
                onChange={(e) =>
                  setPlanForm({ ...planForm, planName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Description")}</Label>
              <Input
                value={planForm.description}
                onChange={(e) =>
                  setPlanForm({ ...planForm, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Cost")}</Label>
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
              <Label>{t("Download Speed (Mbps)")}</Label>
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
              <Label>{t("Upload Speed (Mbps)")}</Label>
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
              <Label>{t("Data Capacity (GB)")}</Label>
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
              <Label>{t("Status")}</Label>
              <Select
                value={planForm.isActive ? "active" : "inactive"}
                onValueChange={(v) =>
                  setPlanForm({ ...planForm, isActive: v === "active" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select Status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("Active")}</SelectItem>
                  <SelectItem value="inactive">{t("Inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => handleSavePlan(true)}
              disabled={isSavingPlan}
            >
              {isSavingPlan ? t("Saving...") : t("Save Changes")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
