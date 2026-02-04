import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientsApi } from "@/api/clients";
import type { Client, ClientType, ClientStatus } from "@/types";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, UserCircle } from "lucide-react";

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    type: "dynamic" as ClientType,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const data = await clientsApi.getAll({
        search: search || undefined,
        type: (typeFilter as ClientType) || undefined,
        status: (statusFilter as ClientStatus) || undefined,
      });
      setClients(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [search, typeFilter, statusFilter]);

  const handleCreateClient = async () => {
    try {
      await clientsApi.create(newClient);
      toast({ title: "Client created successfully" });
      setIsDialogOpen(false);
      setNewClient({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        type: "dynamic",
      });
      loadClients();
    } catch {
      toast({ title: "Failed to create client", variant: "destructive" });
    }
  };

  const columns = [
    {
      key: "fullName",
      header: "Client",
      render: (client: Client) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{client.fullName}</p>
            <p className="text-xs text-muted-foreground">{client.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (client: Client) => (
        <span className="capitalize badge-info">
          {client.type.replace("_", " ")}
        </span>
      ),
    },
    { key: "posName", header: "POS" },
    {
      key: "planName",
      header: "Plan",
      render: (c: Client) => c.planName || "-",
    },
    {
      key: "balance",
      header: "Balance",
      render: (client: Client) => (
        <span
          className={client.balance < 0 ? "text-destructive font-medium" : ""}
        >
          ${client.balance.toFixed(2)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (client: Client) => <StatusBadge status={client.status} />,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Client Management"
        description="Manage client accounts and subscriptions"
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Client</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={newClient.fullName}
                    onChange={(e) =>
                      setNewClient({ ...newClient, fullName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newClient.email}
                    onChange={(e) =>
                      setNewClient({ ...newClient, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={newClient.phone}
                    onChange={(e) =>
                      setNewClient({ ...newClient, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={newClient.address}
                    onChange={(e) =>
                      setNewClient({ ...newClient, address: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Connection Type</Label>
                  <Select
                    value={newClient.type}
                    onValueChange={(v) =>
                      setNewClient({ ...newClient, type: v as ClientType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dynamic">Dynamic IP</SelectItem>
                      <SelectItem value="static_ip">Static IP</SelectItem>
                      <SelectItem value="pppoe">PPPoE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleCreateClient}>
                  Create Client
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
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={undefined}>All Types</SelectItem>
            <SelectItem value="dynamic">Dynamic</SelectItem>
            <SelectItem value="static_ip">Static IP</SelectItem>
            <SelectItem value="pppoe">PPPoE</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={"undefined"}>All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={clients}
        isLoading={isLoading}
        emptyMessage="No clients found"
        onRowClick={(client) => navigate(`/clients/${client.id}`)}
      />
    </div>
  );
}
