import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ConnectionType, StaticIPStatus } from "@/types/api.types";
import type { Client } from "@/types/api.types";
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
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  CheckCircle2,
  Mail,
  MapPin,
  Network,
  Phone,
  Plus,
  Search,
  Sparkles,
  UserCircle,
  Zap,
} from "lucide-react";
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
          client.pos?.name ||
          (client.posId ? posNameById.get(client.posId) : undefined);
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
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(var(--primary), 0.2); }
          50% { box-shadow: 0 0 40px rgba(var(--primary), 0.45); }
        }
        
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-float {
          animation: float linear infinite;
        }
        
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 4s ease infinite;
        }
        
        .delay-1000 { animation-delay: 1000ms; }
        .delay-2000 { animation-delay: 2000ms; }
        
        .glass-morphism {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--primary) / 0.3) transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, hsl(var(--primary) / 0.5), hsl(var(--primary) / 0.3));
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
      `}</style>

      <PageHeader
        title="Client Management"
        description="Manage client accounts and subscriptions"
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="group relative overflow-hidden w-full sm:w-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Plus className="w-4 h-4 mr-2" />
                <span className="relative z-10 hidden xs:inline">
                  Add Client
                </span>
                <span className="relative z-10 xs:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[720px] p-0 overflow-hidden border-2 border-primary/20">
              {/* Animated Background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/25 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 -right-32 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute -bottom-24 left-1/3 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl animate-pulse delay-2000" />
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-primary/40 rounded-full animate-float"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 5}s`,
                      animationDuration: `${6 + Math.random() * 10}s`,
                    }}
                  />
                ))}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
              </div>

              {/* Header */}
              <div className="relative glass-morphism p-8 pb-10 border-b border-white/10">
                <div className="relative z-10 flex items-start gap-5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl animate-pulse" />
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-2xl">
                      <Sparkles className="w-8 h-8 text-white animate-pulse" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      Create New Client
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <Zap className="w-3 h-3" />
                      Set up a new client profile and connection details
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="relative z-10 p-6 sm:p-8 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base flex items-center gap-2">
                      <UserCircle className="w-4 h-4 text-primary" />
                      Full Name
                    </Label>
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
                    <Label className="text-sm sm:text-base flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      Email
                    </Label>
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
                    <Label className="text-sm sm:text-base flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary" />
                      Phone
                    </Label>
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
                    <Label className="text-sm sm:text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Address
                    </Label>
                    <Input
                      value={newClient.address}
                      onChange={(e) =>
                        setNewClient({ ...newClient, address: e.target.value })
                      }
                      className="text-sm sm:text-base"
                      placeholder="Enter address"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-background to-background p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Building2 className="w-4 h-4 text-primary" />
                    POS and Connection
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        POS Location
                      </Label>
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
                        <SelectTrigger className="text-sm sm:text-base bg-background/60 border-primary/20 focus:ring-2 focus:ring-primary/30 transition-all">
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
                      {!newClient.posId && (
                        <p className="text-xs text-muted-foreground">
                          Choose the client’s nearest POS location.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base flex items-center gap-2">
                        <Network className="w-4 h-4 text-primary" />
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
                </div>
              </div>

              {/* Footer */}
              <div className="relative glass-morphism p-6 border-t border-white/10">
                <Button
                  className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-2xl shadow-green-500/40 transition-all duration-300 hover:scale-[1.02] animate-glow relative overflow-hidden group"
                  onClick={handleCreateClient}
                  disabled={createClientMutation.isPending}
                >
                  <div className="absolute inset-0 animate-shimmer" />
                  {createClientMutation.isPending ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2 relative z-10" />
                      <span className="relative z-10">Creating Client...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2 relative z-10" />
                      <span className="relative z-10">Create Client</span>
                      <Sparkles className="w-4 h-4 ml-2 relative z-10 group-hover:rotate-12 transition-transform" />
                    </>
                  )}
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
