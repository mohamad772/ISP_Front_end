import { useMemo } from "react";
import { usePOSList } from "@/hooks/usePos";
import { useStaticIPs } from "@/hooks/useStaticIp";
import type { StaticIPPool } from "@/types/api.types";

type UseStaticIPPoolsResult = {
  data: StaticIPPool[];
  isLoading: boolean;
};

const getSubnet = (ipAddress?: string) => {
  if (!ipAddress) return "N/A";
  const parts = ipAddress.split(".");
  if (parts.length < 3) return "N/A";
  return `${parts.slice(0, 3).join(".")}.0/24`;
};

export function useStaticIPPools(): UseStaticIPPoolsResult {
  const { data: staticIPs = [], isLoading: ipsLoading } = useStaticIPs();
  const { data: posList = [], isLoading: posLoading } = usePOSList();

  const pools = useMemo(() => {
    return posList
      .map((pos) => {
        const posIPs = staticIPs.filter((ip) => ip.posId === pos.id);
        const assignedIps = posIPs.filter(
          (ip) => ip.status === "ASSIGNED",
        ).length;
        const totalIps = posIPs.length;
        return {
          id: pos.id,
          posId: pos.id,
          posName: pos.name,
          subnet: getSubnet(posIPs[0]?.ipAddress),
          totalIps,
          assignedIps,
          availableIps: totalIps - assignedIps,
        };
      })
      .filter((pool) => pool.totalIps > 0);
  }, [posList, staticIPs]);

  return {
    data: pools,
    isLoading: ipsLoading || posLoading,
  };
}
