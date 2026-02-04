export type UserRole = 'admin' | 'pos_manager' | 'viewer' | 'support';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  posId?: string;
  posName?: string;
  permissions: string[];
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  avatar?: string;
}

export interface POS {
  id: string;
  name: string;
  location: string;
  address: string;
  allocatedBandwidth: number;
  usedBandwidth: number;
  managerId: string;
  managerName: string;
  activeClients: number;
  totalClients: number;
  staticIpPool: number;
  usedStaticIps: number;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: string;
}

export type ClientType = 'static_ip' | 'dynamic' | 'pppoe';
export type ClientStatus = 'active' | 'suspended' | 'terminated' | 'pending';

export interface Client {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  type: ClientType;
  status: ClientStatus;
  posId: string;
  posName: string;
  staticIp?: string;
  pppoeUsername?: string;
  subscriptionId?: string;
  planName?: string;
  monthlyRate: number;
  balance: number;
  createdAt: string;
  lastPayment?: string;
}

export interface ServicePlan {
  id: string;
  name: string;
  description: string;
  bandwidth: number;
  price: number;
  isActive: boolean;
  features: string[];
}

export interface Subscription {
  id: string;
  clientId: string;
  clientName: string;
  planId: string;
  planName: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'expired' | 'cancelled';
  autoRenew: boolean;
}

export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'cancelled';
  dueDate: string;
  paidDate?: string;
  items: { description: string; amount: number }[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  clientId: string;
  clientName: string;
  amount: number;
  method: 'cash' | 'card' | 'bank_transfer' | 'mobile_money';
  date: string;
  reference: string;
}

export interface StaticIPPool {
  id: string;
  posId: string;
  posName: string;
  subnet: string;
  totalIps: number;
  availableIps: number;
  assignedIps: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface PPPoERequest {
  id: string;
  clientId: string;
  clientName: string;
  requestType: 'password_reset' | 'username_change' | 'credentials_regenerate';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
}

export interface DashboardStats {
  totalBandwidth: number;
  usedBandwidth: number;
  totalPOS: number;
  activePOS: number;
  totalClients: number;
  activeClients: number;
  monthlyRevenue: number;
  unpaidInvoices: number;
  recentAlerts: Alert[];
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
}
