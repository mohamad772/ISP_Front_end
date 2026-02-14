import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useAuditLogs } from "@/hooks/useAuditLog";
import {
  usePPPoERequests,
  useApprovePPPoERequest,
  useRejectPPPoERequest,
  useCompletePPPoERequest,
  useCreatePPPoERequest,
} from "@/hooks/usepppoeRequests";
import {
  usePackageUpgradeRequests,
  useApprovePackageUpgradeRequest,
  useRejectPackageUpgradeRequest,
} from "@/hooks/usePackageUpgradeRequests";
import type { AuditLog, PPPoERequest } from "@/types/api.types";
import {
  PPPoERequestStatus,
  RequestStatus,
  PackageUpgradeRequest,
} from "@/types/api.types";
import { useClients } from "@/hooks/useclients";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Activity,
  FileText,
  Download,
  RefreshCcw,
  PackagePlus,
  Plus,
} from "lucide-react";

type RequestActionType = "approve" | "reject" | "complete";

export function LogsRequestsPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isArabic = (i18n.resolvedLanguage || i18n.language).startsWith("ar");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("logs");
  const [actionDialog, setActionDialog] = useState<
    | { kind: "pppoe"; type: RequestActionType; request: PPPoERequest }
    | {
        kind: "package";
        type: "approve" | "reject";
        request: PackageUpgradeRequest;
      }
    | null
  >(null);
  const [credentialsDialog, setCredentialsDialog] = useState<{
    request: PPPoERequest;
  } | null>(null);
  const [note, setNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [credentialsReason, setCredentialsReason] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    clientId: "",
    reason: "",
    newUsername: "",
    newPassword: "",
  });

  const { data: clientsPage } = useClients({ page: 1, limit: 100 });
  const clients = clientsPage?.data || [];
  const { data: auditLogs = [], isLoading: logsLoading } = useAuditLogs();
  const { data: pppoeRequests = [], isLoading: requestsLoading } =
    usePPPoERequests();
  const approveMutation = useApprovePPPoERequest();
  const rejectMutation = useRejectPPPoERequest();
  const completeMutation = useCompletePPPoERequest();
  const createRequestMutation = useCreatePPPoERequest();
  const { data: packageRequests = [], isLoading: packageRequestsLoading } =
    usePackageUpgradeRequests();
  const approvePackageMutation = useApprovePackageUpgradeRequest();
  const rejectPackageMutation = useRejectPackageUpgradeRequest();
  const translateDynamicText = (value?: string | null) =>
    value ? t(value, { defaultValue: value }) : value;

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return auditLogs;
    const term = search.toLowerCase();
    return auditLogs.filter((log) => {
      const values = [
        log.user?.username,
        log.userId,
        log.action,
        log.entityType,
        log.entityId,
        log.posId,
        log.ipAddress,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return values.includes(term);
    });
  }, [auditLogs, search]);

  const filteredRequests = useMemo(() => {
    if (statusFilter === "all") return pppoeRequests;
    return pppoeRequests.filter((r) => r.status === statusFilter);
  }, [pppoeRequests, statusFilter]);

  const filteredPackageRequests = useMemo(() => {
    if (statusFilter === "all") return packageRequests;
    return packageRequests.filter((r) => r.status === statusFilter);
  }, [packageRequests, statusFilter]);

  const requestStats = useMemo(() => {
    return {
      pending: pppoeRequests.filter(
        (r) => r.status === PPPoERequestStatus.PENDING,
      ).length,
      approved: pppoeRequests.filter(
        (r) => r.status === PPPoERequestStatus.APPROVED,
      ).length,
      rejected: pppoeRequests.filter(
        (r) => r.status === PPPoERequestStatus.REJECTED,
      ).length,
      completed: pppoeRequests.filter(
        (r) => r.status === PPPoERequestStatus.COMPLETED,
      ).length,
    };
  }, [pppoeRequests]);

  const packageStats = useMemo(() => {
    return {
      pending: packageRequests.filter((r) => r.status === RequestStatus.PENDING)
        .length,
      approved: packageRequests.filter(
        (r) => r.status === RequestStatus.APPROVED,
      ).length,
      rejected: packageRequests.filter(
        (r) => r.status === RequestStatus.REJECTED,
      ).length,
    };
  }, [packageRequests]);

  const auditColumns = [
    {
      key: "createdAt",
      header: t("Timestamp"),
      render: (log: AuditLog) => (
        <div className="flex items-center gap-2 min-w-[180px]">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Calendar className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {log.createdAt
                ? new Date(log.createdAt).toLocaleDateString()
                : "-"}
            </span>
            <span className="text-xs text-muted-foreground">
              {log.createdAt
                ? new Date(log.createdAt).toLocaleTimeString()
                : ""}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "user",
      header: t("User"),
      render: (log: AuditLog) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950">
            <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="font-medium text-sm">
            {log.user?.username || log.userId || t("N/A")}
          </span>
        </div>
      ),
    },
    {
      key: "action",
      header: t("Action"),
      render: (log: AuditLog) => (
        <Badge variant="outline" className="font-mono text-xs">
          {log.action}
        </Badge>
      ),
    },
    {
      key: "entityType",
      header: t("Entity"),
      render: (log: AuditLog) => (
        <Badge variant="secondary" className="text-xs">
          {log.entityType}
        </Badge>
      ),
    },
    {
      key: "details",
      header: t("Details"),
      render: (log: AuditLog) => {
        const rawDetails =
          typeof log.details === "string"
            ? translateDynamicText(log.details)
            : log.details &&
                typeof log.details === "object" &&
                "message" in (log.details as Record<string, unknown>) &&
                typeof (log.details as Record<string, unknown>).message ===
                  "string"
              ? {
                  ...(log.details as Record<string, unknown>),
                  message: translateDynamicText(
                    (log.details as Record<string, unknown>).message as string,
                  ),
                }
              : log.details;
        return (
          <div className="max-w-xs truncate text-xs text-muted-foreground font-mono">
            {rawDetails ? JSON.stringify(rawDetails) : "-"}
          </div>
        );
      },
    },
    {
      key: "ipAddress",
      header: t("IP Address"),
      render: (log: AuditLog) => (
        <span className="text-xs font-mono text-muted-foreground">
          {log.ipAddress || "-"}
        </span>
      ),
    },
  ];

  const requestColumns = [
    {
      key: "client",
      header: t("Client"),
      render: (req: PPPoERequest) => (
        <div className="flex items-center gap-3 min-w-[180px]">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {(req.client?.fullName || "U")[0].toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">
              {req.client?.fullName || t("Unknown")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("ID")}: {req.clientId || t("N/A")}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "reason",
      header: t("Reason"),
      render: (req: PPPoERequest) => (
        <div className="flex items-start gap-2 max-w-md">
          <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <span className="text-sm">
            {translateDynamicText(req.reason) || t("No reason provided")}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: t("Status"),
      render: (req: PPPoERequest) => (
        <div className="flex items-center gap-2">
          {req.status === PPPoERequestStatus.PENDING && (
            <Clock className="h-4 w-4 text-yellow-500" />
          )}
          {req.status === PPPoERequestStatus.APPROVED && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          {req.status === PPPoERequestStatus.REJECTED && (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          {req.status === PPPoERequestStatus.COMPLETED && (
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          )}
          <StatusBadge status={(req.status || "PENDING").toLowerCase()} />
        </div>
      ),
    },
    {
      key: "createdAt",
      header: t("Requested At"),
      render: (req: PPPoERequest) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "-"}
          </span>
          <span className="text-xs text-muted-foreground">
            {req.createdAt ? new Date(req.createdAt).toLocaleTimeString() : ""}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: t("Actions"),
      render: (req: PPPoERequest) => {
        if (req.status === PPPoERequestStatus.PENDING) {
          return (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setNewUsername(req.newUsername || "");
                  setNewPassword(req.newPassword || "");
                  setCredentialsReason(req.reason || "");
                  setCredentialsDialog({ request: req });
                }}
              >
                <User className="h-4 w-4" />
                {t("Edit Credentials")}
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  setNote("");
                  setRejectionReason("");
                  setActionDialog({
                    kind: "pppoe",
                    type: "approve",
                    request: req,
                  });
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                {t("Approve")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="gap-2"
                onClick={() => {
                  setNote("");
                  setRejectionReason("");
                  setActionDialog({
                    kind: "pppoe",
                    type: "reject",
                    request: req,
                  });
                }}
              >
                <XCircle className="h-4 w-4" />
                {t("Reject")}
              </Button>
            </div>
          );
        }
        if (req.status === PPPoERequestStatus.APPROVED) {
          return (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setNewUsername(req.newUsername || "");
                  setNewPassword(req.newPassword || "");
                  setCredentialsReason(req.reason || "");
                  setCredentialsDialog({ request: req });
                }}
              >
                <User className="h-4 w-4" />
                {t("Edit Credentials")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setNote("");
                  setRejectionReason("");
                  setActionDialog({
                    kind: "pppoe",
                    type: "complete",
                    request: req,
                  });
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                {t("Complete")}
              </Button>
            </div>
          );
        }
        return (
          <span className="text-muted-foreground text-sm">{t("N/A")}</span>
        );
      },
    },
  ];

  const packageRequestColumns = [
    {
      key: "client",
      header: t("Client"),
      render: (req: PackageUpgradeRequest) => (
        <div className="flex items-center gap-3 min-w-[180px]">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white font-semibold">
            {(req.requestedByUser?.username || "U")[0].toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">
              {req.requestedByUser?.username || t("Unknown")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("ID")}: {req.clientId || t("N/A")}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "plans",
      header: t("Plan Change"),
      render: (req: PackageUpgradeRequest) => (
        <div className="flex items-start gap-2 max-w-md">
          <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <span className="text-sm">
            {(req.currentPlan?.planName || t("Current plan")) +
              " -> " +
              (req.requestedPlan?.planName || t("Requested plan"))}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: t("Status"),
      render: (req: PackageUpgradeRequest) => (
        <div className="flex items-center gap-2">
          {req.status === RequestStatus.PENDING && (
            <Clock className="h-4 w-4 text-yellow-500" />
          )}
          {req.status === RequestStatus.APPROVED && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          {req.status === RequestStatus.REJECTED && (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <StatusBadge status={(req.status || "PENDING").toLowerCase()} />
        </div>
      ),
    },
    {
      key: "createdAt",
      header: t("Requested At"),
      render: (req: PackageUpgradeRequest) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {req.requestedAt
              ? new Date(req.requestedAt).toLocaleDateString()
              : "-"}
          </span>
          <span className="text-xs text-muted-foreground">
            {req.requestedAt
              ? new Date(req.requestedAt).toLocaleTimeString()
              : ""}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: t("Actions"),
      render: (req: PackageUpgradeRequest) => {
        if (req.status === RequestStatus.PENDING) {
          return (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  setNote("");
                  setRejectionReason("");
                  setActionDialog({
                    kind: "package",
                    type: "approve",
                    request: req,
                  });
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                {t("Approve")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="gap-2"
                onClick={() => {
                  setNote("");
                  setRejectionReason("");
                  setActionDialog({
                    kind: "package",
                    type: "reject",
                    request: req,
                  });
                }}
              >
                <XCircle className="h-4 w-4" />
                {t("Reject")}
              </Button>
            </div>
          );
        }
        return (
          <span className="text-muted-foreground text-sm">{t("N/A")}</span>
        );
      },
    },
  ];

  const handleConfirmAction = async () => {
    if (!actionDialog) return;
    try {
      if (actionDialog.kind === "pppoe") {
        const { type, request } = actionDialog;
        if (type === "approve") {
          await approveMutation.mutateAsync({
            id: request.id,
            data: note ? { note } : undefined,
          });
          toast({
            title: t("Request approved"),
            description: t("The PPPoE request has been approved successfully."),
          });
        } else if (type === "reject") {
          if (!rejectionReason.trim()) {
            toast({
              title: t("Rejection reason is required"),
              variant: "destructive",
            });
            return;
          }
          await rejectMutation.mutateAsync({
            id: request.id,
            data: {
              rejectionReason: rejectionReason.trim(),
              note: note || undefined,
            },
          });
          toast({
            title: t("Request rejected"),
            description: t("The PPPoE request has been rejected."),
          });
        } else if (type === "complete") {
          await completeMutation.mutateAsync({
            id: request.id,
            data: note ? { technicianNote: note } : undefined,
          });
          toast({
            title: t("Request completed"),
            description: t("The PPPoE request has been marked as completed."),
          });
        }
      } else if (actionDialog.kind === "package") {
        const { type, request } = actionDialog;
        if (type === "approve") {
          await approvePackageMutation.mutateAsync({
            id: request.id,
            data: note ? { note } : undefined,
          });
          toast({
            title: t("Request approved"),
            description: t("The package upgrade request has been approved."),
          });
        } else if (type === "reject") {
          if (!rejectionReason.trim()) {
            toast({
              title: t("Rejection reason is required"),
              variant: "destructive",
            });
            return;
          }
          await rejectPackageMutation.mutateAsync({
            id: request.id,
            data: {
              rejectionReason: rejectionReason.trim(),
              note: note || undefined,
            },
          });
          toast({
            title: t("Request rejected"),
            description: t("The package upgrade request has been rejected."),
          });
        }
      }
      setActionDialog(null);
    } catch {
      toast({ title: t("Action failed"), variant: "destructive" });
    }
  };

  const handleCreateRequest = async () => {
    try {
      if (!createForm.clientId) {
        toast({
          title: t("Client is required"),
          variant: "destructive",
        });
        return;
      }
      if (!createForm.reason.trim()) {
        toast({
          title: t("Reason is required"),
          variant: "destructive",
        });
        return;
      }

      await createRequestMutation.mutateAsync({
        clientId: createForm.clientId,
        reason: createForm.reason,
        newUsername: createForm.newUsername || undefined,
        newPassword: createForm.newPassword || undefined,
      });

      toast({
        title: t("Request created"),
        description: t("The PPPoE request has been created successfully."),
      });
      setIsCreateOpen(false);
      setCreateForm({
        clientId: "",
        reason: "",
        newUsername: "",
        newPassword: "",
      });
    } catch {
      toast({ title: t("Failed to create request"), variant: "destructive" });
    }
  };

  const handleUpdateCredentials = async () => {
    if (!credentialsDialog) return;
    const { request } = credentialsDialog;
    try {
      if (!newUsername.trim() && !newPassword.trim()) {
        toast({
          title: t("Username or password required"),
          variant: "destructive",
        });
        return;
      }
      if (!credentialsReason.trim()) {
        toast({
          title: t("Reason is required"),
          variant: "destructive",
        });
        return;
      }
      // Note: This mutation seems to be creating a NEW request rather than updating existing one based on the hook name and params
      // If the intent is to update, we might need a different mutation.
      // Assuming 'createRequestMutation' is used here as per original code, but it looks like it creates a new one.
      await createRequestMutation.mutateAsync({
        clientId: request.clientId,
        reason: credentialsReason.trim(),
        newUsername: newUsername.trim() || undefined,
        newPassword: newPassword.trim() || undefined,
      });
      toast({
        title: t("Request created"),
        description: t("A new PPPoE change request has been created."),
      });
      setCredentialsDialog(null);
    } catch {
      toast({ title: t("Create request failed"), variant: "destructive" });
    }
  };

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`space-y-6 animate-fade-in ${isArabic ? "text-right" : "text-left"}`}
    >
      {/* Enhanced Page Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          title={t("Logs & Requests")}
          description={t(
            "Comprehensive audit logging and PPPoE request management system",
          )}
        />
      </div>

      {/* Stats Cards - Only show on requests tab */}
      {activeTab === "requests" && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("Pending")}
                  </p>
                  <p className="text-2xl font-bold">{requestStats.pending}</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-950">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("Approved")}
                  </p>
                  <p className="text-2xl font-bold">{requestStats.approved}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-950">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("Rejected")}
                  </p>
                  <p className="text-2xl font-bold">{requestStats.rejected}</p>
                </div>
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-950">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("Completed")}
                  </p>
                  <p className="text-2xl font-bold">{requestStats.completed}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-950">
                  <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Tabs */}
      <Tabs
        defaultValue="logs"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div
          className={`${isArabic ? "flex justify-end" : "flex justify-start"}`}
        >
          <TabsList className="grid w-full max-w-md grid-cols-2 h-12">
            <TabsTrigger
              value="logs"
              className={`gap-2 ${isArabic ? "flex-row-reverse" : ""}`}
            >
              <Activity className="h-4 w-4" />
              {t("Audit Logs")}
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className={`gap-2 ${isArabic ? "flex-row-reverse" : ""}`}
            >
              <FileText className="h-4 w-4" />
              {t("PPPoE Requests")}
              {requestStats.pending > 0 && (
                <Badge
                  variant="destructive"
                  className={`${isArabic ? "mr-2" : "ml-2"} h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs`}
                >
                  {requestStats.pending}
                </Badge>
              )}
            </TabsTrigger>
            {/* <TabsTrigger
              value="packageRequests"
              className={`gap-2 ${isArabic ? "flex-row-reverse" : ""}`}
            >
              <PackagePlus className="h-4 w-4" />
              {t("Package Requests")}
              {packageStats.pending > 0 && (
                <Badge
                  variant="destructive"
                  className={`${isArabic ? "mr-2" : "ml-2"} h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs`}
                >
                  {packageStats.pending}
                </Badge>
              )}
            </TabsTrigger> */}
          </TabsList>
        </div>

        {/* Audit Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card className="shadow-lg border-2">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5" />
                {t("System Audit Logs")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Enhanced Search */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search
                    className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground ${
                      isArabic ? "right-3" : "left-3"
                    }`}
                  />
                  <Input
                    placeholder={t(
                      "Search by user, action, entity, IP address...",
                    )}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={
                      isArabic
                        ? "pr-10 text-right placeholder:text-right"
                        : "pl-10 text-left placeholder:text-left"
                    }
                  />
                </div>
              </div>

              {/* Table */}
              <div
                dir={isArabic ? "rtl" : "ltr"}
                className={`border rounded-lg overflow-hidden ${
                  isArabic ? "text-right" : "text-left"
                }`}
              >
                <DataTable
                  columns={auditColumns}
                  data={filteredLogs}
                  isLoading={logsLoading}
                  emptyMessage={t("No audit logs found")}
                />
              </div>

              {/* Results count */}
              <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
                <span>
                  {t("Showing {{shown}} of {{total}} logs", {
                    shown: filteredLogs.length,
                    total: auditLogs.length,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PPPoE Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card className="shadow-lg border-2">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                {t("PPPoE Connection Requests")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Enhanced Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Filter
                    className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground ${
                      isArabic ? "right-3" : "left-3"
                    }`}
                  />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger
                      className={
                        isArabic
                          ? "pr-10 justify-end text-right"
                          : "pl-10 justify-start text-left"
                      }
                    >
                      <SelectValue placeholder={t("Filter by status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-gray-400" />
                          {t("All Status")}
                        </div>
                      </SelectItem>
                      <SelectItem value={PPPoERequestStatus.PENDING}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-yellow-400" />
                          {t("Pending")}
                        </div>
                      </SelectItem>
                      <SelectItem value={PPPoERequestStatus.APPROVED}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-400" />
                          {t("Approved")}
                        </div>
                      </SelectItem>
                      <SelectItem value={PPPoERequestStatus.REJECTED}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-400" />
                          {t("Rejected")}
                        </div>
                      </SelectItem>
                      <SelectItem value={PPPoERequestStatus.COMPLETED}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-400" />
                          {t("Completed")}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t("New Request")}
                </Button>
              </div>

              {/* Table */}
              <div
                dir={isArabic ? "rtl" : "ltr"}
                className={`border rounded-lg overflow-hidden ${
                  isArabic ? "text-right" : "text-left"
                }`}
              >
                <DataTable
                  columns={requestColumns}
                  data={filteredRequests}
                  isLoading={requestsLoading}
                  emptyMessage={t("No PPPoE requests found")}
                />
              </div>

              {/* Results count */}
              <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
                <span>
                  {t("Showing {{shown}} of {{total}} requests", {
                    shown: filteredRequests.length,
                    total: pppoeRequests.length,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Package Upgrade Requests Tab */}
        <TabsContent value="packageRequests" className="space-y-4">
          <Card className="shadow-lg border-2">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-lg">
                <PackagePlus className="h-5 w-5" />
                {t("Package Upgrade Requests")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Enhanced Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Filter
                    className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground ${
                      isArabic ? "right-3" : "left-3"
                    }`}
                  />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger
                      className={
                        isArabic
                          ? "pr-10 justify-end text-right"
                          : "pl-10 justify-start text-left"
                      }
                    >
                      <SelectValue placeholder={t("Filter by status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-gray-400" />
                          {t("All Status")}
                        </div>
                      </SelectItem>
                      <SelectItem value={RequestStatus.PENDING}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-yellow-400" />
                          {t("Pending")}
                        </div>
                      </SelectItem>
                      <SelectItem value={RequestStatus.APPROVED}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-400" />
                          {t("Approved")}
                        </div>
                      </SelectItem>
                      <SelectItem value={RequestStatus.REJECTED}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-400" />
                          {t("Rejected")}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Table */}
              <div
                dir={isArabic ? "rtl" : "ltr"}
                className={`border rounded-lg overflow-hidden ${
                  isArabic ? "text-right" : "text-left"
                }`}
              >
                <DataTable
                  columns={packageRequestColumns}
                  data={filteredPackageRequests}
                  isLoading={packageRequestsLoading}
                  emptyMessage={t("No package requests found")}
                />
              </div>

              {/* Results count */}
              <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
                <span>
                  {t("Showing {{shown}} of {{total}} requests", {
                    shown: filteredPackageRequests.length,
                    total: packageRequests.length,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent dir={isArabic ? "rtl" : "ltr"} className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {actionDialog?.type === "approve" && (
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-950">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              )}
              {actionDialog?.type === "reject" && (
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-950">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              )}
              {actionDialog?.type === "complete" && (
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-950">
                  <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              <div>
                <DialogTitle>
                  {actionDialog?.type === "approve" && t("Approve Request")}
                  {actionDialog?.type === "reject" && t("Reject Request")}
                  {actionDialog?.type === "complete" && t("Complete Request")}
                </DialogTitle>
                <DialogDescription>
                  {actionDialog?.type === "approve" &&
                    (actionDialog?.kind === "package"
                      ? t("This will approve the package upgrade request.")
                      : t("This will approve the PPPoE connection request."))}
                  {actionDialog?.type === "reject" &&
                    t("Please provide a reason for rejecting this request.")}
                  {actionDialog?.type === "complete" &&
                    t("Mark this request as completed.")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Client Info */}
          {actionDialog?.request && (
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {actionDialog.kind === "pppoe"
                    ? actionDialog.request.client?.fullName ||
                      t("Unknown Client")
                    : actionDialog.request.requestedByUser?.username ||
                      t("Unknown Client")}
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  {translateDynamicText(actionDialog.request.reason) ||
                    t("No reason provided")}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4 py-2">
            {actionDialog?.type === "reject" && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  {t("Rejection Reason")} *
                </Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={t(
                    "Please provide a clear reason for rejection...",
                  )}
                  className="min-h-[100px]"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>
                {actionDialog?.type === "complete"
                  ? t("Technician Note (optional)")
                  : t("Additional Note (optional)")}
              </Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("Add any additional notes or comments...")}
                className="min-h-[80px]"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setActionDialog(null)}
              >
                {t("Cancel")}
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleConfirmAction}
                disabled={
                  approveMutation.isPending ||
                  rejectMutation.isPending ||
                  completeMutation.isPending
                }
                variant={
                  actionDialog?.type === "reject" ? "destructive" : "default"
                }
              >
                {approveMutation.isPending ||
                rejectMutation.isPending ||
                completeMutation.isPending ? (
                  <>
                    <RefreshCcw className="h-4 w-4 animate-spin" />
                    {t("Processing...")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {t("Confirm")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!credentialsDialog}
        onOpenChange={() => setCredentialsDialog(null)}
      >
        <DialogContent dir={isArabic ? "rtl" : "ltr"} className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-950">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle>{t("Create PPPoE Change Request")}</DialogTitle>
                <DialogDescription>
                  {t("Submit a new PPPoE change request for this client.")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {credentialsDialog?.request && (
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {credentialsDialog.request.client?.fullName ||
                    t("Unknown Client")}
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  {translateDynamicText(credentialsDialog.request.reason) ||
                    t("No reason provided")}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("Reason")} *</Label>
              <Textarea
                value={credentialsReason}
                onChange={(e) => setCredentialsReason(e.target.value)}
                placeholder={t("Provide a reason for this change...")}
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("New Username")}</Label>
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder={t("Enter PPPoE username")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("New Password")}</Label>
              <Input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("Enter PPPoE password")}
                type="password"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCredentialsDialog(null)}
              >
                {t("Cancel")}
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleUpdateCredentials}
                disabled={createRequestMutation.isPending}
              >
                {createRequestMutation.isPending ? (
                  <>
                    <RefreshCcw className="h-4 w-4 animate-spin" />
                    {t("Saving...")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {t("Save")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Request Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent dir={isArabic ? "rtl" : "ltr"} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Create PPPoE Request")}</DialogTitle>
            <DialogDescription>
              {t("Submit a new PPPoE change request for a client.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("Client")} *</Label>
              <Select
                value={createForm.clientId}
                onValueChange={(value) =>
                  setCreateForm({ ...createForm, clientId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select a client")} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("Reason")} *</Label>
              <Textarea
                value={createForm.reason}
                onChange={(e) =>
                  setCreateForm({ ...createForm, reason: e.target.value })
                }
                placeholder={t("Reason for request")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("New Username")}</Label>
              <Input
                value={createForm.newUsername}
                onChange={(e) =>
                  setCreateForm({ ...createForm, newUsername: e.target.value })
                }
                placeholder={t("Optional new username")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("New Password")}</Label>
              <Input
                value={createForm.newPassword}
                onChange={(e) =>
                  setCreateForm({ ...createForm, newPassword: e.target.value })
                }
                placeholder={t("Optional new password")}
                type="password"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button
                onClick={handleCreateRequest}
                disabled={createRequestMutation.isPending}
              >
                {createRequestMutation.isPending ? (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    {t("Creating...")}
                  </>
                ) : (
                  t("Create Request")
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
