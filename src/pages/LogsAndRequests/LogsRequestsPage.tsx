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
import { useAuditLogs } from "@/hooks/useAuditLog";
import {
  usePPPoERequests,
  useApprovePPPoERequest,
  useRejectPPPoERequest,
  useCompletePPPoERequest,
  useCreatePPPoERequest,
} from "@/hooks/usepppoeRequests";
import type { AuditLog, PPPoERequest } from "@/types/api.types";
import { PPPoERequestStatus } from "@/types/api.types";
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
} from "lucide-react";

type RequestActionType = "approve" | "reject" | "complete";

export function LogsRequestsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("logs");
  const [actionDialog, setActionDialog] = useState<{
    type: RequestActionType;
    request: PPPoERequest;
  } | null>(null);
  const [credentialsDialog, setCredentialsDialog] = useState<{
    request: PPPoERequest;
  } | null>(null);
  const [note, setNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [credentialsReason, setCredentialsReason] = useState("");

  const { data: auditLogs = [], isLoading: logsLoading } = useAuditLogs();
  const { data: pppoeRequests = [], isLoading: requestsLoading } =
    usePPPoERequests();
  const approveMutation = useApprovePPPoERequest();
  const rejectMutation = useRejectPPPoERequest();
  const completeMutation = useCompletePPPoERequest();
  const createRequestMutation = useCreatePPPoERequest();

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

  const auditColumns = [
    {
      key: "createdAt",
      header: "Timestamp",
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
      header: "User",
      render: (log: AuditLog) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950">
            <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="font-medium text-sm">
            {log.user?.username || log.userId || "N/A"}
          </span>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (log: AuditLog) => (
        <Badge variant="outline" className="font-mono text-xs">
          {log.action}
        </Badge>
      ),
    },
    {
      key: "entityType",
      header: "Entity",
      render: (log: AuditLog) => (
        <Badge variant="secondary" className="text-xs">
          {log.entityType}
        </Badge>
      ),
    },
    {
      key: "details",
      header: "Details",
      render: (log: AuditLog) => (
        <div className="max-w-xs truncate text-xs text-muted-foreground font-mono">
          {log.details ? JSON.stringify(log.details) : "-"}
        </div>
      ),
    },
    {
      key: "ipAddress",
      header: "IP Address",
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
      header: "Client",
      render: (req: PPPoERequest) => (
        <div className="flex items-center gap-3 min-w-[180px]">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {(req.client?.fullName || "U")[0].toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">
              {req.client?.fullName || "Unknown"}
            </span>
            <span className="text-xs text-muted-foreground">
              ID: {req.clientId || "N/A"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (req: PPPoERequest) => (
        <div className="flex items-start gap-2 max-w-md">
          <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <span className="text-sm">{req.reason || "No reason provided"}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
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
      header: "Requested",
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
      header: "Actions",
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
                Edit Credentials
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  setNote("");
                  setRejectionReason("");
                  setActionDialog({ type: "approve", request: req });
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="gap-2"
                onClick={() => {
                  setNote("");
                  setRejectionReason("");
                  setActionDialog({ type: "reject", request: req });
                }}
              >
                <XCircle className="h-4 w-4" />
                Reject
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
                Edit Credentials
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setNote("");
                  setRejectionReason("");
                  setActionDialog({ type: "complete", request: req });
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Complete
              </Button>
            </div>
          );
        }
        return <span className="text-muted-foreground text-sm">-</span>;
      },
    },
  ];

  const handleConfirmAction = async () => {
    if (!actionDialog) return;
    const { type, request } = actionDialog;
    try {
      if (type === "approve") {
        await approveMutation.mutateAsync({
          id: request.id,
          data: note ? { note } : undefined,
        });
        toast({
          title: "Request approved",
          description: "The PPPoE request has been approved successfully.",
        });
      } else if (type === "reject") {
        if (!rejectionReason.trim()) {
          toast({
            title: "Rejection reason is required",
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
          title: "Request rejected",
          description: "The PPPoE request has been rejected.",
        });
      } else if (type === "complete") {
        await completeMutation.mutateAsync({
          id: request.id,
          data: note ? { technicianNote: note } : undefined,
        });
        toast({
          title: "Request completed",
          description: "The PPPoE request has been marked as completed.",
        });
      }
      setActionDialog(null);
    } catch {
      toast({ title: "Action failed", variant: "destructive" });
    }
  };

  const handleUpdateCredentials = async () => {
    if (!credentialsDialog) return;
    const { request } = credentialsDialog;
    try {
      if (!newUsername.trim() && !newPassword.trim()) {
        toast({
          title: "Username or password required",
          variant: "destructive",
        });
        return;
      }
      if (!credentialsReason.trim()) {
        toast({
          title: "Reason is required",
          variant: "destructive",
        });
        return;
      }
      await createRequestMutation.mutateAsync({
        clientId: request.clientId,
        reason: credentialsReason.trim(),
        newUsername: newUsername.trim() || undefined,
        newPassword: newPassword.trim() || undefined,
      });
      toast({
        title: "Request created",
        description: "A new PPPoE change request has been created.",
      });
      setCredentialsDialog(null);
    } catch {
      toast({ title: "Create request failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Enhanced Page Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="Logs & Requests"
          description="Comprehensive audit logging and PPPoE request management system"
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
                    Pending
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
                    Approved
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
                    Rejected
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
                    Completed
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
        <TabsList className="grid w-full max-w-md grid-cols-2 h-12">
          <TabsTrigger value="logs" className="gap-2">
            <Activity className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <FileText className="h-4 w-4" />
            PPPoE Requests
            {requestStats.pending > 0 && (
              <Badge
                variant="destructive"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {requestStats.pending}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Audit Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card className="shadow-lg border-2">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5" />
                System Audit Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Enhanced Search */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user, action, entity, IP address..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-hidden">
                <DataTable
                  columns={auditColumns}
                  data={filteredLogs}
                  isLoading={logsLoading}
                  emptyMessage="No audit logs found"
                />
              </div>

              {/* Results count */}
              <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
                <span>
                  Showing {filteredLogs.length} of {auditLogs.length} logs
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
                PPPoE Connection Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Enhanced Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-gray-400" />
                          All Status
                        </div>
                      </SelectItem>
                      <SelectItem value={PPPoERequestStatus.PENDING}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-yellow-400" />
                          Pending
                        </div>
                      </SelectItem>
                      <SelectItem value={PPPoERequestStatus.APPROVED}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-400" />
                          Approved
                        </div>
                      </SelectItem>
                      <SelectItem value={PPPoERequestStatus.REJECTED}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-400" />
                          Rejected
                        </div>
                      </SelectItem>
                      <SelectItem value={PPPoERequestStatus.COMPLETED}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-400" />
                          Completed
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-hidden">
                <DataTable
                  columns={requestColumns}
                  data={filteredRequests}
                  isLoading={requestsLoading}
                  emptyMessage="No PPPoE requests found"
                />
              </div>

              {/* Results count */}
              <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
                <span>
                  Showing {filteredRequests.length} of {pppoeRequests.length}{" "}
                  requests
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="sm:max-w-md">
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
                  {actionDialog?.type === "approve" && "Approve Request"}
                  {actionDialog?.type === "reject" && "Reject Request"}
                  {actionDialog?.type === "complete" && "Complete Request"}
                </DialogTitle>
                <DialogDescription>
                  {actionDialog?.type === "approve" &&
                    "This will approve the PPPoE connection request."}
                  {actionDialog?.type === "reject" &&
                    "Please provide a reason for rejecting this request."}
                  {actionDialog?.type === "complete" &&
                    "Mark this request as completed."}
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
                  {actionDialog.request.client?.fullName || "Unknown Client"}
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  {actionDialog.request.reason || "No reason provided"}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4 py-2">
            {actionDialog?.type === "reject" && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Rejection Reason *
                </Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a clear reason for rejection..."
                  className="min-h-[100px]"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>
                {actionDialog?.type === "complete"
                  ? "Technician Note (optional)"
                  : "Additional Note (optional)"}
              </Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add any additional notes or comments..."
                className="min-h-[80px]"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setActionDialog(null)}
              >
                Cancel
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
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Confirm
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-950">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle>Create PPPoE Change Request</DialogTitle>
                <DialogDescription>
                  Submit a new PPPoE change request for this client.
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
                    "Unknown Client"}
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  {credentialsDialog.request.reason || "No reason provided"}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea
                value={credentialsReason}
                onChange={(e) => setCredentialsReason(e.target.value)}
                placeholder="Provide a reason for this change..."
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label>New Username</Label>
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter PPPoE username"
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter PPPoE password"
                type="password"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCredentialsDialog(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleUpdateCredentials}
                disabled={createRequestMutation.isPending}
              >
                {createRequestMutation.isPending ? (
                  <>
                    <RefreshCcw className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
