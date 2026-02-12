import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { POS } from "@/types/api.types";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import {
  Building2,
  CheckCircle2,
  Gauge,
  MapPin,
  Phone,
  Plus,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isValidPhone10, normalizePhone10 } from "@/utils/phone";
import { useTranslation } from "react-i18next";
import { useCreatePOS, usePOSList } from "@/hooks/usePos";

export function POSPage() {
  const { t } = useTranslation();
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
      toast({ title: t("All fields are required"), variant: "destructive" });
      return;
    }
    if (!isValidPhone10(newPOS.contactPhone)) {
      toast({
        title: "Contact phone must be 10 digits",
        variant: "destructive",
      });
      return;
    }
    if (!Number.isFinite(allocated) || allocated <= 0) {
      toast({
        title: t("Allocated bandwidth must be a positive number"),
        variant: "destructive",
      });
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
      toast({ title: t("POS created successfully") });
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
        : rawMessage || t("Failed to create POS");
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
      header: t("POS Name"),
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
      header: t("Contact"),
    },
    {
      key: "bandwidth",
      header: t("Bandwidth Usage"),
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
      header: t("Allocated"),
      render: (pos: POS) => `${pos.allocatedBandwidthMbps} Mbps`,
    },
    {
      key: "status",
      header: t("Status"),
      render: (pos: POS) => (
        <StatusBadge status={pos.isActive ? "active" : "inactive"} />
      ),
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
        title={t("POS Management")}
        description={t("Manage Points of Sale and their resources")}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Plus className="w-4 h-4 mr-2" />
                <span className="relative z-10">{t("Add POS")}</span>
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
                      {t("Create New POS")}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <Zap className="w-3 h-3" />
                      {t(
                        "Add a new point of sale with contact and bandwidth details",
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="relative z-10 p-6 sm:p-8 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      {t("POS Name")}
                    </Label>
                    <Input
                      value={newPOS.name}
                      onChange={(e) =>
                        setNewPOS({ ...newPOS, name: e.target.value })
                      }
                      className="text-sm sm:text-base"
                      placeholder={t("Enter POS name")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {t("Location")}
                    </Label>
                    <Input
                      value={newPOS.location}
                      onChange={(e) =>
                        setNewPOS({ ...newPOS, location: e.target.value })
                      }
                      className="text-sm sm:text-base"
                      placeholder={t("Enter location")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary" />
                      {t("Contact Phone")}
                    </Label>
                      <Input
                        value={newPOS.contactPhone}
                        onChange={(e) =>
                        setNewPOS({
                          ...newPOS,
                          contactPhone: normalizePhone10(e.target.value),
                        })
                        }
                        className="text-sm sm:text-base"
                        placeholder={t("Enter contact phone")}
                        inputMode="numeric"
                        maxLength={10}
                      />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-primary" />
                      {t("Allocated Bandwidth (Mbps)")}
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={newPOS.allocatedBandwidthMbps}
                      onChange={(e) =>
                        setNewPOS({
                          ...newPOS,
                          allocatedBandwidthMbps: e.target.value,
                        })
                      }
                      className="text-sm sm:text-base"
                      placeholder={t("e.g. 200")}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="relative glass-morphism p-6 border-t border-white/10">
                <Button
                  className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-2xl shadow-green-500/40 transition-all duration-300 hover:scale-[1.02] animate-glow relative overflow-hidden group"
                  onClick={handleCreatePOS}
                  disabled={isCreating}
                >
                  <div className="absolute inset-0 animate-shimmer" />
                  {isCreating ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2 relative z-10" />
                      <span className="relative z-10">
                        {t("Creating POS...")}
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2 relative z-10" />
                      <span className="relative z-10">{t("Create POS")}</span>
                      <Sparkles className="w-4 h-4 ml-2 relative z-10 group-hover:rotate-12 transition-transform" />
                    </>
                  )}
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
            placeholder={t("Search POS...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t("All Status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Status")}</SelectItem>
            <SelectItem value="active">{t("Active")}</SelectItem>
            <SelectItem value="inactive">{t("Inactive")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredPOSList}
        isLoading={isLoading}
        emptyMessage={t("No POS found")}
        onRowClick={(pos) => navigate(`/pos/${pos.id}`)}
      />
    </div>
  );
}
