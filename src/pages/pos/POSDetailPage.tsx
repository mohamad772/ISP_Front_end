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
import { ArrowLeft, Wifi, Users, Globe, Activity, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePOS, usePOSClients, useUpdatePOS, useUpdatePOSBandwidth } from "@/hooks/usePos";
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
    return <div>POS not found</div>;
  }

  const allocated = Number(pos.allocatedBandwidthMbps) || 0;
  const used = Number(pos.usedBandwidthMbps) || 0;
  const bandwidthUsage = allocated > 0 ? Math.round((used / allocated) * 100) : 0;

  const openEdit = () => {
    setEditForm({
      name: pos.name ?? "",
      location: pos.location ?? "",
      contactPhone: pos.contactPhone ?? "",
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
    if (!editForm.name.trim() || !editForm.location.trim() || !editForm.contactPhone.trim()) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(nextAllocated) || nextAllocated <= 0) {
      toast({ title: "Allocated bandwidth must be a positive number", variant: "destructive" });
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
      toast({ title: "POS updated successfully" });
      setIsEditOpen(false);
    } catch (error) {
      const rawMessage =
        (error as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage || "Failed to update POS";
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
      header: "Name",
      render: (c: Client) => c.fullName,
    },
    {
      key: "connectionType",
      header: "Type",
      render: (c: Client) => (
        <span className="capitalize">
          {c.connectionType.toLowerCase().replace("_", " ")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (c: Client) => <StatusBadge status={c.status.toLowerCase()} />,
    },
    {
      key: "phone",
      header: "Phone",
    },
  ];

  const staticIPColumns = [
    {
      key: "ipAddress",
      header: "IP Address",
      render: (ip: StaticIP) => (
        <code className="bg-muted px-2 py-0.5 rounded">{ip.ipAddress}</code>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (ip: StaticIP) => (
        <StatusBadge status={ip.status.toLowerCase()} />
      ),
    },
    {
      key: "client",
      header: "Assigned To",
      render: (ip: StaticIP) => ip.client?.fullName || "Available",
    },
    {
      key: "subnet",
      header: "Subnet",
      render: (ip: StaticIP) => ip.subnetMask,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={pos.name}
        description={`${pos.location} - ${pos.contactPhone}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/pos")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button onClick={openEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit POS
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit POS</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>POS Name</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={editForm.location}
                      onChange={(e) =>
                        setEditForm({ ...editForm, location: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input
                      value={editForm.contactPhone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, contactPhone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Allocated Bandwidth (Mbps)</Label>
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
                  <Button className="w-full" onClick={handleUpdatePOS} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Allocated Bandwidth"
          value={`${allocated} Mbps`}
          icon={Wifi}
          variant="accent"
        />
        <StatCard
          title="Active Clients"
          value={activeClients}
          subtitle={`of ${clients.length} total`}
          icon={Users}
          variant="success"
        />
        <StatCard
          title="Static IPs Used"
          value={`${usedStaticIPs} / ${totalStaticIPs}`}
          icon={Globe}
        />
        <Card className="stat-card">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Bandwidth Usage</p>
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
          <TabsTrigger value="clients">Clients ({clients.length})</TabsTrigger>
          <TabsTrigger value="static-ips">
            Static IPs ({totalStaticIPs})
          </TabsTrigger>
          <TabsTrigger value="bandwidth">Bandwidth Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Active Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={clientColumns}
                data={clients}
                emptyMessage="No clients in this POS"
                onRowClick={(client) => navigate(`/clients/${client.id}`)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="static-ips">
          <Card>
            <CardHeader>
              <CardTitle>Static IP Pool</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={staticIPColumns}
                data={staticIPs}
                emptyMessage="No static IPs configured"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bandwidth">
          <Card>
            <CardHeader>
              <CardTitle>Bandwidth Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Allocated
                    </p>
                    <p className="text-2xl font-bold">
                      {allocated} Mbps
                    </p>
                  </div>
                  <Wifi className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Currently Used
                    </p>
                    <p className="text-2xl font-bold">
                      {used} Mbps
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-accent" />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Available</p>
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
