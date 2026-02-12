import { cn } from '@/lib/utils';
import { useTranslation } from "react-i18next";

type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "suspended"
  | "maintenance"
  | "paid"
  | "unpaid"
  | "overdue"
  | "cancelled"
  | "approved"
  | "rejected"
  | "expired"
  | "terminated";

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  active: { label: "Active", className: "badge-success" },
  inactive: { label: "Inactive", className: "badge-destructive" },
  pending: { label: "Pending", className: "badge-warning" },
  suspended: { label: "Suspended", className: "badge-destructive" },
  maintenance: { label: "Maintenance", className: "badge-warning" },
  paid: { label: "Paid", className: "badge-success" },
  unpaid: { label: "Unpaid", className: "badge-warning" },
  overdue: { label: "Overdue", className: "badge-destructive" },
  cancelled: { label: "Cancelled", className: "badge-destructive" },
  approved: { label: "Approved", className: "badge-success" },
  rejected: { label: "Rejected", className: "badge-destructive" },
  expired: { label: "Expired", className: "badge-destructive" },
  terminated: { label: "Terminated", className: "badge-destructive" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation();
  const normalizedStatus = String(status).toLowerCase() as StatusType;
  const config = statusConfig[normalizedStatus];
  const fallbackLabel = String(status)
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <span className={cn(config?.className ?? "badge-info", className)}>
      {t(config?.label ?? fallbackLabel, { defaultValue: fallbackLabel })}
    </span>
  );
}
