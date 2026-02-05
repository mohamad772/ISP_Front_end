import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ConnectionType, StaticIPStatus, UserRole } from "@/types/api.types";
import type { Client, ClientStatus } from "@/types/api.types";
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
import { useClients, useCreateClient, clientKeys } from "@/hooks/useclients";
import { usePOSList } from "@/hooks/usePos";
import { useStaticIPs } from "@/hooks/useStaticIp";
import { useQueryClient } from "@tanstack/react-query";

export function ClientsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [connectionTypeFilter, setConnectionTypeFilter] =
    useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [posFilter, setPosFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newClient, setNewClient] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    connectionType: ConnectionType.DYNAMIC,
    posId: "",
    staticIpId: "",
    pppoeUsername: "",
    pppoePassword: "",
  });

  const { data: clientsData, isLoading } = useClients({
    page: 1,
    limit: 1000,
  });

  const { data: posList = [] } = usePOSList();
  const posNameById = new Map(posList.map((pos) => [pos.id, pos.name]));
  const { data: staticIPs = [] } = useStaticIPs({
    posId: newClient.posId || undefined,
    status: StaticIPStatus.AVAILABLE,
  });
  const createClientMutation = useCreateClient();

  const clients = clientsData?.data || [];
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      !search ||
      client.fullName.toLowerCase().includes(search.toLowerCase()) ||
      client.email?.toLowerCase().includes(search.toLowerCase()) ||
      client.phone.includes(search);

    const matchesConnectionType =
      connectionTypeFilter === "all" ||
      client.connectionType === connectionTypeFilter;

    const matchesStatus =
      statusFilter === "all" || client.status === statusFilter;

    const matchesPOS = posFilter === "all" || client.posId === posFilter;

    return (
      matchesSearch && matchesConnectionType && matchesStatus && matchesPOS
    );
  });

  const handleCreateClient = async () => {
    try {
      if (
        newClient.connectionType === ConnectionType.STATIC &&
        !newClient.staticIpId
      ) {
        toast({
          title: "Static IP is required for STATIC connection type",
          variant: "destructive",
        });
        return;
      }
      if (
        newClient.connectionType === ConnectionType.PPPOE &&
        (!newClient.pppoeUsername.trim() || !newClient.pppoePassword.trim())
      ) {
        toast({
          title: "PPPoE username and password are required",
          variant: "destructive",
        });
        return;
      }
      const payload = {
        fullName: newClient.fullName,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address,
        connectionType: newClient.connectionType,
        posId: newClient.posId,
        staticIpId:
          newClient.connectionType === ConnectionType.STATIC
            ? newClient.staticIpId || undefined
            : undefined,
        pppoeUsername:
          newClient.connectionType === ConnectionType.PPPOE
            ? newClient.pppoeUsername || undefined
            : undefined,
        pppoePassword:
          newClient.connectionType === ConnectionType.PPPOE
            ? newClient.pppoePassword || undefined
            : undefined,
      };
      await createClientMutation.mutateAsync(payload);
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      toast({ title: "Client created successfully" });
      setIsDialogOpen(false);
      setNewClient({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        connectionType: ConnectionType.DYNAMIC,
        posId: "",
        staticIpId: "",
        pppoeUsername: "",
        pppoePassword: "",
      });
    } catch {
      toast({ title: "Failed to create client", variant: "destructive" });
    }
  };

  const columns = [
    {
      key: "fullName",
      header: "Client",
      render: (client: Client) => (
        <Link
          to={`/clients/${client.id}`}
          className="flex items-center gap-2 sm:gap-3 text-left w-full"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <UserCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm sm:text-base truncate">
              {client.fullName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {client.email || "No email"}
            </p>
          </div>
        </Link>
      ),
    },
    {
      key: "posName",
      header: "POS",
      render: (client: Client) => {
        const name =
          client.pos?.name || (client.posId ? posNameById.get(client.posId) : undefined);
        return <span className="text-sm sm:text-base">{name || "-"}</span>;
      },
    },
    {
      key: "connectionType",
      header: "Type",
      render: (client: Client) => (
        <span className="capitalize badge-info">
          {client.connectionType.toLowerCase().replace("_", " ")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (client: Client) => (
        <StatusBadge status={client.status.toLowerCase()} />
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Client Management"
        description="Manage client accounts and subscriptions"
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden xs:inline">Add Client</span>
                <span className="xs:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-2rem)] max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  Create New Client
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Full Name</Label>
                  <Input
                    value={newClient.fullName}
                    onChange={(e) =>
                      setNewClient({ ...newClient, fullName: e.target.value })
                    }
                    className="text-sm sm:text-base"
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Email</Label>
                  <Input
                    type="email"
                    value={newClient.email}
                    onChange={(e) =>
                      setNewClient({ ...newClient, email: e.target.value })
                    }
                    className="text-sm sm:text-base"
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Phone</Label>
                  <Input
                    value={newClient.phone}
                    onChange={(e) =>
                      setNewClient({ ...newClient, phone: e.target.value })
                    }
                    className="text-sm sm:text-base"
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Address</Label>
                  <Input
                    value={newClient.address}
                    onChange={(e) =>
                      setNewClient({ ...newClient, address: e.target.value })
                    }
                    className="text-sm sm:text-base"
                    placeholder="Enter address"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">POS Location</Label>
                  <Select
                    value={newClient.posId}
                    onValueChange={(v) =>
                      setNewClient({
                        ...newClient,
                        posId: v,
                        staticIpId:
                          newClient.connectionType === ConnectionType.STATIC
                            ? newClient.staticIpId
                            : "",
                      })
                    }
                  >
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Select POS" />
                    </SelectTrigger>
                    <SelectContent>
                      {posList.map((pos) => (
                        <SelectItem
                          key={pos.id}
                          value={pos.id}
                          className="text-sm sm:text-base"
                        >
                          {pos.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">
                    Connection Type
                  </Label>
                  <Select
                    value={newClient.connectionType}
                    onValueChange={(v) =>
                      setNewClient({
                        ...newClient,
                        connectionType: v as ConnectionType,
                        staticIpId:
                          v === ConnectionType.STATIC
                            ? newClient.staticIpId
                            : "",
                        pppoeUsername:
                          v === ConnectionType.PPPOE
                            ? newClient.pppoeUsername
                            : "",
                        pppoePassword:
                          v === ConnectionType.PPPOE
                            ? newClient.pppoePassword
                            : "",
                      })
                    }
                  >
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="DYNAMIC"
                        className="text-sm sm:text-base"
                      >
                        Dynamic IP
                      </SelectItem>
                      <SelectItem
                        value="STATIC"
                        className="text-sm sm:text-base"
                      >
                        Static IP
                      </SelectItem>
                      <SelectItem
                        value="PPPOE"
                        className="text-sm sm:text-base"
                      >
                        PPPoE
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newClient.connectionType === ConnectionType.STATIC && (
                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base">Static IP</Label>
                    <Select
                      value={newClient.staticIpId}
                      onValueChange={(v) =>
                        setNewClient({ ...newClient, staticIpId: v })
                      }
                      disabled={!newClient.posId}
                    >
                      <SelectTrigger className="text-sm sm:text-base">
                        <SelectValue
                          placeholder={
                            newClient.posId
                              ? "Select Static IP"
                              : "Select POS first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {staticIPs.length === 0 && (
                          <SelectItem
                            value="none"
                            disabled
                            className="text-sm sm:text-base"
                          >
                            No available static IPs
                          </SelectItem>
                        )}
                        {staticIPs.map((ip) => (
                          <SelectItem
                            key={ip.id}
                            value={ip.id}
                            className="text-sm sm:text-base"
                          >
                            {ip.ipAddress}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {newClient.connectionType === ConnectionType.PPPOE && (
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">
                        PPPoE Username
                      </Label>
                      <Input
                        value={newClient.pppoeUsername}
                        onChange={(e) =>
                          setNewClient({
                            ...newClient,
                            pppoeUsername: e.target.value,
                          })
                        }
                        className="text-sm sm:text-base"
                        placeholder="Enter username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">
                        PPPoE Password
                      </Label>
                      <Input
                        type="password"
                        value={newClient.pppoePassword}
                        onChange={(e) =>
                          setNewClient({
                            ...newClient,
                            pppoePassword: e.target.value,
                          })
                        }
                        className="text-sm sm:text-base"
                        placeholder="Enter password"
                      />
                    </div>
                  </div>
                )}
                <Button
                  className="w-full mt-2 text-sm sm:text-base"
                  onClick={handleCreateClient}
                  disabled={createClientMutation.isPending}
                >
                  {createClientMutation.isPending
                    ? "Creating..."
                    : "Create Client"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filters Section - Fully Responsive */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:flex-wrap lg:flex-nowrap gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-full sm:min-w-[200px] lg:min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 text-sm sm:text-base"
          />
        </div>

        {/* Filter Dropdowns - Stack on mobile, row on tablet+ */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:contents">
          <Select
            value={connectionTypeFilter}
            onValueChange={setConnectionTypeFilter}
          >
            <SelectTrigger className="w-full lg:w-40 text-sm sm:text-base">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-sm sm:text-base">
                All Types
              </SelectItem>
              <SelectItem value="DYNAMIC" className="text-sm sm:text-base">
                Dynamic
              </SelectItem>
              <SelectItem value="STATIC" className="text-sm sm:text-base">
                Static IP
              </SelectItem>
              <SelectItem value="PPPOE" className="text-sm sm:text-base">
                PPPoE
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-40 text-sm sm:text-base">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-sm sm:text-base">
                All Status
              </SelectItem>
              <SelectItem value="ACTIVE" className="text-sm sm:text-base">
                Active
              </SelectItem>
              <SelectItem value="SUSPENDED" className="text-sm sm:text-base">
                Suspended
              </SelectItem>
              <SelectItem value="TERMINATED" className="text-sm sm:text-base">
                Terminated
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={posFilter} onValueChange={setPosFilter}>
            <SelectTrigger className="w-full lg:w-40 text-sm sm:text-base xs:col-span-2 lg:col-span-1">
              <SelectValue placeholder="All POS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-sm sm:text-base">
                All POS
              </SelectItem>
              {posList.map((pos) => (
                <SelectItem
                  key={pos.id}
                  value={pos.id}
                  className="text-sm sm:text-base"
                >
                  {pos.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table - Responsive */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <DataTable
            columns={columns}
            data={filteredClients}
            isLoading={isLoading}
            emptyMessage="No clients found"
            onRowClick={(client) => navigate(`/clients/${client.id}`)}
          />
        </div>
      </div>
    </div>
  );
}
  
