import { useState, useEffect } from "react";
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
import {
  useUsers,
  useCreateUser,
  useDeactivateUser,
  useActivateUser,
} from "@/hooks/useUsers";
import { usePOSList } from "@/hooks/usePos";
import { UserRole } from "@/types/api.types";
import type { User } from "@/types/api.types";
import {
  Plus,
  Search,
  UserCircle,
  Shield,
  Mail,
  Lock,
  Building2,
  CheckCircle2,
  XCircle,
  Calendar,
  Sparkles,
  Zap,
  Award,
  TrendingUp,
} from "lucide-react";

const CAPABILITIES_BY_CATEGORY = {
  "Point of Sale": ["POS_CREATE", "POS_READ", "POS_UPDATE", "POS_DELETE"],
  "Client Management": [
    "CLIENTS_CREATE",
    "CLIENTS_READ",
    "CLIENTS_UPDATE",
    "CLIENTS_ACTIVATE",
    "CLIENTS_SUSPEND",
    "CLIENTS_TERMINATE",
    "CLIENTS_CONNECTION_TYPE_UPDATE",
    "CLIENTS_STATIC_IP_ASSIGN",
    "CLIENTS_STATIC_IP_RELEASE",
  ],
  Subscriptions: [
    "SUBSCRIPTIONS_CREATE",
    "SUBSCRIPTIONS_READ",
    "SUBSCRIPTIONS_UPDATE",
    "SUBSCRIPTIONS_TERMINATE",
    "SUBSCRIPTIONS_RENEW",
    "SUBSCRIPTIONS_UPGRADE",
  ],
  "Billing & Payments": [
    "INVOICES_CREATE",
    "INVOICES_READ",
    "INVOICES_CANCEL",
    "PAYMENTS_CREATE",
    "PAYMENTS_READ",
  ],
  "Service Plans": [
    "SERVICE_PLANS_CREATE",
    "SERVICE_PLANS_READ",
    "SERVICE_PLANS_UPDATE",
    "SERVICE_PLANS_DELETE",
  ],
  "Network & IP": [
    "STATIC_IP_CREATE",
    "STATIC_IP_READ",
    "STATIC_IP_UPDATE",
    "STATIC_IP_DELETE",
    "BANDWIDTH_POOL_READ",
    "BANDWIDTH_POOL_UPDATE",
  ],
  "User Management": [
    "USERS_CREATE",
    "USERS_READ",
    "USERS_UPDATE",
    "USERS_ACTIVATE",
    "USERS_DEACTIVATE",
  ],
  "PPPoE Requests": [
    "PPPOE_REQUESTS_CREATE",
    "PPPOE_REQUESTS_READ",
    "PPPOE_REQUESTS_APPROVE",
    "PPPOE_REQUESTS_REJECT",
  ],
  "Logs & Analytics": [
    "USAGE_LOGS_CREATE",
    "USAGE_LOGS_READ",
    "AUDIT_LOGS_READ",
    "SUSPENSION_HISTORY_READ",
  ],
} as const;

const CAPABILITIES = Object.values(CAPABILITIES_BY_CATEGORY).flat();

// Animated Background Component
const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/2 -right-32 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute -bottom-24 left-1/3 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-2000" />

      {/* Floating Particles */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-primary/40 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`,
          }}
        />
      ))}

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
    </div>
  );
};

// Success Animation Component
const SuccessAnimation = ({ show }: { show: boolean }) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="relative">
        <div className="w-32 h-32 rounded-full bg-green-500/20 animate-ping" />
        <CheckCircle2 className="absolute inset-0 m-auto w-16 h-16 text-green-500 animate-scale-in" />
      </div>
    </div>
  );
};

export function UsersPage() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formStep, setFormStep] = useState(0);
  const [capabilitySearch, setCapabilitySearch] = useState("");
  const [selectAll, setSelectAll] = useState(false);

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
  const deactivateUserMutation = useDeactivateUser();
  const activateUserMutation = useActivateUser();
  const posNameById = new Map(posList.map((pos) => [pos.id, pos.name]));

  // Reset form step when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setFormStep(0);
    }
  }, [isDialogOpen]);

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
      if (
        newUser.role === UserRole.SUB_ADMIN &&
        newUser.capabilities.length === 0
      ) {
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
          newUser.role === UserRole.POS_MANAGER ||
          newUser.role === UserRole.CLIENT
            ? newUser.posId || undefined
            : undefined,
        capabilities:
          newUser.capabilities.length > 0 ? newUser.capabilities : undefined,
      };
      await createUserMutation.mutateAsync(payload);

      // Show success animation
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
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
      }, 1500);
    } catch (error) {
      const rawMessage = (
        error as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data?.message;
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

  const toggleAllCapabilities = () => {
    if (selectAll) {
      setNewUser({ ...newUser, capabilities: [] });
      setSelectAll(false);
    } else {
      setNewUser({ ...newUser, capabilities: [...CAPABILITIES] });
      setSelectAll(true);
    }
  };

  const toggleCategoryCapabilities = (category: string) => {
    const categoryCapabilities =
      CAPABILITIES_BY_CATEGORY[
        category as keyof typeof CAPABILITIES_BY_CATEGORY
      ];
    const allSelected = categoryCapabilities.every((cap) =>
      newUser.capabilities.includes(cap),
    );

    if (allSelected) {
      setNewUser({
        ...newUser,
        capabilities: newUser.capabilities.filter(
          (c) => !(categoryCapabilities as readonly string[]).includes(c),
        ),
      });
    } else {
      const newCaps = [
        ...new Set([...newUser.capabilities, ...categoryCapabilities]),
      ] as string[];
      setNewUser({ ...newUser, capabilities: newCaps });
    }
  };

  // Filter capabilities by search
  const filteredCapabilitiesByCategory = Object.entries(
    CAPABILITIES_BY_CATEGORY,
  ).reduce(
    (acc, [category, caps]) => {
      const filtered = caps.filter((cap) =>
        cap.toLowerCase().includes(capabilitySearch.toLowerCase()),
      );
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    },
    {} as Record<string, readonly string[]>,
  );

  const openUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  const handleDeactivateUser = async () => {
    if (!selectedUser || !selectedUser.isActive) {
      return;
    }
    try {
      await deactivateUserMutation.mutateAsync(selectedUser.id);
      toast({ title: "User deactivated" });
      setIsDetailsOpen(false);
    } catch (error) {
      const rawMessage = (
        error as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage || "Failed to deactivate user";
      toast({ title: message, variant: "destructive" });
    }
  };

  const handleActivateUser = async () => {
    if (!selectedUser || selectedUser.isActive) {
      return;
    }
    try {
      await activateUserMutation.mutateAsync(selectedUser.id);
      toast({ title: "User activated" });
      setIsDetailsOpen(false);
    } catch (error) {
      const rawMessage = (
        error as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage || "Failed to activate user";
      toast({ title: message, variant: "destructive" });
    }
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
          ? user.pos?.name ||
            (user.posId ? posNameById.get(user.posId) : undefined) ||
            "-"
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
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
        }
        
        @keyframes scale-in {
          0% { transform: scale(0) rotate(-180deg); }
          50% { transform: scale(1.2) rotate(0deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(var(--primary), 0.3); }
          50% { box-shadow: 0 0 40px rgba(var(--primary), 0.6); }
        }
        
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .animate-float {
          animation: float linear infinite;
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.4s ease-out;
        }
        
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-1000 { animation-delay: 1000ms; }
        .delay-2000 { animation-delay: 2000ms; }
        
        .glass-morphism {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .step-indicator {
          transition: all 0.3s ease;
        }
        
        .step-indicator.active {
          transform: scale(1.2);
        }
        
        /* Custom Scrollbar Styles */
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
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, hsl(var(--primary) / 0.7), hsl(var(--primary) / 0.5));
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        
        /* Scrollbar glow effect */
        .scroll-glow::-webkit-scrollbar-thumb {
          box-shadow: 0 0 6px hsl(var(--primary) / 0.4);
        }
        
        /* Category header sticky effect */
        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 10;
          backdrop-filter: blur(12px);
          background: linear-gradient(135deg, hsl(var(--background) / 0.95), hsl(var(--background) / 0.85));
        }
        
        /* Smooth scroll behavior */
        .smooth-scroll {
          scroll-behavior: smooth;
        }
      `}</style>

      <PageHeader
        title="User Management"
        description="Manage system users and their permissions"
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Plus className="w-4 h-4 mr-2 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
                <span className="relative z-10">Add User</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-2 border-primary/20">
              <SuccessAnimation show={showSuccess} />

              {/* Animated Background */}
              <AnimatedBackground />

              {/* Header with Glassmorphism */}
              <div className="relative glass-morphism p-8 pb-10 border-b border-white/10">
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl animate-pulse" />
                        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-2xl">
                          <Sparkles className="w-8 h-8 text-white animate-pulse" />
                        </div>
                      </div>
                      <div>
                        <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                          Create New User
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                          <Zap className="w-3 h-3" />
                          Add a new team member with custom permissions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary animate-pulse" />
                      <span className="text-xs font-medium text-primary">
                        Pro
                      </span>
                    </div>
                  </div>

                  {/* Step Indicators */}
                  <div className="flex items-center gap-2">
                    {[0, 1, 2].map((step) => (
                      <div
                        key={step}
                        className={`step-indicator h-1.5 rounded-full transition-all duration-500 ${
                          step === formStep
                            ? "flex-1 bg-primary shadow-lg shadow-primary/50"
                            : step < formStep
                              ? "w-12 bg-primary/50"
                              : "w-12 bg-white/20"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Content with Scroll */}
              <div className="relative max-h-[55vh] overflow-y-auto p-8 space-y-6">
                {/* Step 0: Basic Info */}
                <div
                  className={`space-y-5 ${formStep === 0 ? "animate-slide-up" : "hidden"}`}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-2">
                      Basic Information
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Let's start with the essentials
                    </p>
                  </div>

                  {/* Username Field */}
                  <div className="space-y-2 group animate-slide-up">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <UserCircle className="w-4 h-4 text-primary" />
                      </div>
                      Username
                    </Label>
                    <Input
                      value={newUser.username}
                      onChange={(e) =>
                        setNewUser({ ...newUser, username: e.target.value })
                      }
                      className="h-12 border-2 focus:border-primary transition-all duration-300 hover:border-primary/50"
                      placeholder="johndoe"
                    />
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2 group animate-slide-up delay-100">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        <Mail className="w-4 h-4 text-blue-500" />
                      </div>
                      Email Address
                    </Label>
                    <Input
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      className="h-12 border-2 focus:border-blue-500 transition-all duration-300 hover:border-blue-500/50"
                      placeholder="john@example.com"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2 group animate-slide-up delay-200">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                        <Lock className="w-4 h-4 text-purple-500" />
                      </div>
                      Password
                    </Label>
                    <Input
                      type="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      className="h-12 border-2 focus:border-purple-500 transition-all duration-300 hover:border-purple-500/50"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Step 1: Role & Assignment */}
                <div
                  className={`space-y-5 ${formStep === 1 ? "animate-slide-up" : "hidden"}`}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-2">
                      Role & Assignment
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Define user role and access level
                    </p>
                  </div>

                  {/* Role Field */}
                  <div className="space-y-2 group animate-slide-up">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                        <Shield className="w-4 h-4 text-green-500" />
                      </div>
                      User Role
                    </Label>
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
                      <SelectTrigger className="h-12 border-2 focus:border-green-500 transition-all duration-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WSP_ADMIN">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            WSP Admin
                          </div>
                        </SelectItem>
                        <SelectItem value="SUB_ADMIN">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            Sub Admin
                          </div>
                        </SelectItem>
                        <SelectItem value="POS_MANAGER">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            POS Manager
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* POS Assignment */}
                  {(newUser.role === "POS_MANAGER" ||
                    newUser.role === "CLIENT") && (
                    <div className="space-y-2 group animate-slide-up delay-100">
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                          <Building2 className="w-4 h-4 text-orange-500" />
                        </div>
                        Assign Point of Sale
                      </Label>
                      <Select
                        value={newUser.posId}
                        onValueChange={(v) =>
                          setNewUser({ ...newUser, posId: v })
                        }
                      >
                        <SelectTrigger className="h-12 border-2 focus:border-orange-500 transition-all duration-300">
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
                </div>

                {/* Step 2: Capabilities */}
                {newUser.role === UserRole.SUB_ADMIN && (
                  <div
                    className={`space-y-5 ${formStep === 2 ? "animate-slide-up" : "hidden"}`}
                  >
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold mb-2">
                        Capabilities & Permissions
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Select permissions for this sub-admin
                      </p>
                      <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 animate-gradient">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">
                          {newUser.capabilities.length} of {CAPABILITIES.length}{" "}
                          selected
                        </span>
                      </div>
                    </div>

                    {/* Search and Select All Controls */}
                    <div className="space-y-3 animate-slide-up delay-100">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Search capabilities..."
                            value={capabilitySearch}
                            onChange={(e) =>
                              setCapabilitySearch(e.target.value)
                            }
                            className="pl-10 h-11 border-2 focus:border-primary/50 transition-all"
                          />
                        </div>
                        <Button
                          type="button"
                          variant={selectAll ? "default" : "outline"}
                          onClick={toggleAllCapabilities}
                          className="h-11 px-4 transition-all duration-300 hover:scale-105"
                        >
                          {selectAll ? (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Deselect All
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Select All
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Scrollable Capabilities Container */}
                    <div className="relative">
                      <div className="max-h-[350px] overflow-y-auto rounded-xl border-2 border-primary/20 bg-gradient-to-b from-muted/40 to-muted/20 custom-scrollbar scroll-glow smooth-scroll shadow-inner">
                        {Object.entries(filteredCapabilitiesByCategory)
                          .length === 0 ? (
                          <div className="p-8 text-center">
                            <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">
                              No capabilities found
                            </p>
                          </div>
                        ) : (
                          Object.entries(filteredCapabilitiesByCategory).map(
                            ([category, caps], categoryIndex) => {
                              const categorySelected = caps.every((cap) =>
                                newUser.capabilities.includes(cap),
                              );
                              const categoryPartial =
                                caps.some((cap) =>
                                  newUser.capabilities.includes(cap),
                                ) && !categorySelected;

                              return (
                                <div
                                  key={category}
                                  className="animate-slide-up"
                                  style={{
                                    animationDelay: `${categoryIndex * 50}ms`,
                                  }}
                                >
                                  {/* Sticky Category Header */}
                                  <div className="sticky-header px-4 py-3 border-b border-primary/10">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleCategoryCapabilities(category)
                                      }
                                      className="w-full flex items-center justify-between group hover:scale-[1.01] transition-transform"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={`relative w-5 h-5 rounded border-2 transition-all ${
                                            categorySelected
                                              ? "bg-primary border-primary"
                                              : categoryPartial
                                                ? "bg-primary/50 border-primary"
                                                : "border-muted-foreground/30"
                                          }`}
                                        >
                                          {categorySelected && (
                                            <CheckCircle2 className="absolute inset-0 w-5 h-5 text-white" />
                                          )}
                                          {categoryPartial &&
                                            !categorySelected && (
                                              <div className="absolute inset-0 m-auto w-2.5 h-2.5 bg-white rounded-sm" />
                                            )}
                                        </div>
                                        <span className="font-semibold text-sm flex items-center gap-2">
                                          {category}
                                          <span className="text-xs font-normal text-muted-foreground">
                                            (
                                            {
                                              caps.filter((cap) =>
                                                newUser.capabilities.includes(
                                                  cap,
                                                ),
                                              ).length
                                            }
                                            /{caps.length})
                                          </span>
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`w-2 h-2 rounded-full transition-all ${
                                            categorySelected
                                              ? "bg-green-500 shadow-lg shadow-green-500/50 animate-pulse"
                                              : categoryPartial
                                                ? "bg-yellow-500 shadow-lg shadow-yellow-500/50"
                                                : "bg-muted-foreground/30"
                                          }`}
                                        />
                                        <Shield className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                      </div>
                                    </button>
                                  </div>

                                  {/* Capability Items */}
                                  <div className="p-2 space-y-1">
                                    {caps.map((cap, index) => {
                                      const checked =
                                        newUser.capabilities.includes(cap);
                                      return (
                                        <label
                                          key={cap}
                                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] animate-slide-in-right ${
                                            checked
                                              ? "bg-gradient-to-r from-primary/20 via-primary/15 to-primary/10 border border-primary/30 shadow-md"
                                              : "bg-background/50 border border-transparent hover:border-primary/20 hover:bg-background/80"
                                          }`}
                                          style={{
                                            animationDelay: `${index * 30}ms`,
                                          }}
                                        >
                                          <div
                                            className={`relative w-4 h-4 rounded border-2 transition-all ${
                                              checked
                                                ? "bg-primary border-primary scale-110"
                                                : "border-muted-foreground/30"
                                            }`}
                                          >
                                            {checked && (
                                              <CheckCircle2 className="absolute inset-0 w-4 h-4 text-white animate-scale-in" />
                                            )}
                                          </div>
                                          <span
                                            className={`flex-1 text-xs transition-all ${
                                              checked
                                                ? "font-semibold text-primary"
                                                : "text-foreground"
                                            }`}
                                          >
                                            {cap}
                                          </span>
                                          {checked && (
                                            <div className="flex items-center gap-1">
                                              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                              <Sparkles className="w-3.5 h-3.5 text-primary/70" />
                                            </div>
                                          )}
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                              toggleCapability(cap)
                                            }
                                            className="sr-only"
                                          />
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            },
                          )
                        )}
                      </div>

                      {/* Scroll Indicators */}
                      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background to-transparent pointer-events-none" />
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                    </div>

                    {/* Selected Capabilities Summary */}
                    {newUser.capabilities.length > 0 && (
                      <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 animate-slide-up delay-200 shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            Selected Capabilities
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setNewUser({ ...newUser, capabilities: [] })
                            }
                            className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            Clear all
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                          {newUser.capabilities.map((cap, index) => (
                            <span
                              key={cap}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105 animate-bounce-in"
                              style={{ animationDelay: `${index * 30}ms` }}
                            >
                              <Sparkles className="w-3 h-3" />
                              {cap}
                              <button
                                type="button"
                                onClick={() => toggleCapability(cap)}
                                className="hover:bg-white/20 rounded-full p-0.5 transition-colors ml-1"
                              >
                                <XCircle className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="relative glass-morphism p-6 border-t border-white/10">
                <div className="flex gap-3">
                  {formStep > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setFormStep(formStep - 1)}
                      className="flex-1 h-12 border-2 hover:border-primary transition-all duration-300"
                    >
                      Previous
                    </Button>
                  )}

                  {/* Show Next button on step 0 */}
                  {formStep === 0 && (
                    <Button
                      onClick={() => setFormStep(1)}
                      className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-xl shadow-primary/30 transition-all duration-300 hover:scale-[1.02]"
                    >
                      Next Step
                      <TrendingUp className="w-4 h-4 ml-2" />
                    </Button>
                  )}

                  {/* Show Next button on step 1 only for Sub Admin (to go to capabilities) */}
                  {formStep === 1 && newUser.role === UserRole.SUB_ADMIN && (
                    <Button
                      onClick={() => setFormStep(2)}
                      className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-xl shadow-primary/30 transition-all duration-300 hover:scale-[1.02]"
                    >
                      Configure Capabilities
                      <Shield className="w-4 h-4 ml-2" />
                    </Button>
                  )}

                  {/* Show Create button on step 1 for non-Sub Admin roles */}
                  {formStep === 1 && newUser.role !== UserRole.SUB_ADMIN && (
                    <Button
                      className="flex-1 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-2xl shadow-green-500/40 transition-all duration-300 hover:scale-[1.02] animate-glow relative overflow-hidden group"
                      onClick={handleCreateUser}
                      disabled={isCreating}
                    >
                      <div className="absolute inset-0 animate-shimmer" />
                      {isCreating ? (
                        <>
                          <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          <span className="relative z-10">
                            Creating User...
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2 relative z-10" />
                          <span className="relative z-10">Create User</span>
                          <Sparkles className="w-4 h-4 ml-2 relative z-10 group-hover:rotate-12 transition-transform" />
                        </>
                      )}
                    </Button>
                  )}

                  {/* Show Create button on step 2 for Sub Admin */}
                  {formStep === 2 && newUser.role === UserRole.SUB_ADMIN && (
                    <Button
                      className="flex-1 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-2xl shadow-green-500/40 transition-all duration-300 hover:scale-[1.02] animate-glow relative overflow-hidden group"
                      onClick={handleCreateUser}
                      disabled={isCreating}
                    >
                      <div className="absolute inset-0 animate-shimmer" />
                      {isCreating ? (
                        <>
                          <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          <span className="relative z-10">
                            Creating User...
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2 relative z-10" />
                          <span className="relative z-10">Create User</span>
                          <Sparkles className="w-4 h-4 ml-2 relative z-10 group-hover:rotate-12 transition-transform" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
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
        onRowClick={openUserDetails}
      />

      {/* User Details Dialog - Advanced Version */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-2 border-primary/20">
          {selectedUser && (
            <>
              <AnimatedBackground />

              {/* Hero Header */}
              <div className="relative glass-morphism p-8 pb-12 border-b border-white/10">
                <div className="relative z-10">
                  <div className="flex items-start gap-6">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/40 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity animate-pulse" />
                      <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
                        <UserCircle className="w-14 h-14 text-white" />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center border-4 border-background shadow-lg">
                          {selectedUser.isActive ? (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          ) : (
                            <XCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <DialogTitle className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text">
                        {selectedUser.username}
                      </DialogTitle>
                      <p className="text-muted-foreground flex items-center gap-2 mb-3">
                        <Mail className="w-4 h-4" />
                        {selectedUser.email}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30">
                          <span className="text-sm font-medium text-primary capitalize">
                            {selectedUser.role.replace("_", " ").toLowerCase()}
                          </span>
                        </div>
                        <StatusBadge
                          status={selectedUser.isActive ? "active" : "inactive"}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Cards Grid */}
              <div className="p-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Created Date Card */}
                  <div className="group p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Calendar className="w-5 h-5 text-blue-500" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Created
                      </p>
                    </div>
                    <p className="text-lg font-bold">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Status Card */}
                  <div
                    className={`group p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                      selectedUser.isActive
                        ? "bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 hover:border-green-500/40 hover:shadow-green-500/10"
                        : "bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20 hover:border-red-500/40 hover:shadow-red-500/10"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                          selectedUser.isActive
                            ? "bg-green-500/20"
                            : "bg-red-500/20"
                        }`}
                      >
                        {selectedUser.isActive ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Status
                      </p>
                    </div>
                    <p className="text-lg font-bold">
                      {selectedUser.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>

                {/* POS Card */}
                {selectedUser.role === UserRole.POS_MANAGER && (
                  <div className="group p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-orange-500/10 animate-slide-up">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Building2 className="w-6 h-6 text-orange-500" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Point of Sale
                      </p>
                    </div>
                    <p className="text-xl font-bold">
                      {selectedUser.pos?.name ||
                        (selectedUser.posId
                          ? posNameById.get(selectedUser.posId)
                          : undefined) ||
                        "-"}
                    </p>
                  </div>
                )}

                {/* Capabilities Card */}
                {selectedUser.role === UserRole.SUB_ADMIN && (
                  <div className="group p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-purple-500/10 animate-slide-up">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Shield className="w-6 h-6 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          Capabilities
                        </p>
                        {selectedUser.capabilities &&
                          selectedUser.capabilities.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {selectedUser.capabilities.length} permissions
                              granted
                            </p>
                          )}
                      </div>
                    </div>
                    {selectedUser.capabilities &&
                    selectedUser.capabilities.length > 0 ? (
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {selectedUser.capabilities.map((cap, index) => (
                          <span
                            key={cap}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-medium border border-purple-500/30 animate-slide-in-right"
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            <Sparkles className="w-3 h-3" />
                            {cap}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No capabilities assigned
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 space-y-3">
                  {selectedUser.isActive ? (
                    <Button
                      variant="destructive"
                      className="w-full h-12 font-medium shadow-2xl shadow-destructive/30 hover:shadow-destructive/50 transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden"
                      onClick={handleDeactivateUser}
                      disabled={deactivateUserMutation.isPending}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {deactivateUserMutation.isPending ? (
                        <>
                          <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2 relative z-10" />
                          <span className="relative z-10">Deactivating...</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 mr-2 relative z-10" />
                          <span className="relative z-10">Deactivate User</span>
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="w-full h-12 font-medium bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-2xl shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden"
                      onClick={handleActivateUser}
                      disabled={activateUserMutation.isPending}
                    >
                      <div className="absolute inset-0 animate-shimmer" />
                      {activateUserMutation.isPending ? (
                        <>
                          <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2 relative z-10" />
                          <span className="relative z-10">Activating...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2 relative z-10" />
                          <span className="relative z-10">Activate User</span>
                          <Sparkles className="w-4 h-4 ml-2 relative z-10" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
