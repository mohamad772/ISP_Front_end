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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, Bell, Shield, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useSettings,
  useUpdateSettings,
  useExportSystemData,
  useSystemHealth,
  useClearSystemCache,
  useActiveSessions,
} from "@/hooks/useSettings";
import type { SystemHealth, ActiveSession } from "@/types/api.types";

export function SettingsPage() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();
  const exportMutation = useExportSystemData();
  const healthMutation = useSystemHealth();
  const clearCacheMutation = useClearSystemCache();
  const sessionsMutation = useActiveSessions();

  const [healthDialogOpen, setHealthDialogOpen] = useState(false);
  const [sessionsDialogOpen, setSessionsDialogOpen] = useState(false);
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);

  const [form, setForm] = useState({
    enableMfa: false,
    sessionTimeoutMinutes: 30,
    auditLoggingEnabled: true,
    emailAlertsEnabled: true,
    paymentRemindersEnabled: true,
    bandwidthWarningsEnabled: true,
    ipWhitelistingEnabled: false,
    passwordExpiryDays: 90,
    systemVersion: "1.0.0",
    lastBackupAt: null as string | null,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        enableMfa: settings.enableMfa ?? false,
        sessionTimeoutMinutes: settings.sessionTimeoutMinutes ?? 30,
        auditLoggingEnabled: settings.auditLoggingEnabled ?? true,
        emailAlertsEnabled: settings.emailAlertsEnabled ?? true,
        paymentRemindersEnabled: settings.paymentRemindersEnabled ?? true,
        bandwidthWarningsEnabled: settings.bandwidthWarningsEnabled ?? true,
        ipWhitelistingEnabled: settings.ipWhitelistingEnabled ?? false,
        passwordExpiryDays: settings.passwordExpiryDays ?? 90,
        systemVersion: settings.systemVersion ?? "1.0.0",
        lastBackupAt: settings.lastBackupAt ?? null,
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

  const handleExportData = async () => {
    try {
      const blob = await exportMutation.mutateAsync();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "system-export.zip";
      link.click();
      window.URL.revokeObjectURL(url);
      toast({ title: "Export started" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
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
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Settings" description="Configure system preferences" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              General
            </CardTitle>
            <CardDescription>Basic system configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable MFA</Label>
                <p className="text-sm text-muted-foreground">Require multi-factor authentication</p>
              </div>
              <Switch
                checked={form.enableMfa}
                onCheckedChange={(v) => handleUpdate({ enableMfa: v })}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Session Timeout</Label>
                <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
              </div>
              <Input
                type="number"
                min="1"
                className="w-24"
                value={form.sessionTimeoutMinutes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sessionTimeoutMinutes: Number(e.target.value || 0),
                  })
                }
                onBlur={() =>
                  handleUpdate({
                    sessionTimeoutMinutes: Number(form.sessionTimeoutMinutes || 0),
                  })
                }
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Audit Logging</Label>
                <p className="text-sm text-muted-foreground">Track all system actions</p>
              </div>
              <Switch
                checked={form.auditLoggingEnabled}
                onCheckedChange={(v) => handleUpdate({ auditLoggingEnabled: v })}
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>Alert and notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Alerts</Label>
                <p className="text-sm text-muted-foreground">Send critical alerts via email</p>
              </div>
              <Switch
                checked={form.emailAlertsEnabled}
                onCheckedChange={(v) => handleUpdate({ emailAlertsEnabled: v })}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Payment Reminders</Label>
                <p className="text-sm text-muted-foreground">Notify on overdue invoices</p>
              </div>
              <Switch
                checked={form.paymentRemindersEnabled}
                onCheckedChange={(v) =>
                  handleUpdate({ paymentRemindersEnabled: v })
                }
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Bandwidth Warnings</Label>
                <p className="text-sm text-muted-foreground">Alert when usage exceeds 80%</p>
              </div>
              <Switch
                checked={form.bandwidthWarningsEnabled}
                onCheckedChange={(v) =>
                  handleUpdate({ bandwidthWarningsEnabled: v })
                }
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </CardTitle>
            <CardDescription>Security and access control</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>IP Whitelisting</Label>
                <p className="text-sm text-muted-foreground">Restrict admin access by IP</p>
              </div>
              <Switch
                checked={form.ipWhitelistingEnabled}
                onCheckedChange={(v) =>
                  handleUpdate({ ipWhitelistingEnabled: v })
                }
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Password Expiry</Label>
                <p className="text-sm text-muted-foreground">Force password change every 90 days</p>
              </div>
              <Input
                type="number"
                min="1"
                className="w-24"
                value={form.passwordExpiryDays}
                onChange={(e) =>
                  setForm({
                    ...form,
                    passwordExpiryDays: Number(e.target.value || 0),
                  })
                }
                onBlur={() =>
                  handleUpdate({
                    passwordExpiryDays: Number(form.passwordExpiryDays || 0),
                  })
                }
                disabled={isLoading}
              />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleViewSessions}
              disabled={sessionsMutation.isPending}
            >
              View Active Sessions
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              System
            </CardTitle>
            <CardDescription>Database and maintenance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleExportData}
              disabled={exportMutation.isPending}
            >
              Export Data
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleHealthCheck}
              disabled={healthMutation.isPending}
            >
              System Health Check
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleClearCache}
              disabled={clearCacheMutation.isPending}
            >
              Clear Cache
            </Button>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                System Version: {form.systemVersion || "1.0.0"}
              </p>
              <p className="text-xs text-muted-foreground">
                Last Backup:{" "}
                {form.lastBackupAt
                  ? new Date(form.lastBackupAt).toLocaleString()
                  : "Never"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={healthDialogOpen} onOpenChange={setHealthDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>System Health</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {healthEntries.length === 0 && (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
            {healthEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{key}</span>
                <span className="font-medium">
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
        <DialogContent className="w-[calc(100%-2rem)] max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Active Sessions</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {activeSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active sessions</p>
            ) : (
              activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-md border p-3 text-sm space-y-1"
                >
                  <p className="font-medium">
                    {session.username || session.userId}
                  </p>
                  <p className="text-muted-foreground">
                    IP: {session.ipAddress || "N/A"}
                  </p>
                  <p className="text-muted-foreground">
                    Last Active:{" "}
                    {session.lastActiveAt
                      ? new Date(session.lastActiveAt).toLocaleString()
                      : "N/A"}
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
