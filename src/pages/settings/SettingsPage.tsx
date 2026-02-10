import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield,
  Database,
  Activity,
  Loader2,
  FileText,
  Palette,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useSettings,
  useUpdateSettings,
  useSystemHealth,
  useClearSystemCache,
  useActiveSessions,
} from "@/hooks/useSettings";
import {
  useExportInvoicesExcel,
  useExportInvoicesPdf,
  useInvoices,
} from "@/hooks/useInvoices";
import type { SystemHealth, ActiveSession } from "@/types/api.types";
import { exportInvoicesAdvanced } from "@/utils/advancedPdfExport";

export function SettingsPage() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useSettings();
  const { data: invoicesData } = useInvoices();
  const updateMutation = useUpdateSettings();
  const exportInvoicesExcelMutation = useExportInvoicesExcel();
  const exportInvoicesPdfMutation = useExportInvoicesPdf();
  const healthMutation = useSystemHealth();
  const clearCacheMutation = useClearSystemCache();
  const sessionsMutation = useActiveSessions();

  const [healthDialogOpen, setHealthDialogOpen] = useState(false);
  const [sessionsDialogOpen, setSessionsDialogOpen] = useState(false);
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isExportingAdvanced, setIsExportingAdvanced] = useState(false);

  const [form, setForm] = useState({
    auditLoggingEnabled: true,
    passwordExpiryDays: 90,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        auditLoggingEnabled: settings.auditLoggingEnabled ?? true,
        passwordExpiryDays:
          settings.passwordExpiryDays && settings.passwordExpiryDays > 0
            ? settings.passwordExpiryDays
            : 90,
      });
    }
  }, [settings]);

  const handleUpdate = async (partial: Partial<typeof form>) => {
    const next = { ...form, ...partial };
    setForm(next);
    try {
      await updateMutation.mutateAsync(next);
      toast({ title: "Settings updated" });
    } catch {
      toast({ title: "Failed to update settings", variant: "destructive" });
    }
  };

  const healthEntries = useMemo(() => {
    if (!healthData) return [];
    return Object.entries(healthData);
  }, [healthData]);

  const handleExportInvoicesExcel = async () => {
    try {
      const blob = await exportInvoicesExcelMutation.mutateAsync(undefined);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoices-${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast({ title: "Invoice Excel export completed successfully" });
    } catch {
      toast({ title: "Invoice Excel export failed", variant: "destructive" });
    }
  };

  const handleExportInvoicesPdf = async () => {
    try {
      const blob = await exportInvoicesPdfMutation.mutateAsync(undefined);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoices-${new Date().toISOString().split("T")[0]}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast({ title: "Invoice PDF export completed successfully" });
    } catch {
      toast({ title: "Invoice PDF export failed", variant: "destructive" });
    }
  };

  const handleExportAdvancedPdf = async (
    colorScheme: "blue" | "green" | "purple" | "corporate",
  ) => {
    if (!invoicesData || invoicesData.length === 0) {
      toast({ title: "No invoices to export", variant: "destructive" });
      return;
    }

    setIsExportingAdvanced(true);
    try {
      const blob = await exportInvoicesAdvanced(invoicesData, {
        includeCharts: true,
        includeSummary: true,
        includeAnalytics: true,
        colorScheme,
        companyInfo: {
          name: "ISP",
          address: "Aleppo,syria",
          phone: "+963911111111",
          email: "contact@ISP.com",
          website: "www.ISP.com",
        },
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoices-advanced-${colorScheme}-${new Date().toISOString().split("T")[0]}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Advanced PDF export completed",
        description: `Generated with ${colorScheme} theme`,
      });
    } catch (error) {
      console.error("Advanced PDF export error:", error);
      toast({
        title: "Advanced PDF export failed",
        variant: "destructive",
        description: "Please check console for details",
      });
    } finally {
      setIsExportingAdvanced(false);
    }
  };

  const handleHealthCheck = async () => {
    try {
      const data = await healthMutation.mutateAsync();
      setHealthData(data);
      setHealthDialogOpen(true);
    } catch {
      toast({ title: "Health check failed", variant: "destructive" });
    }
  };

  const handleClearCache = async () => {
    try {
      const result = await clearCacheMutation.mutateAsync();
      toast({ title: result.message || "Cache cleared" });
    } catch {
      toast({ title: "Failed to clear cache", variant: "destructive" });
    }
  };

  const handleViewSessions = async () => {
    try {
      const sessions = await sessionsMutation.mutateAsync();
      setActiveSessions(sessions);
      setSessionsDialogOpen(true);
    } catch {
      toast({ title: "Failed to load sessions", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "5s" }}
        />
        <div
          className="absolute bottom-40 left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "7s", animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/3 left-1/3 w-72 h-72 bg-primary/3 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10">
        <PageHeader
          title="Settings"
          description="Configure system preferences"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 relative z-10">
        <Card className="group relative overflow-hidden transition-all duration-700 hover:shadow-[0_20px_70px_-15px_rgba(0,0,0,0.3)] border-border/50 animate-in slide-in-from-left-8 duration-1000 delay-150">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700 -translate-y-1/2 translate-x-1/2 group-hover:scale-150" />

          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-2000 ease-in-out" />
          </div>

          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
                <Shield className="w-5 h-5 text-primary" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
              </div>
              <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Security
              </span>
            </CardTitle>
            <CardDescription>Audit logging and password policy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div className="group/item flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-500 border border-transparent hover:border-primary/20 animate-in slide-in-from-left duration-700 delay-250">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500 rounded-xl" />
              <div className="relative z-10">
                <Label className="font-semibold">Audit Logging</Label>
                <p className="text-sm text-muted-foreground">
                  Track all system actions
                </p>
              </div>
              <Switch
                checked={form.auditLoggingEnabled}
                onCheckedChange={(v) =>
                  handleUpdate({ auditLoggingEnabled: v })
                }
                disabled={isLoading}
                className="relative z-10"
              />
            </div>

            <div className="group/item flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-500 border border-transparent hover:border-primary/20 animate-in slide-in-from-left duration-700 delay-300">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500 rounded-xl" />
              <div className="relative z-10">
                <Label className="font-semibold">Password Expiry</Label>
                <p className="text-sm text-muted-foreground">
                  Force password change every 90 days
                </p>
              </div>
              <Input
                type="number"
                min="90"
                className="w-24 relative z-10 transition-all duration-300 focus:ring-2 focus:ring-primary/30"
                value={form.passwordExpiryDays}
                onChange={(e) =>
                  setForm({
                    ...form,
                    passwordExpiryDays: Number(e.target.value || 0),
                  })
                }
                onBlur={() =>
                  handleUpdate({
                    passwordExpiryDays: Math.max(
                      90,
                      Number(form.passwordExpiryDays || 0),
                    ),
                  })
                }
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all duration-700 hover:shadow-[0_20px_70px_-15px_rgba(0,0,0,0.3)] border-border/50 animate-in slide-in-from-right-8 duration-1000 delay-150">
          <div className="absolute inset-0 bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700 translate-y-1/2 -translate-x-1/2 group-hover:scale-150" />

          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent translate-x-full group-hover:-translate-x-full transition-transform duration-2000 ease-in-out" />
          </div>

          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
                <Database className="w-5 h-5 text-primary" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
              </div>
              <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                System
              </span>
            </CardTitle>
            <CardDescription>Database and maintenance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <div className="animate-in slide-in-from-right duration-700 delay-250">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full relative overflow-hidden group/button transition-all duration-500 hover:shadow-lg hover:scale-[1.02]"
                    disabled={
                      exportInvoicesExcelMutation.isPending ||
                      exportInvoicesPdfMutation.isPending ||
                      isExportingAdvanced
                    }
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover/button:opacity-100 transition-opacity duration-500" />
                    <span className="relative z-10 flex items-center justify-center">
                      {exportInvoicesExcelMutation.isPending ||
                      exportInvoicesPdfMutation.isPending ||
                      isExportingAdvanced ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Export Data
                        </>
                      )}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Standard Exports
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleExportInvoicesExcel}>
                    <span className="flex items-center gap-2">
                      📊 Invoices Export (Excel)
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportInvoicesPdf}>
                    <span className="flex items-center gap-2">
                      📄 Invoices Export (Basic PDF)
                    </span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Advanced PDF Exports
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => handleExportAdvancedPdf("blue")}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500" />
                      Blue Theme (Professional)
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExportAdvancedPdf("green")}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      Green Theme (Fresh)
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExportAdvancedPdf("purple")}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-purple-500" />
                      Purple Theme (Creative)
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExportAdvancedPdf("corporate")}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-gray-700" />
                      Corporate Theme (Classic)
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="animate-in slide-in-from-right duration-700 delay-300">
              <Button
                variant="outline"
                className="w-full relative overflow-hidden group/button transition-all duration-500 hover:shadow-lg hover:scale-[1.02]"
                onClick={handleHealthCheck}
                disabled={healthMutation.isPending}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover/button:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10">
                  {healthMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "System Health Check"
                  )}
                </span>
              </Button>
            </div>

            <div className="animate-in slide-in-from-right duration-700 delay-350">
              <Button
                variant="outline"
                className="w-full relative overflow-hidden group/button transition-all duration-500 hover:shadow-lg hover:scale-[1.02]"
                onClick={handleClearCache}
                disabled={clearCacheMutation.isPending}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover/button:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10">
                  {clearCacheMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    "Clear Cache"
                  )}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={healthDialogOpen} onOpenChange={setHealthDialogOpen}>
        <DialogContent className="animate-in fade-in zoom-in duration-300">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              System Health
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {healthEntries.length === 0 && (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
            {healthEntries.map(([key, value], i) => (
              <div
                key={key}
                className="flex items-center justify-between text-sm p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-300 animate-in slide-in-from-left"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="text-muted-foreground font-medium">{key}</span>
                <span className="font-semibold">
                  {typeof value === "string" || typeof value === "number"
                    ? String(value)
                    : JSON.stringify(value)}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={sessionsDialogOpen} onOpenChange={setSessionsDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Active Sessions
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {activeSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active sessions
              </p>
            ) : (
              activeSessions.map((session, i) => (
                <div
                  key={session.id}
                  className="group relative overflow-hidden rounded-xl border p-4 text-sm space-y-2 bg-muted/20 hover:bg-muted/40 transition-all duration-500 animate-in slide-in-from-bottom"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <p className="font-semibold text-base relative z-10">
                    {session.username || session.userId}
                  </p>
                  <p className="text-muted-foreground relative z-10">
                    IP:{" "}
                    <span className="font-medium text-foreground">
                      {session.ipAddress || "N/A"}
                    </span>
                  </p>
                  <p className="text-muted-foreground relative z-10">
                    Last Active:{" "}
                    <span className="font-medium text-foreground">
                      {session.lastActiveAt
                        ? new Date(session.lastActiveAt).toLocaleString()
                        : "N/A"}
                    </span>
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
