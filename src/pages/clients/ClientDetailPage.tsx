import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  getInvoiceStatus,
  isInvoicePaid,
  getInvoiceTotalPaid,
} from "@/utils/invoiceStatus";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useToast } from "@/hooks/use-toast";
import { isValidPhone10, normalizePhone10 } from "@/utils/phone";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  Edit,
  Ban,
  CheckCircle,
  Key,
  Mail,
  Phone,
  MapPin,
  Globe,
  User,
} from "lucide-react";
import {
  useClient,
  useSuspendClient,
  useActivateClient,
  useUpdateClient,
  useUpdateConnectionType,
} from "@/hooks/useclients";
import { useInvoices } from "@/hooks/useInvoices";

import {
  ConnectionType,
  ServiceType,
  PaymentMethod,
  StaticIPStatus,
  SuspensionReason,
} from "@/types/api.types";
import type { Invoice, SuspensionHistory } from "@/types/api.types";
import { useSuspensionHistory } from "@/hooks/suspensionHistory";
import {
  useSubscriptions,
  useCreateSubscription,
  useUpgradeSubscription,
} from "@/hooks/useSubscription";
import { useStaticIPs } from "@/hooks/useStaticIp";
import { useCreateInvoice } from "@/hooks/useInvoices";
import { useCreatePayment } from "@/hooks/usepayments";
import { useServicePlans } from "@/hooks/useServicePlan";

export function ClientDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: client, isLoading: clientLoading } = useClient(id || "");
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices({
    clientId: id,
  });
  const { data: subscriptions = [], isLoading: subscriptionsLoading } =
    useSubscriptions({ clientId: id });
  const { data: suspensionHistory = [] } = useSuspensionHistory({
    clientId: id,
  });
  const { data: staticIPs = [] } = useStaticIPs({
    posId: client?.posId,
    status: StaticIPStatus.AVAILABLE,
  });

  const suspendMutation = useSuspendClient();
  const activateMutation = useActivateClient();
  const updateClientMutation = useUpdateClient();
  const updateConnectionMutation = useUpdateConnectionType();
  const createInvoiceMutation = useCreateInvoice();
  const createPaymentMutation = useCreatePayment();
  const createSubscriptionMutation = useCreateSubscription();
  const upgradeSubscriptionMutation = useUpgradeSubscription();
  const { data: servicePlans = [] } = useServicePlans({
    isActive: true,
    // serviceType: ServiceType.PREPAID,
  });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    connectionType: ConnectionType.DYNAMIC as ConnectionType,
    staticIpId: "",
    pppoeUsername: "",
    pppoePassword: "",
  });
  const [invoiceForm, setInvoiceForm] = useState({
    amount: "",
    issueDate: "",
    dueDate: "",
    subscriptionId: "none",
    notes: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    invoiceId: "none",
    amountPaid: "",
    paymentMethod: PaymentMethod.CASH as PaymentMethod,
    paymentReference: "",
    notes: "",
  });
  const [upgradeForm, setUpgradeForm] = useState({
    planId: "none",
    effectiveDate: "",
  });
  const [subscribeForm, setSubscribeForm] = useState({
    planId: "none",
    startDate: "",
    autoRenew: true,
  });

  const isLoading = clientLoading || invoicesLoading || subscriptionsLoading;

  const handleSuspend = async () => {
    if (!client) return;
    try {
      await suspendMutation.mutateAsync({
        id: client.id,
        data: {
          reason: SuspensionReason.NON_PAYMENT,
          reasonDetails: "Manual suspension from client detail page",
        },
      });
      toast({ title: t("Client suspended") });
    } catch {
      toast({ title: t("Failed to suspend client"), variant: "destructive" });
    }
  };

  const handleReactivate = async () => {
    if (!client) return;
    try {
      await activateMutation.mutateAsync(client.id);
      toast({ title: t("Client reactivated") });
    } catch {
      toast({
        title: t("Failed to reactivate client"),
        variant: "destructive",
      });
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
    return <div>{t("Client not found")}</div>;
  }

  const availableStaticIPs = client.staticIp
    ? [
        ...staticIPs,
        {
          id: client.staticIp.id,
          ipAddress: client.staticIp.ipAddress,
          status: StaticIPStatus.ASSIGNED,
        },
      ].filter(
        (ip, index, arr) => arr.findIndex((x) => x.id === ip.id) === index,
      )
    : staticIPs;

  const activeSubscription = subscriptions.find((s) => s.status === "ACTIVE");
  const isArabic = (i18n.resolvedLanguage || i18n.language).startsWith("ar");
  const dialogDir = isArabic ? "rtl" : "ltr";
  const translateApiText = (value?: string | null) =>
    value ? t(value, { defaultValue: value }) : value;
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;
  const statusLabelMap: Record<string, string> = {
    ACTIVE: t("Active"),
    INACTIVE: t("Inactive"),
    SUSPENDED: t("Suspended"),
    TERMINATED: t("Terminated"),
    PENDING: t("Pending"),
  };
  const getConnectionTypeLabel = (connectionType: ConnectionType) => {
    if (connectionType === ConnectionType.DYNAMIC) return t("Dynamic IP");
    if (connectionType === ConnectionType.STATIC) return t("Static IP");
    if (connectionType === ConnectionType.PPPOE) return t("PPPoE");
    return connectionType;
  };
  const balance = invoices.reduce((sum, inv) => {
    const amount = Number(inv.amount) || 0;
    const paid = getInvoiceTotalPaid(inv);
    return sum + (amount - paid);
  }, 0);

  const invoiceColumns = [
    { key: "invoiceNumber", header: t("Invoice #") },
    {
      key: "amount",
      header: t("Amount"),
      render: (i: Invoice) => `$${Number(i.amount).toFixed(2)}`,
    },
    {
      key: "dueDate",
      header: t("Due Date"),
      render: (i: Invoice) => new Date(i.dueDate).toLocaleDateString(),
    },
    {
      key: "status",
      header: t("Status"),
      render: (i: Invoice) => (
        <StatusBadge status={getInvoiceStatus(i).toLowerCase()} />
      ),
    },
    {
      key: "actions",
      header: t("Actions"),
      render: (i: Invoice) => (
        <Button
          size="sm"
          variant="outline"
          disabled={isInvoicePaid(i) || isCreatingPayment}
          onClick={() => handleQuickPay(i)}
        >
          {t("Pay")}
        </Button>
      ),
    },
  ];

  const suspensionColumns = [
    {
      key: "suspendedAt",
      header: t("Suspended At"),
      render: (h: SuspensionHistory) =>
        new Date(h.suspendedAt).toLocaleString(),
    },
    {
      key: "reason",
      header: t("Reason"),
      render: (h: SuspensionHistory) => h.suspensionReason.replace("_", " "),
    },
    { key: "reasonDetails", header: t("Details") },
    {
      key: "reactivatedAt",
      header: t("Reactivated At"),
      render: (h: SuspensionHistory) =>
        h.reactivatedAt
          ? new Date(h.reactivatedAt).toLocaleString()
          : t("Still suspended"),
    },
  ];

  const openEdit = () => {
    setEditForm({
      fullName: client.fullName || "",
      email: client.email || "",
      phone: normalizePhone10(client.phone || ""),
      address: client.address || "",
      connectionType: client.connectionType,
      staticIpId: client.staticIp?.id || "",
      pppoeUsername: client.pppoeUsername || "",
      pppoePassword: "",
    });
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!id) return;
    if (isSaving) return;

    if (
      editForm.connectionType === ConnectionType.STATIC &&
      !editForm.staticIpId
    ) {
      toast({
        title: t("Static IP is required for STATIC connection type"),
        variant: "destructive",
      });
      return;
    }
    if (
      editForm.connectionType === ConnectionType.PPPOE &&
      (!editForm.pppoeUsername.trim() || !editForm.pppoePassword.trim())
    ) {
      toast({
        title: t("PPPoE username and password are required"),
        variant: "destructive",
      });
      return;
    }
    if (!isValidPhone10(editForm.phone)) {
      toast({
        title: t("Phone number must be 10 digits"),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      await updateClientMutation.mutateAsync({
        id,
        data: {
          fullName: editForm.fullName,
          email: editForm.email,
          phone: editForm.phone,
          address: editForm.address,
        },
      });

      if (
        editForm.connectionType !== client.connectionType ||
        editForm.staticIpId !== (client.staticIp?.id || "") ||
        editForm.pppoeUsername !== (client.pppoeUsername || "") ||
        editForm.pppoePassword !== ""
      ) {
        await updateConnectionMutation.mutateAsync({
          id,
          data: {
            connectionType: editForm.connectionType,
            staticIpId:
              editForm.connectionType === ConnectionType.STATIC
                ? editForm.staticIpId || undefined
                : undefined,
            pppoeUsername:
              editForm.connectionType === ConnectionType.PPPOE
                ? editForm.pppoeUsername || undefined
                : undefined,
            pppoePassword:
              editForm.connectionType === ConnectionType.PPPOE
                ? editForm.pppoePassword || undefined
                : undefined,
          },
        });
      }

      toast({ title: t("Client updated") });
      setIsEditOpen(false);
    } catch {
      toast({ title: t("Failed to update client"), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const openInvoice = () => {
    setInvoiceForm({
      amount: "",
      issueDate: "",
      dueDate: "",
      subscriptionId: "none",
      notes: "",
    });
    setIsInvoiceOpen(true);
  };

  const openPayment = () => {
    const unpaidInvoices = invoices.filter((inv) => !isInvoicePaid(inv));
    const firstInvoice = unpaidInvoices[0];
    const remaining = firstInvoice ? getRemainingAmount(firstInvoice) : 0;
    setPaymentForm({
      invoiceId: firstInvoice ? firstInvoice.id : "none",
      amountPaid: remaining.toString(),
      paymentMethod: PaymentMethod.CASH,
      paymentReference: "",
      notes: "",
    });
    setIsPaymentOpen(true);
  };

  const handleCreateInvoice = async () => {
    if (!id) return;
    if (isCreatingInvoice) return;
    const amount = Number(invoiceForm.amount);
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !invoiceForm.dueDate ||
      !invoiceForm.issueDate
    ) {
      toast({
        title: t("Amount, issue date, and due date are required"),
        variant: "destructive",
      });
      return;
    }
    try {
      setIsCreatingInvoice(true);
      await createInvoiceMutation.mutateAsync({
        clientId: id,
        amount,
        issueDate: invoiceForm.issueDate,
        dueDate: invoiceForm.dueDate,
        notes: invoiceForm.notes || undefined,
        subscriptionId:
          invoiceForm.subscriptionId !== "none"
            ? invoiceForm.subscriptionId
            : undefined,
      });
      toast({ title: t("Invoice created") });
      setIsInvoiceOpen(false);
    } catch {
      toast({ title: t("Failed to create invoice"), variant: "destructive" });
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handleCreatePayment = async () => {
    if (isCreatingPayment) return;
    if (paymentForm.invoiceId === "none") {
      toast({
        title: t("Please select an invoice"),
        variant: "destructive",
      });
      return;
    }
    const amountPaid = Number(paymentForm.amountPaid);
    if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
      toast({
        title: t("Amount paid must be a positive number"),
        variant: "destructive",
      });
      return;
    }
    try {
      setIsCreatingPayment(true);
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
      setIsCreatingPayment(false);
    }
  };

  const getRemainingAmount = (invoice: Invoice) => {
    const amount = Number(invoice.amount || 0);
    const paid = getInvoiceTotalPaid(invoice);
    return Math.max(0, amount - paid);
  };

  const handleQuickPay = async (invoice: Invoice) => {
    if (isCreatingPayment) return;
    const remaining = getRemainingAmount(invoice);
    if (remaining <= 0) {
      toast({ title: t("Invoice is already paid") });
      return;
    }
    try {
      setIsCreatingPayment(true);
      await createPaymentMutation.mutateAsync({
        invoiceId: invoice.id,
        amountPaid: remaining,
        paymentMethod: PaymentMethod.CASH,
        paymentReference: "quick_pay",
        notes: "Quick pay from invoice list",
      });
      toast({ title: t("Payment recorded") });
    } catch {
      toast({ title: t("Failed to record payment"), variant: "destructive" });
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const openUpgrade = () => {
    setUpgradeForm({
      planId: "none",
      effectiveDate: "",
    });
    setIsUpgradeOpen(true);
  };

  const handleUpgrade = async () => {
    if (!activeSubscription) {
      toast({
        title: t("No active subscription to upgrade"),
        variant: "destructive",
      });
      return;
    }
    if (upgradeForm.planId === "none") {
      toast({
        title: t("Please select a plan"),
        variant: "destructive",
      });
      return;
    }
    if (isUpgrading) return;
    try {
      setIsUpgrading(true);
      await upgradeSubscriptionMutation.mutateAsync({
        id: activeSubscription.id,
        data: {
          newPlanId: upgradeForm.planId,
          effectiveDate: upgradeForm.effectiveDate || undefined,
        },
      });
      toast({ title: t("Plan upgraded") });
      setIsUpgradeOpen(false);
    } catch {
      toast({ title: t("Failed to upgrade plan"), variant: "destructive" });
    } finally {
      setIsUpgrading(false);
    }
  };

  const openSubscribe = () => {
    setSubscribeForm({
      planId: "none",
      startDate: "",
      autoRenew: true,
    });
    setIsSubscribeOpen(true);
  };

  const handleSubscribe = async () => {
    if (!id) return;
    if (subscribeForm.planId === "none") {
      toast({
        title: t("Please select a plan"),
        variant: "destructive",
      });
      return;
    }
    const selectedPlan = servicePlans.find(
      (p) => p.id === subscribeForm.planId,
    );
    if (isSubscribing) return;
    try {
      setIsSubscribing(true);
      await createSubscriptionMutation.mutateAsync({
        clientId: id,
        planId: subscribeForm.planId,
        startDate: subscribeForm.startDate || undefined,
        isAutoRenewed: subscribeForm.autoRenew,
      });
      toast({ title: t("Subscription created") });
      setIsSubscribeOpen(false);
    } catch {
      toast({
        title: t("Failed to create subscription"),
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`space-y-6 animate-fade-in ${isArabic ? "text-right" : "text-left"}`}
    >
      <PageHeader
        title={client.fullName}
        description={`${t("Status")}: ${statusLabelMap[client.status] || client.status}`}
        actions={
          <div
            className={`flex flex-wrap gap-2 ${isArabic ? "flex-row-reverse" : ""}`}
          >
            <Button variant="outline" onClick={() => navigate("/clients")}>
              <BackIcon className={`w-4 h-4 ${isArabic ? "ml-2" : "mr-2"}`} />
              {t("Back")}
            </Button>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={openEdit}>
                  <Edit className={`w-4 h-4 ${isArabic ? "ml-2" : "mr-2"}`} />
                  {t("Edit")}
                </Button>
              </DialogTrigger>
              <DialogContent
                dir={dialogDir}
                className="w-[calc(100%-2rem)] max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto"
              >
                <DialogHeader>
                  <DialogTitle>{t("Edit Client")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>{t("Full Name")}</Label>
                    <Input
                      value={editForm.fullName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, fullName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Email")}</Label>
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Phone")}</Label>
                    <Input
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          phone: normalizePhone10(e.target.value),
                        })
                      }
                      inputMode="numeric"
                      maxLength={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Address")}</Label>
                    <Input
                      value={editForm.address}
                      onChange={(e) =>
                        setEditForm({ ...editForm, address: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Connection Type")}</Label>
                    <Select
                      value={editForm.connectionType}
                      onValueChange={(v) =>
                        setEditForm({
                          ...editForm,
                          connectionType: v as ConnectionType,
                          staticIpId:
                            v === ConnectionType.STATIC
                              ? editForm.staticIpId
                              : "",
                          pppoeUsername:
                            v === ConnectionType.PPPOE
                              ? editForm.pppoeUsername
                              : "",
                          pppoePassword:
                            v === ConnectionType.PPPOE
                              ? editForm.pppoePassword
                              : "",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select POS")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DYNAMIC">
                          {t("Dynamic IP")}
                        </SelectItem>
                        <SelectItem value="STATIC">{t("Static IP")}</SelectItem>
                        <SelectItem value="PPPOE">{t("PPPoE")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editForm.connectionType === ConnectionType.STATIC && (
                    <div className="space-y-2">
                      <Label>{t("Static IP")}</Label>
                      <Select
                        value={editForm.staticIpId}
                        onValueChange={(v) =>
                          setEditForm({ ...editForm, staticIpId: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("Select Static IP")} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStaticIPs.length === 0 && (
                            <SelectItem value="none" disabled>
                              {t("No available static IPs")}
                            </SelectItem>
                          )}
                          {availableStaticIPs.map((ip) => (
                            <SelectItem key={ip.id} value={ip.id}>
                              {ip.ipAddress}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {editForm.connectionType === ConnectionType.PPPOE && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{t("PPPoE Username")}</Label>
                        <Input
                          value={editForm.pppoeUsername}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              pppoeUsername: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("PPPoE Password")}</Label>
                        <Input
                          type="password"
                          value={editForm.pppoePassword}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              pppoePassword: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                  <Button
                    className="w-full"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? `${t("Saving")}...` : t("Save Changes")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {client.status === "ACTIVE" ? (
              <Button variant="destructive" onClick={handleSuspend}>
                <Ban className={`w-4 h-4 ${isArabic ? "ml-2" : "mr-2"}`} />
                {t("Suspend")}
              </Button>
            ) : client.status === "SUSPENDED" ? (
              <Button variant="default" onClick={handleReactivate}>
                <CheckCircle
                  className={`w-4 h-4 ${isArabic ? "ml-2" : "mr-2"}`}
                />
                {t("Reactivate")}
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
              {t("Profile")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{client.email || t("No email")}</span>
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
              <p className="text-xs text-muted-foreground">
                {t("Connection Type")}
              </p>
              <p className="font-medium capitalize">
                {getConnectionTypeLabel(client.connectionType)}
              </p>
            </div>
            {client.staticIp && (
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("Static IP")}
                </p>
                <p className="font-medium font-mono">
                  {client.staticIp.ipAddress}
                </p>
              </div>
            )}
            {client.pppoeUsername && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("PPPoE Username")}
                  </p>
                  <p className="font-medium font-mono">
                    {client.pppoeUsername}
                  </p>
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
              {t("Subscription")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">
                {t("Current Plan")}
              </p>
              <p className="font-medium text-lg">
                {translateApiText(activeSubscription?.plan?.planName) ||
                  t("No active plan")}
              </p>
            </div>
            {activeSubscription && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("Plan Cost")}
                  </p>
                  <p className="font-medium text-lg">
                    ${Number(activeSubscription.plan?.cost || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("End Date")}
                  </p>
                  <p className="font-medium">
                    {new Date(activeSubscription.endDate).toLocaleDateString()}
                  </p>
                </div>
              </>
            )}
            <div>
              <p className="text-xs text-muted-foreground">{t("POS")}</p>
              <p className="font-medium">{client.pos?.name || t("N/A")}</p>
            </div>
            <div className="pt-4 border-t">
              {activeSubscription ? (
                <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={openUpgrade}
                    >
                      {t("Upgrade Plan")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    dir={dialogDir}
                    className="w-[calc(100%-2rem)] max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto"
                  >
                    <DialogHeader>
                      <DialogTitle>{t("Upgrade Plan")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label>{t("New Plan")}</Label>
                        <Select
                          value={upgradeForm.planId}
                          onValueChange={(v) =>
                            setUpgradeForm({ ...upgradeForm, planId: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("Select Plan")} />
                          </SelectTrigger>
                          <SelectContent>
                            {servicePlans.length === 0 && (
                              <SelectItem value="none" disabled>
                                {t("No active plans")}
                              </SelectItem>
                            )}
                            {servicePlans
                              .filter(
                                (p) => p.id !== activeSubscription?.planId,
                              )
                              .map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  {translateApiText(plan.planName)} - $
                                  {plan.cost}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("Effective Date (optional)")}</Label>
                        <Input
                          type="date"
                          value={upgradeForm.effectiveDate}
                          onChange={(e) =>
                            setUpgradeForm({
                              ...upgradeForm,
                              effectiveDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleUpgrade}
                        disabled={isUpgrading}
                      >
                        {isUpgrading ? t("Upgrading...") : t("Upgrade")}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Dialog
                  open={isSubscribeOpen}
                  onOpenChange={setIsSubscribeOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={openSubscribe}
                    >
                      {t("Add Subscription")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    dir={dialogDir}
                    className="w-[calc(100%-2rem)] max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto"
                  >
                    <DialogHeader>
                      <DialogTitle>{t("Add Subscription")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label>{t("Plan")}</Label>
                        <Select
                          value={subscribeForm.planId}
                          onValueChange={(v) =>
                            setSubscribeForm({ ...subscribeForm, planId: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("Select Plan")} />
                          </SelectTrigger>
                          <SelectContent>
                            {servicePlans.length === 0 && (
                              <SelectItem value="none" disabled>
                                {t("No active plans")}
                              </SelectItem>
                            )}
                            {servicePlans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {translateApiText(plan.planName)} - ${plan.cost}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("Start Date (optional)")}</Label>
                        <Input
                          type="date"
                          value={subscribeForm.startDate}
                          onChange={(e) =>
                            setSubscribeForm({
                              ...subscribeForm,
                              startDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleSubscribe}
                        disabled={isSubscribing}
                      >
                        {isSubscribing
                          ? t("Creating...")
                          : t("Create Subscription")}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Balance Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Account Balance")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`text-3xl font-bold ${balance < 0 ? "text-destructive" : "text-success"}`}
            >
              ${balance.toFixed(2)}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("Total Invoices")}
              </p>
              <p className="font-medium">{invoices.length}</p>
            </div>
            <div className="pt-4 border-t space-y-2">
              <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" onClick={openPayment}>
                    {t("Record Payment")}
                  </Button>
                </DialogTrigger>
                <DialogContent
                  dir={dialogDir}
                  className="w-[calc(100%-2rem)] max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto"
                >
                  <DialogHeader>
                    <DialogTitle>{t("Record Payment")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>{t("Invoice")}</Label>
                      <Select
                        value={paymentForm.invoiceId}
                        onValueChange={(v) => {
                          const inv = invoices.find((i) => i.id === v);
                          const remaining = inv ? getRemainingAmount(inv) : 0;
                          setPaymentForm({
                            ...paymentForm,
                            invoiceId: v,
                            amountPaid: remaining.toString(),
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("Select Invoice")} />
                        </SelectTrigger>
                        <SelectContent>
                          {invoices.filter((inv) => !isInvoicePaid(inv))
                            .length === 0 && (
                            <SelectItem value="none" disabled>
                              {t("No invoices available")}
                            </SelectItem>
                          )}
                          {invoices
                            .filter((inv) => !isInvoicePaid(inv))
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
                        value={paymentForm.amountPaid}
                        readOnly
                        className="bg-muted"
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
                          <SelectValue
                            placeholder={t("Select Payment Method")}
                          />
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
                      disabled={isCreatingPayment}
                    >
                      {isCreatingPayment
                        ? `${t("Saving")}...`
                        : t("Record Payment")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={openInvoice}
                  >
                    {t("Generate Invoice")}
                  </Button>
                </DialogTrigger>
                <DialogContent
                  dir={dialogDir}
                  className="w-[calc(100%-2rem)] max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto"
                >
                  <DialogHeader>
                    <DialogTitle>{t("Generate Invoice")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
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
                      <Label>{t("Subscription (optional)")}</Label>
                      <Select
                        value={invoiceForm.subscriptionId}
                        onValueChange={(v) =>
                          setInvoiceForm({ ...invoiceForm, subscriptionId: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("Select Subscription")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            {t("No Subscription")}
                          </SelectItem>
                          {subscriptions.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id}>
                              {sub.plan?.planName || sub.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      disabled={isCreatingInvoice}
                    >
                      {isCreatingInvoice
                        ? t("Creating...")
                        : t("Create Invoice")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">{t("Invoices")}</TabsTrigger>
          <TabsTrigger value="subscriptions">{t("Subscriptions")}</TabsTrigger>
          <TabsTrigger value="history">{t("Suspension History")}</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card>
            <CardContent className="pt-6">
              <DataTable
                columns={invoiceColumns}
                data={invoices}
                emptyMessage={t("No invoices")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">
                        {translateApiText(sub.plan?.planName)}
                      </h4>
                      <StatusBadge status={sub.status.toLowerCase()} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">
                          {t("Start Date")}
                        </p>
                        <p>{new Date(sub.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("End Date")}</p>
                        <p>{new Date(sub.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              <DataTable
                columns={suspensionColumns}
                data={suspensionHistory}
                emptyMessage={t("No suspension history")}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
