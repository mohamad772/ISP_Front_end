import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { posApi } from "@/api/pos";
import type { POS } from "@/types";
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
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Building2 } from "lucide-react";

export function POSPage() {
  const [posList, setPOSList] = useState<POS[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );
  const navigate = useNavigate();

  useEffect(() => {
    const loadPOS = async () => {
      setIsLoading(true);
      try {
        const data = await posApi.getAll({
          search: search || undefined,
          status: statusFilter || undefined,
        });
        setPOSList(data);
      } finally {
        setIsLoading(false);
      }
    };
    loadPOS();
  }, [search, statusFilter]);

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
    { key: "managerName", header: "Manager" },
    {
      key: "bandwidth",
      header: "Bandwidth Usage",
      render: (pos: POS) => {
        const usage = Math.round(
          (pos.usedBandwidth / pos.allocatedBandwidth) * 100
        );
        return (
          <div className="w-32">
            <div className="flex justify-between text-xs mb-1">
              <span>{pos.usedBandwidth} Mbps</span>
              <span className="text-muted-foreground">{usage}%</span>
            </div>
            <Progress value={usage} className="h-2" />
          </div>
        );
      },
    },
    {
      key: "clients",
      header: "Clients",
      render: (pos: POS) => `${pos.activeClients} / ${pos.totalClients}`,
    },
    {
      key: "staticIps",
      header: "Static IPs",
      render: (pos: POS) => `${pos.usedStaticIps} / ${pos.staticIpPool}`,
    },
    {
      key: "status",
      header: "Status",
      render: (pos: POS) => <StatusBadge status={pos.status} />,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="POS Management"
        description="Manage Points of Sale and their resources"
        actions={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add POS
          </Button>
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
            <SelectItem value={"undefined"}>All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={posList}
        isLoading={isLoading}
        emptyMessage="No POS found"
        onRowClick={(pos) => navigate(`/pos/${pos.id}`)}
      />
    </div>
  );
}
