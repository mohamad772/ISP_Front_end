import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
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
import { useToast } from "@/hooks/use-toast";
import { useUsers, useCreateUser } from "@/hooks/useUsers";
import { usePOSList } from "@/hooks/usePos";
import { UserRole } from "@/types/api.types";
import type { User } from "@/types/api.types";
import { Plus, Search, UserCircle } from "lucide-react";

const CAPABILITIES = [
  "POS_CREATE",
  "POS_READ",
  "POS_UPDATE",
  "POS_DELETE",
  "CLIENTS_CREATE",
  "CLIENTS_READ",
  "CLIENTS_UPDATE",
  "CLIENTS_ACTIVATE",
  "CLIENTS_SUSPEND",
  "CLIENTS_TERMINATE",
  "CLIENTS_CONNECTION_TYPE_UPDATE",
  "CLIENTS_STATIC_IP_ASSIGN",
  "CLIENTS_STATIC_IP_RELEASE",
  "SUBSCRIPTIONS_CREATE",
  "SUBSCRIPTIONS_READ",
  "SUBSCRIPTIONS_UPDATE",
  "SUBSCRIPTIONS_TERMINATE",
  "SUBSCRIPTIONS_RENEW",
  "SUBSCRIPTIONS_UPGRADE",
  "USAGE_LOGS_CREATE",
  "USAGE_LOGS_READ",
  "INVOICES_CREATE",
  "INVOICES_READ",
  "INVOICES_CANCEL",
  "PAYMENTS_CREATE",
  "PAYMENTS_READ",
  "SERVICE_PLANS_CREATE",
  "SERVICE_PLANS_READ",
  "SERVICE_PLANS_UPDATE",
  "SERVICE_PLANS_DELETE",
  "STATIC_IP_CREATE",
  "STATIC_IP_READ",
  "STATIC_IP_UPDATE",
  "STATIC_IP_DELETE",
  "BANDWIDTH_POOL_READ",
  "BANDWIDTH_POOL_UPDATE",
  "USERS_CREATE",
  "USERS_READ",
  "USERS_UPDATE",
  "USERS_ACTIVATE",
  "USERS_DEACTIVATE",
  "PPPOE_REQUESTS_CREATE",
  "PPPOE_REQUESTS_READ",
  "PPPOE_REQUESTS_APPROVE",
  "PPPOE_REQUESTS_REJECT",
  "AUDIT_LOGS_READ",
  "SUSPENSION_HISTORY_READ",
] as const;

export function UsersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: UserRole.WSP_ADMIN,
    posId: "",
    capabilities: [] as string[],
  });

  const { data: users = [], isLoading } = useUsers({
    search: search || undefined,
    role: roleFilter,
  });
  const { data: posList = [] } = usePOSList();
  const createUserMutation = useCreateUser();
  const posNameById = new Map(posList.map((pos) => [pos.id, pos.name]));

  // Filter users by search and role
  const filteredUsers = users.filter((user) => {
    if (user.role === UserRole.CLIENT) {
      return false;
    }
    const matchesSearch = search
      ? user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      : true;

    const matchesRole = roleFilter ? user.role === roleFilter : true;

    return matchesSearch && matchesRole;
  });

  const handleCreateUser = async () => {
    if (isCreating) {
      return;
    }
    try {
      setIsCreating(true);
      if (
        (newUser.role === UserRole.POS_MANAGER ||
          newUser.role === UserRole.CLIENT) &&
        !newUser.posId
      ) {
        toast({
          title: "POS is required for this role",
          variant: "destructive",
        });
        return;
      }
      if (newUser.role === UserRole.SUB_ADMIN && newUser.capabilities.length === 0) {
        toast({
          title: "Sub Admin must have at least one capability",
          variant: "destructive",
        });
        return;
      }
      const payload = {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        posId:
          newUser.role === UserRole.POS_MANAGER || newUser.role === UserRole.CLIENT
            ? newUser.posId || undefined
            : undefined,
        capabilities: newUser.capabilities.length > 0 ? newUser.capabilities : undefined,
      };
      await createUserMutation.mutateAsync(payload);
      toast({ title: "User created successfully" });
      setIsDialogOpen(false);
      setNewUser({
        username: "",
        email: "",
        password: "",
        role: UserRole.WSP_ADMIN,
        posId: "",
        capabilities: [],
      });
    } catch (error) {
      const rawMessage =
        (error as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage || "Failed to create user";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleCapability = (capability: string) => {
    if (newUser.capabilities.includes(capability)) {
      setNewUser({
        ...newUser,
        capabilities: newUser.capabilities.filter((c) => c !== capability),
      });
      return;
    }
    setNewUser({
      ...newUser,
      capabilities: [...newUser.capabilities, capability],
    });
  };

  const columns = [
    {
      key: "username",
      header: "User",
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{user.username}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      className: "w-40",
      render: (user: User) => (
        <span className="capitalize badge-info">
          {user.role.replace("_", " ").toLowerCase()}
        </span>
      ),
    },
    {
      key: "pos",
      header: "POS",
      render: (user: User) =>
        user.role === UserRole.POS_MANAGER
          ? user.pos?.name || (user.posId ? posNameById.get(user.posId) : undefined) || "-"
          : "-",
    },
    {
      key: "capabilities",
      header: "Capabilities",
      render: (user: User) => {
        if (user.role !== UserRole.SUB_ADMIN) {
          return "-";
        }
        if (!user.capabilities || user.capabilities.length === 0) {
          return "-";
        }
        const text = user.capabilities.join(", ");
        return (
          <span className="text-xs text-muted-foreground" title={text}>
            {text}
          </span>
        );
      },
    },
    {
      key: "isActive",
      header: "Status",
      render: (user: User) => (
        <StatusBadge status={user.isActive ? "active" : "inactive"} />
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (user: User) => new Date(user.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="User Management"
        description="Manage system users and their permissions"
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser({ ...newUser, username: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(v) =>
                      setNewUser({
                        ...newUser,
                        role: v as UserRole,
                        posId: v === "POS_MANAGER" ? newUser.posId : "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WSP_ADMIN">WSP Admin</SelectItem>
                      <SelectItem value="SUB_ADMIN">Sub Admin</SelectItem>
                      <SelectItem value="POS_MANAGER">POS Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(newUser.role === "POS_MANAGER" ||
                  newUser.role === "CLIENT") && (
                  <div className="space-y-2">
                    <Label>Assign POS</Label>
                    <Select
                      value={newUser.posId}
                      onValueChange={(v) =>
                        setNewUser({ ...newUser, posId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select POS" />
                      </SelectTrigger>
                      <SelectContent>
                        {posList.map((pos) => (
                          <SelectItem key={pos.id} value={pos.id}>
                            {pos.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {newUser.role === UserRole.SUB_ADMIN && (
                  <div className="space-y-2">
                    <Label>Capabilities</Label>
                    <div className="max-h-48 overflow-y-auto rounded-md border p-2 space-y-2">
                      {CAPABILITIES.map((cap) => {
                        const checked = newUser.capabilities.includes(cap);
                        return (
                          <label
                            key={cap}
                            className="flex items-center gap-2 text-sm cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCapability(cap)}
                            />
                            <span>{cap}</span>
                          </label>
                        );
                      })}
                    </div>
                    {newUser.capabilities.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {newUser.capabilities.map((cap) => (
                          <span key={cap} className="badge-info text-xs">
                            {cap}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <Button className="w-full" onClick={handleCreateUser} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create User"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={roleFilter ?? "all"}
          onValueChange={(v) =>
            setRoleFilter(v === "all" ? undefined : (v as UserRole))
          }
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="WSP_ADMIN">WSP Admin</SelectItem>
            <SelectItem value="SUB_ADMIN">Sub Admin</SelectItem>
            <SelectItem value="POS_MANAGER">POS Manager</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        isLoading={isLoading}
        emptyMessage="No users found"
        onRowClick={(user) => navigate(`/users/${user.id}`)}
      />
    </div>
  );
}
