import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { POS } from "@/types/api.types";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
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
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreatePOS, usePOSList } from "@/hooks/usePos";

export function POSPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPOS, setNewPOS] = useState({
    name: "",
    location: "",
    contactPhone: "",
    allocatedBandwidthMbps: "",
  });

  const { data: posList = [], isLoading } = usePOSList();
  const createPOSMutation = useCreatePOS();

  const handleCreatePOS = async () => {
    if (isCreating) {
      return;
    }
    const allocated = Number(newPOS.allocatedBandwidthMbps);
    if (!newPOS.name.trim() || !newPOS.location.trim() || !newPOS.contactPhone.trim()) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(allocated) || allocated <= 0) {
      toast({ title: "Allocated bandwidth must be a positive number", variant: "destructive" });
      return;
    }
    try {
      setIsCreating(true);
      await createPOSMutation.mutateAsync({
        name: newPOS.name.trim(),
        location: newPOS.location.trim(),
        contactPhone: newPOS.contactPhone.trim(),
        allocatedBandwidthMbps: allocated,
      });
      toast({ title: "POS created successfully" });
      setIsDialogOpen(false);
      setNewPOS({
        name: "",
        location: "",
        contactPhone: "",
        allocatedBandwidthMbps: "",
      });
    } catch (error) {
      const rawMessage =
        (error as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage || "Failed to create POS";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  // Filter POS list based on search and status
  const filteredPOSList = posList.filter((pos) => {
    const matchesSearch = search
      ? pos.name.toLowerCase().includes(search.toLowerCase()) ||
        pos.location.toLowerCase().includes(search.toLowerCase())
      : true;

    const matchesStatus =
      statusFilter === "all"
        ? true
        : (pos.isActive && statusFilter === "active") ||
          (!pos.isActive && statusFilter === "inactive");

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: "name",
      header: "POS Name",
      render: (pos: POS) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="font-medium">{pos.name}</p>
            <p className="text-xs text-muted-foreground">{pos.location}</p>
          </div>
        </div>
      ),
    },
    {
      key: "contactPhone",
      header: "Contact",
    },
    {
      key: "bandwidth",
      header: "Bandwidth Usage",
      render: (pos: POS) => {
        const allocated = Number(pos.allocatedBandwidthMbps) || 0;
        const used = Number(pos.usedBandwidthMbps) || 0;
        const usage =
          allocated > 0 ? Math.round((used / allocated) * 100) : 0;
        return (
          <div className="w-32">
            <div className="flex justify-between text-xs mb-1">
              <span>{used} Mbps</span>
              <span className="text-muted-foreground">{usage}%</span>
            </div>
            <Progress value={usage} className="h-2" />
          </div>
        );
      },
    },
    {
      key: "allocated",
      header: "Allocated",
      render: (pos: POS) => `${pos.allocatedBandwidthMbps} Mbps`,
    },
    {
      key: "status",
      header: "Status",
      render: (pos: POS) => (
        <StatusBadge status={pos.isActive ? "active" : "inactive"} />
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="POS Management"
        description="Manage Points of Sale and their resources"
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add POS
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New POS</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>POS Name</Label>
                  <Input
                    value={newPOS.name}
                    onChange={(e) => setNewPOS({ ...newPOS, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={newPOS.location}
                    onChange={(e) => setNewPOS({ ...newPOS, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    value={newPOS.contactPhone}
                    onChange={(e) =>
                      setNewPOS({ ...newPOS, contactPhone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Allocated Bandwidth (Mbps)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newPOS.allocatedBandwidthMbps}
                    onChange={(e) =>
                      setNewPOS({ ...newPOS, allocatedBandwidthMbps: e.target.value })
                    }
                  />
                </div>
                <Button className="w-full" onClick={handleCreatePOS} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create POS"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search POS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredPOSList}
        isLoading={isLoading}
        emptyMessage="No POS found"
        onRowClick={(pos) => navigate(`/pos/${pos.id}`)}
      />
    </div>
  );
}
