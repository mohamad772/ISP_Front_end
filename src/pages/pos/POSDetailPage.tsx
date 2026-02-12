import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, Wifi, Users, Globe, Activity, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isValidPhone10, normalizePhone10 } from "@/utils/phone";
import { useTranslation } from "react-i18next";
import {
  usePOS,
  usePOSClients,
  useUpdatePOS,
  useUpdatePOSBandwidth,
} from "@/hooks/usePos";
import type { Client, StaticIP } from "@/types/api.types";
import { useStaticIPs } from "@/hooks/useStaticIp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function POSDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: pos, isLoading: posLoading } = usePOS(id || "");
  const { data: clients = [], isLoading: clientsLoading } = usePOSClients(
    id || "",
  );
  const { data: staticIPs = [] } = useStaticIPs({ posId: id });
  const updatePOSMutation = useUpdatePOS();
  const updatePOSBandwidthMutation = useUpdatePOSBandwidth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    location: "",
    contactPhone: "",
    allocatedBandwidthMbps: "",
  });

  const isLoading = posLoading || clientsLoading;
  const isArabic = (i18n.resolvedLanguage || i18n.language).startsWith("ar");
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;
  const getConnectionTypeLabel = (connectionType: Client["connectionType"]) => {
    if (connectionType === "DYNAMIC") {
      return t("Dynamic IP");
    }
    if (connectionType === "STATIC") {
      return t("Static IP");
    }
    if (connectionType === "PPPOE") {
      return t("PPPoE");
    }
    return connectionType;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!pos) {
    return <div>{t("POS not found")}</div>;
  }

  const allocated = Number(pos.allocatedBandwidthMbps) || 0;
  const used = Number(pos.usedBandwidthMbps) || 0;
  const bandwidthUsage =
    allocated > 0 ? Math.round((used / allocated) * 100) : 0;

  const openEdit = () => {
    setEditForm({
      name: pos.name ?? "",
      location: pos.location ?? "",
      contactPhone: normalizePhone10(pos.contactPhone ?? ""),
      allocatedBandwidthMbps: String(pos.allocatedBandwidthMbps ?? ""),
    });
    setIsEditOpen(true);
  };

  const handleUpdatePOS = async () => {
    if (!id) {
      return;
    }
    if (isSaving) {
      return;
    }
    const nextAllocated = Number(editForm.allocatedBandwidthMbps);
    if (
      !editForm.name.trim() ||
      !editForm.location.trim() ||
      !editForm.contactPhone.trim()
    ) {
      toast({ title: t("All fields are required"), variant: "destructive" });
      return;
    }
    if (!isValidPhone10(editForm.contactPhone)) {
      toast({
        title: t("Contact phone must be 10 digits"),
        variant: "destructive",
      });
      return;
    }
    if (!Number.isFinite(nextAllocated) || nextAllocated <= 0) {
      toast({
        title: t("Allocated bandwidth must be a positive number"),
        variant: "destructive",
      });
      return;
    }
    try {
      setIsSaving(true);
      await updatePOSMutation.mutateAsync({
        id,
        data: {
          name: editForm.name.trim(),
          location: editForm.location.trim(),
          contactPhone: editForm.contactPhone.trim(),
        },
      });
      if (nextAllocated !== allocated) {
        await updatePOSBandwidthMutation.mutateAsync({
          id,
          data: { allocatedBandwidthMbps: nextAllocated },
        });
      }
      toast({ title: t("POS updated successfully") });
      setIsEditOpen(false);
    } catch (error) {
      const rawMessage = (
        error as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage || t("Failed to update POS");
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  const activeClients = clients.filter((c) => c.status === "ACTIVE").length;
  const usedStaticIPs = staticIPs.filter(
    (ip) => ip.status === "ASSIGNED",
  ).length;
  const totalStaticIPs = staticIPs.length;

  const clientColumns = [
    {
      key: "fullName",
      header: t("Name"),
      render: (c: Client) => c.fullName,
    },
    {
      key: "connectionType",
      header: t("Type"),
      render: (c: Client) => (
        <span className="capitalize">
          {getConnectionTypeLabel(c.connectionType)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("Status"),
      render: (c: Client) => <StatusBadge status={c.status.toLowerCase()} />,
    },
    {
      key: "phone",
      header: t("Phone"),
    },
  ];

  const staticIPColumns = [
    {
      key: "ipAddress",
      header: t("IP Address"),
      render: (ip: StaticIP) => (
        <code className="bg-muted px-2 py-0.5 rounded">{ip.ipAddress}</code>
      ),
    },
    {
      key: "status",
      header: t("Status"),
      render: (ip: StaticIP) => (
        <StatusBadge status={ip.status.toLowerCase()} />
      ),
    },
    {
      key: "client",
      header: t("Assigned To"),
      render: (ip: StaticIP) => ip.client?.fullName || t("Available"),
    },
    {
      key: "subnet",
      header: t("Subnet"),
      render: (ip: StaticIP) => ip.subnetMask,
    },
  ];

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`space-y-6 animate-fade-in ${isArabic ? "text-right" : "text-left"}`}
    >
      <PageHeader
        title={pos.name}
        description={`${pos.location} - ${pos.contactPhone}`}
        actions={
          <div className={`flex gap-2 ${isArabic ? "flex-row-reverse" : ""}`}>
            <Button variant="outline" onClick={() => navigate("/pos")}>
              <BackIcon className={`w-4 h-4 ${isArabic ? "ml-2" : "mr-2"}`} />
              {t("Back")}
            </Button>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button onClick={openEdit}>
                  <Edit className={`w-4 h-4 ${isArabic ? "ml-2" : "mr-2"}`} />
                  {t("Edit POS")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("Edit POS")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{t("POS Name")}</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Location")}</Label>
                    <Input
                      value={editForm.location}
                      onChange={(e) =>
                        setEditForm({ ...editForm, location: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Contact Phone")}</Label>
                    <Input
                      value={editForm.contactPhone}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          contactPhone: normalizePhone10(e.target.value),
                        })
                      }
                      inputMode="numeric"
                      maxLength={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("Allocated Bandwidth (Mbps)")}</Label>
                    <Input
                      type="number"
                      min="1"
                      value={editForm.allocatedBandwidthMbps}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          allocatedBandwidthMbps: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleUpdatePOS}
                    disabled={isSaving}
                  >
                    {isSaving ? `${t("Saving")}...` : t("Save Changes")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title={t("Allocated Bandwidth")}
          value={`${allocated} Mbps`}
          icon={Wifi}
          variant="accent"
        />
        <StatCard
          title={t("Active Clients")}
          value={activeClients}
          subtitle={t("of {{count}} total", { count: clients.length })}
          icon={Users}
          variant="success"
        />
        <StatCard
          title={t("Static IPs Used")}
          value={`${usedStaticIPs} / ${totalStaticIPs}`}
          icon={Globe}
        />
        <Card className="stat-card">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {t("Bandwidth Usage")}
              </p>
              <p className="text-2xl font-bold">{bandwidthUsage}%</p>
            </div>
            <div className="p-3 rounded-lg bg-accent/10">
              <Activity className="w-5 h-5 text-accent" />
            </div>
          </div>
          <Progress value={bandwidthUsage} className="mt-3 h-2" />
        </Card>
      </div>

      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">
            {t("Clients")} ({clients.length})
          </TabsTrigger>
          <TabsTrigger value="static-ips">
            {t("Static IPs")} ({totalStaticIPs})
          </TabsTrigger>
          <TabsTrigger value="bandwidth">{t("Bandwidth Stats")}</TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>{t("Active Clients")}</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={clientColumns}
                data={clients}
                emptyMessage={t("No clients in this POS")}
                onRowClick={(client) => navigate(`/clients/${client.id}`)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="static-ips">
          <Card>
            <CardHeader>
              <CardTitle>{t("Static IP Pool")}</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={staticIPColumns}
                data={staticIPs}
                emptyMessage={t("No static IPs configured")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bandwidth">
          <Card>
            <CardHeader>
              <CardTitle>{t("Bandwidth Statistics")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("Total Allocated")}
                    </p>
                    <p className="text-2xl font-bold">{allocated} Mbps</p>
                  </div>
                  <Wifi className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("Currently Used")}
                    </p>
                    <p className="text-2xl font-bold">{used} Mbps</p>
                  </div>
                  <Activity className="w-8 h-8 text-accent" />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("Available")}</p>
                    <p className="text-2xl font-bold">
                      {Math.max(allocated - used, 0)} Mbps
                    </p>
                  </div>
                  <Globe className="w-8 h-8 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
