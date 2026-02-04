import { getAllAuditLogs, getAuditLogById } from "@/service/audit-logs.service";
import { AuditLogFilters, AuditLog } from "@/types/api.types";
import { UseQueryResult, useQuery } from "@tanstack/react-query";

export const auditLogKeys = {
  all: ["auditLogs"] as const,
  lists: () => [...auditLogKeys.all, "list"] as const,
  list: (filters?: AuditLogFilters) =>
    [...auditLogKeys.lists(), { filters }] as const,
  details: () => [...auditLogKeys.all, "detail"] as const,
  detail: (id: string) => [...auditLogKeys.details(), id] as const,
};

export function useAuditLogs(
  filters?: AuditLogFilters,
): UseQueryResult<AuditLog[], Error> {
  return useQuery({
    queryKey: auditLogKeys.list(filters),
    queryFn: () => getAllAuditLogs(filters),
  });
}

export function useAuditLog(id: string): UseQueryResult<AuditLog, Error> {
  return useQuery({
    queryKey: auditLogKeys.detail(id),
    queryFn: () => getAuditLogById(id),
    enabled: !!id,
  });
}
