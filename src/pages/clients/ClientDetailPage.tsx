import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
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
import {
  ArrowLeft,
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
    serviceType: ServiceType.PREPAID,
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
      toast({ title: "Client suspended" });
    } catch {
      toast({ title: "Failed to suspend client", variant: "destructive" });
    }
  };

  const handleReactivate = async () => {
    if (!client) return;
    try {
      await activateMutation.mutateAsync(client.id);
      toast({ title: "Client reactivated" });
    } catch {
      toast({ title: "Failed to reactivate client", variant: "destructive" });
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
  const balance = invoices.reduce((sum, inv) => {
    const amount = Number(inv.amount) || 0;
    const paid = Number(inv.totalPaid) || 0;
    return sum + (amount - paid);
  }, 0);

  const invoiceColumns = [
    { key: "invoiceNumber", header: "Invoice #" },
    {
      key: "amount",
      header: "Amount",
      render: (i: Invoice) => `$${Number(i.amount).toFixed(2)}`,
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (i: Invoice) => new Date(i.dueDate).toLocaleDateString(),
    },
    {
      key: "status",
      header: "Status",
      render: (i: Invoice) => (
        <StatusBadge status={(i.calculatedStatus || "UNPAID").toLowerCase()} />
      ),
    },
  ];

  const suspensionColumns = [
    {
      key: "suspendedAt",
      header: "Suspended At",
      render: (h: SuspensionHistory) =>
        new Date(h.suspendedAt).toLocaleString(),
    },
    {
      key: "reason",
      header: "Reason",
      render: (h: SuspensionHistory) => h.suspensionReason.replace("_", " "),
    },
    { key: "reasonDetails", header: "Details" },
    {
      key: "reactivatedAt",
      header: "Reactivated At",
      render: (h: SuspensionHistory) =>
        h.reactivatedAt
          ? new Date(h.reactivatedAt).toLocaleString()
          : "Still suspended",
    },
  ];

  const openEdit = () => {
    setEditForm({
      fullName: client.fullName || "",
      email: client.email || "",
      phone: client.phone || "",
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
        title: "Static IP is required for STATIC connection type",
        variant: "destructive",
      });
      return;
    }
    if (
      editForm.connectionType === ConnectionType.PPPOE &&
      (!editForm.pppoeUsername.trim() || !editForm.pppoePassword.trim())
    ) {
      toast({
        title: "PPPoE username and password are required",
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

      toast({ title: "Client updated" });
      setIsEditOpen(false);
    } catch {
      toast({ title: "Failed to update client", variant: "destructive" });
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
    const unpaidInvoices = invoices.filter(
      (inv) => (inv.calculatedStatus || "UNPAID") !== "PAID",
    );
    const firstInvoice = unpaidInvoices[0];
    setPaymentForm({
      invoiceId: firstInvoice ? firstInvoice.id : "none",
      amountPaid: "",
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
        title: "Amount, issue date, and due date are required",
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
      toast({ title: "Invoice created" });
      setIsInvoiceOpen(false);
    } catch {
      toast({ title: "Failed to create invoice", variant: "destructive" });
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handleCreatePayment = async () => {
    if (isCreatingPayment) return;
    if (paymentForm.invoiceId === "none") {
      toast({
        title: "Please select an invoice",
        variant: "destructive",
      });
      return;
    }
    const amountPaid = Number(paymentForm.amountPaid);
    if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
      toast({
        title: "Amount paid must be a positive number",
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
      toast({ title: "Payment recorded" });
      setIsPaymentOpen(false);
    } catch {
      toast({ title: "Failed to record payment", variant: "destructive" });
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
        title: "No active subscription to upgrade",
        variant: "destructive",
      });
      return;
    }
    if (upgradeForm.planId === "none") {
      toast({
        title: "Please select a plan",
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
      toast({ title: "Plan upgraded" });
      setIsUpgradeOpen(false);
    } catch {
      toast({ title: "Failed to upgrade plan", variant: "destructive" });
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
        title: "Please select a plan",
        variant: "destructive",
      });
      return;
    }
    const selectedPlan = servicePlans.find((p) => p.id === subscribeForm.planId);
    if (selectedPlan && selectedPlan.serviceType !== ServiceType.PREPAID) {
      toast({
        title: "Only PREPAID plans are allowed",
        variant: "destructive",
      });
      return;
    }
    if (isSubscribing) return;
    try {
      setIsSubscribing(true);
      await createSubscriptionMutation.mutateAsync({
        clientId: id,
        planId: subscribeForm.planId,
        startDate: subscribeForm.startDate || undefined,
        isAutoRenewed: subscribeForm.autoRenew,
      });
      toast({ title: "Subscription created" });
      setIsSubscribeOpen(false);
    } catch {
      toast({ title: "Failed to create subscription", variant: "destructive" });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={client.fullName}
        description={`Status: ${client.status.charAt(0) + client.status.slice(1).toLowerCase()}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/clients")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={openEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100%-2rem)] max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Client</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={editForm.fullName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, fullName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={editForm.address}
                      onChange={(e) =>
                        setEditForm({ ...editForm, address: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Connection Type</Label>
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DYNAMIC">Dynamic IP</SelectItem>
                        <SelectItem value="STATIC">Static IP</SelectItem>
                        <SelectItem value="PPPOE">PPPoE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editForm.connectionType === ConnectionType.STATIC && (
                    <div className="space-y-2">
                      <Label>Static IP</Label>
                      <Select
                        value={editForm.staticIpId}
                        onValueChange={(v) =>
                          setEditForm({ ...editForm, staticIpId: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Static IP" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStaticIPs.length === 0 && (
                            <SelectItem value="none" disabled>
                              No available static IPs
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
                        <Label>PPPoE Username</Label>
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
                        <Label>PPPoE Password</Label>
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
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {client.status === "ACTIVE" ? (
              <Button variant="destructive" onClick={handleSuspend}>
                <Ban className="w-4 h-4 mr-2" />
                Suspend
              </Button>
            ) : client.status === "SUSPENDED" ? (
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
              <span>{client.email || "No email"}</span>
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
              <p className="font-medium capitalize">
                {client.connectionType.toLowerCase().replace("_", " ")}
              </p>
            </div>
            {client.staticIp && (
              <div>
                <p className="text-xs text-muted-foreground">Static IP</p>
                <p className="font-medium font-mono">
                  {client.staticIp.ipAddress}
                </p>
              </div>
            )}
            {client.pppoeUsername && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    PPPoE Username
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
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Current Plan</p>
              <p className="font-medium text-lg">
                {activeSubscription?.plan?.planName || "No active plan"}
              </p>
            </div>
            {activeSubscription && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Plan Cost</p>
                  <p className="font-medium text-lg">
                    ${Number(activeSubscription.plan?.cost || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="font-medium">
                    {new Date(activeSubscription.endDate).toLocaleDateString()}
                  </p>
                </div>
              </>
            )}
            <div>
              <p className="text-xs text-muted-foreground">POS</p>
              <p className="font-medium">{client.pos?.name || "N/A"}</p>
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
                      Upgrade Plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[calc(100%-2rem)] max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Upgrade Plan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label>New Plan</Label>
                        <Select
                          value={upgradeForm.planId}
                          onValueChange={(v) =>
                            setUpgradeForm({ ...upgradeForm, planId: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {servicePlans.length === 0 && (
                              <SelectItem value="none" disabled>
                                No active plans
                              </SelectItem>
                            )}
                            {servicePlans
                              .filter(
                                (p) => p.id !== activeSubscription?.planId,
                              )
                              .map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  {plan.planName} - ${plan.cost}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Effective Date (optional)</Label>
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
                        {isUpgrading ? "Upgrading..." : "Upgrade"}
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
                      Add Subscription
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[calc(100%-2rem)] max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Subscription</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label>Plan</Label>
                        <Select
                          value={subscribeForm.planId}
                          onValueChange={(v) =>
                            setSubscribeForm({ ...subscribeForm, planId: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {servicePlans.length === 0 && (
                              <SelectItem value="none" disabled>
                                No active plans
                              </SelectItem>
                            )}
                            {servicePlans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.planName} - ${plan.cost}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Start Date (optional)</Label>
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
                        {isSubscribing ? "Creating..." : "Create Subscription"}
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
            <CardTitle>Account Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`text-3xl font-bold ${balance < 0 ? "text-destructive" : "text-success"}`}
            >
              ${balance.toFixed(2)}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Invoices</p>
              <p className="font-medium">{invoices.length}</p>
            </div>
            <div className="pt-4 border-t space-y-2">
              <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" onClick={openPayment}>
                    Record Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[calc(100%-2rem)] max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>Invoice</Label>
                      <Select
                        value={paymentForm.invoiceId}
                        onValueChange={(v) =>
                          setPaymentForm({ ...paymentForm, invoiceId: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Invoice" />
                        </SelectTrigger>
                        <SelectContent>
                          {invoices.filter(
                            (inv) => (inv.calculatedStatus || "UNPAID") !== "PAID",
                          ).length === 0 && (
                            <SelectItem value="none" disabled>
                              No invoices available
                            </SelectItem>
                          )}
                          {invoices
                            .filter(
                              (inv) =>
                                (inv.calculatedStatus || "UNPAID") !== "PAID",
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
                      disabled={isCreatingPayment}
                    >
                      {isCreatingPayment ? "Saving..." : "Record Payment"}
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
                    Generate Invoice
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[calc(100%-2rem)] max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Generate Invoice</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
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
                      <Label>Subscription (optional)</Label>
                      <Select
                        value={invoiceForm.subscriptionId}
                        onValueChange={(v) =>
                          setInvoiceForm({ ...invoiceForm, subscriptionId: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Subscription" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Subscription</SelectItem>
                          {subscriptions.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id}>
                              {sub.plan?.planName || sub.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      disabled={isCreatingInvoice}
                    >
                      {isCreatingInvoice ? "Creating..." : "Create Invoice"}
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
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="history">Suspension History</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card>
            <CardContent className="pt-6">
              <DataTable
                columns={invoiceColumns}
                data={invoices}
                emptyMessage="No invoices"
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
                      <h4 className="font-semibold">{sub.plan?.planName}</h4>
                      <StatusBadge status={sub.status.toLowerCase()} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Start Date</p>
                        <p>{new Date(sub.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">End Date</p>
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
                emptyMessage="No suspension history"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
