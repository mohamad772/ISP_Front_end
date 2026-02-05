import { cn } from '@/lib/utils';

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
  const config = statusConfig[status as StatusType] || {
    label: status,
    className: "badge-info",
  };
  
  return (
    <span className={cn(config.className, className)}>
      {config.label}
    </span>
  );
}
