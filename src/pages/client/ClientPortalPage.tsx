import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptions, useUsageLogs } from "@/hooks/useSubscription";
import { useLogout } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useCreatePasswordChangeRequest } from "@/hooks/usePasswordChangeRequests";
import { useCreatePackageUpgradeRequest } from "@/hooks/usePackageUpgradeRequests";
import { getAllServicePlans } from "@/service/seviceplane.service";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Lock,
  PackagePlus,
  Wifi,
  CloudDownload,
  CloudUpload,
  Languages,
} from "lucide-react";

export function ClientPortalPage() {
  const { user } = useStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { mutateAsync: logout, isPending: isLoggingOut } = useLogout();
  const { t, i18n } = useTranslation();
  const translateApiText = (value?: string | null) =>
    value ? t(value, { defaultValue: value }) : value;
  const displayName = useMemo(() => {
    const raw = user?.username || user?.email || "";
    const base = raw.includes("@") ? raw.split("@")[0] : raw;
    if (!base) return t("Client");
    const parts = base
      .replace(/[._-]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1));
    return parts[0] || t("Client");
  }, [user?.username, user?.email, t]);
  const clientId = user?.clientId;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordReason, setPasswordReason] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>();

  const { data: subscriptions, isLoading: subsLoading } = useSubscriptions(
    clientId ? { clientId } : undefined,
  );

  const activeSubscription = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) return undefined;
    return (
      subscriptions.find((sub) => sub.status === "ACTIVE") || subscriptions[0]
    );
  }, [subscriptions]);

  const subscriptionId = activeSubscription?.id ?? "";
  const { data: usageLogs } = useUsageLogs(subscriptionId);

  const totalDownloadMb =
    usageLogs?.reduce((sum, log) => sum + Number(log.downloadMb || 0), 0) ?? 0;
  const totalUploadMb =
    usageLogs?.reduce((sum, log) => sum + Number(log.uploadMb || 0), 0) ?? 0;
  const totalUsageGb = (totalDownloadMb + totalUploadMb) / 1024;
  const capacityGb = activeSubscription?.plan?.dataCapacityGb;
  const usagePercent =
    capacityGb && capacityGb > 0
      ? Math.min(100, (totalUsageGb / capacityGb) * 100)
      : undefined;

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["service-plans", "active"],
    queryFn: () => getAllServicePlans({ isActive: true }),
    staleTime: 60_000,
  });

  const { mutateAsync: requestPlan, isPending: isRequestingPlan } =
    useCreatePackageUpgradeRequest();
  const { mutateAsync: requestPasswordChange, isPending: isRequestingPassword } =
    useCreatePasswordChangeRequest();

  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error(error);
      toast({
        title: t("Sign out failed"),
        description: t("Please try again."),
        variant: "destructive",
      });
    }
  };

  const handleToggleLanguage = () => {
    const nextLanguage = i18n.resolvedLanguage?.startsWith("ar") ? "en" : "ar";
    void i18n.changeLanguage(nextLanguage);
  };

  const handlePasswordRequest = async () => {
    if (!clientId) {
      toast({
        title: t("Missing client profile"),
        description: t("Your account is not linked to a client profile."),
        variant: "destructive",
      });
      return;
    }
    if (!currentPassword.trim()) {
      toast({
        title: t("Current password is required"),
        description: t("Please enter your current account password."),
        variant: "destructive",
      });
      return;
    }
    if (!newPassword.trim()) {
      toast({
        title: t("Password is required"),
        description: t("Please enter the new password you want."),
        variant: "destructive",
      });
      return;
    }

    try {
      await requestPasswordChange({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        reason: passwordReason.trim() || t("Client requested password change"),
      });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordReason("");
      toast({
        title: t("Request sent"),
        description: t("Your password change request has been submitted."),
      });
    } catch (error) {
      console.error(error);
      toast({
        title: t("Request failed"),
        description: t("We could not submit the request. Try again."),
        variant: "destructive",
      });
    }
  };

  const handlePlanRequest = async () => {
    if (!clientId) {
      toast({
        title: t("Missing client profile"),
        description: t("Your account is not linked to a client profile."),
        variant: "destructive",
      });
      return;
    }
    if (!selectedPlanId) {
      toast({
        title: t("Choose a plan"),
        description: t("Select the package you want to add."),
        variant: "destructive",
      });
      return;
    }

    if (!activeSubscription?.id) {
      toast({
        title: t("No active subscription"),
        description: t("You need an active subscription before requesting a new package."),
        variant: "destructive",
      });
      return;
    }

    try {
      await requestPlan({
        subscriptionId: activeSubscription.id,
        requestedPlanId: selectedPlanId,
      });
      setSelectedPlanId(undefined);
      toast({
        title: t("Package request sent"),
        description: t("Your package request is pending approval."),
      });
    } catch (error) {
      console.error(error);
      toast({
        title: t("Request failed"),
        description: t("We could not submit the package request."),
        variant: "destructive",
      });
    }
  };

  const usageLabel = capacityGb
    ? `${totalUsageGb.toFixed(2)} GB / ${capacityGb} GB`
    : `${totalUsageGb.toFixed(2)} GB used`;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.15),_transparent_55%)]">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-lg shadow-primary/30">
                <Wifi className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
                  {t("Client Portal")}
                </p>
                <h1 className="text-3xl font-bold text-foreground">
                  {t("Welcome, {{name}}", {
                    name: displayName,
                  })}
                </h1>
              </div>
            </div>
            <div className="inline-flex items-center gap-1 rounded-xl border bg-card/80 p-1 backdrop-blur">
              <Button variant="ghost" size="sm" onClick={handleToggleLanguage}>
                <Languages className="h-4 w-4 mr-1" />
                {i18n.resolvedLanguage?.startsWith("ar")
                  ? t("English")
                  : t("Arabic")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? t("Signing out...") : t("Sign out")}
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            {t(
              "Track your usage, request a password change, or submit a new package request.",
            )}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border border-primary/10 bg-card/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                {t("Usage Overview")}
              </CardTitle>
              <CardDescription>
                {t("Live usage for your current subscription.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {subsLoading ? (
                <p className="text-sm text-muted-foreground">
                  {t("Loading usage...")}
                </p>
              ) : !activeSubscription ? (
                <div className="rounded-xl border border-dashed border-muted-foreground/30 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t("No active subscription found.")}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("Current Plan")}
                      </p>
                      <p className="text-xl font-semibold">
                        {translateApiText(activeSubscription.plan?.planName) ??
                          t("Plan")}
                      </p>
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-600">
                      {t(
                        activeSubscription.status.charAt(0) +
                          activeSubscription.status.slice(1).toLowerCase(),
                      )}
                    </Badge>
                  </div>

                  <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{t("Data usage")}</span>
                      <span>{usageLabel}</span>
                    </div>
                    <Progress
                      className="mt-3 h-2.5"
                      value={usagePercent ?? 0}
                    />
                    {capacityGb ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t("{{percent}}% of your data cap used.", {
                          percent: usagePercent?.toFixed(1) ?? "0.0",
                        })}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t("Unlimited plan. Usage is still tracked.")}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/60 p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CloudDownload className="h-4 w-4 text-primary" />
                        {t("Downloaded")}
                      </div>
                      <p className="mt-2 text-2xl font-semibold">
                        {(totalDownloadMb / 1024).toFixed(2)} GB
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/60 p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CloudUpload className="h-4 w-4 text-primary" />
                        {t("Uploaded")}
                      </div>
                      <p className="mt-2 text-2xl font-semibold">
                        {(totalUploadMb / 1024).toFixed(2)} GB
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-2">
                      {t("Recent Usage Logs")}
                    </p>
                    {usageLogs && usageLogs.length > 0 ? (
                      <div className="space-y-2">
                        {usageLogs.slice(-5).map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm"
                          >
                            <span>
                              {new Date(log.logDate).toLocaleDateString()}
                            </span>
                            <span className="text-muted-foreground">
                              {(
                                (Number(log.downloadMb) + Number(log.uploadMb)) /
                                1024
                              ).toFixed(2)}{" "}
                              GB
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t("No usage logs yet.")}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-primary/10 bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  {t("Request Account Password Change")}
                </CardTitle>
                <CardDescription>
                  {t("Submit a request to update your account password.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">
                    {t("Current Account Password")}
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t("Enter current password")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">
                    {t("New Account Password")}
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("Enter new password")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordReason">
                    {t("Reason (optional)")}
                  </Label>
                  <Textarea
                    id="passwordReason"
                    value={passwordReason}
                    onChange={(e) => setPasswordReason(e.target.value)}
                    placeholder={t("Reason for the change")}
                    rows={3}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handlePasswordRequest}
                  disabled={isRequestingPassword}
                >
                  {isRequestingPassword ? t("Sending...") : t("Send Request")}
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-primary/10 bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PackagePlus className="h-5 w-5 text-primary" />
                  {t("Request New Package")}
                </CardTitle>
                <CardDescription>
                  {t("Select a plan and submit a package request.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("Select Plan")}</Label>
                  <Select
                    value={selectedPlanId}
                    onValueChange={setSelectedPlanId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          plansLoading
                            ? t("Loading plans...")
                            : t("Choose a plan")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {plans?.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {translateApiText(plan.planName)} - {plan.cost}$
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={handlePlanRequest}
                  disabled={isRequestingPlan}
                >
                  {isRequestingPlan
                    ? t("Submitting...")
                    : t("Submit Request")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
