// ============================================
// Enums
// ============================================

export enum UserRole {
  WSP_ADMIN = "WSP_ADMIN",
  SUB_ADMIN = "SUB_ADMIN",
  POS_MANAGER = "POS_MANAGER",
  CLIENT = "CLIENT",
}

export enum ConnectionType {
  DYNAMIC = "DYNAMIC",
  STATIC = "STATIC",
  PPPOE = "PPPOE",
}

export enum ClientStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  TERMINATED = "TERMINATED",
}

export enum ServiceType {
  POSTPAID = "POSTPAID",
  PREPAID = "PREPAID",
}

export enum DurationType {
  HALF_MONTHLY = "HALF_MONTHLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  HALF_ANNUAL = "HALF_ANNUAL",
  ANNUAL = "ANNUAL",
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  TERMINATED = "TERMINATED",
}

export enum InvoiceStatus {
  UNPAID = "UNPAID",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
}

export enum PaymentMethod {
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  CARD = "CARD",
  ONLINE = "ONLINE",
}

export enum StaticIPStatus {
  AVAILABLE = "AVAILABLE",
  ASSIGNED = "ASSIGNED",
  RESERVED = "RESERVED",
}

export enum PPPoERequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
}

export enum SuspensionReason {
  NON_PAYMENT = "NON_PAYMENT",
  VIOLATION = "VIOLATION",
  MAINTENANCE = "MAINTENANCE",
  OTHER = "OTHER",
}

// ============================================
// Base Types
// ============================================

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Authentication Types
// ============================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

// ============================================
// User Types
// ============================================

export interface User extends BaseEntity {
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  posId?: string;
  capabilities?: string[];
  pos?: POS;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  posId?: string;
  clientId?: string;
  capabilities?: string[];
}

export interface UpdateUserRequest {
  email?: string;
  capabilities?: string[];
}

// ============================================
// POS Types
// ============================================

export interface POS extends BaseEntity {
  name: string;
  location: string;
  contactPhone: string;
  allocatedBandwidthMbps: number;
  usedBandwidthMbps: number;
  isActive: boolean;
}

export interface CreatePOSRequest {
  name: string;
  location: string;
  contactPhone: string;
  allocatedBandwidthMbps: number;
}

export interface UpdatePOSRequest {
  name?: string;
  location?: string;
  contactPhone?: string;
}

export interface UpdatePOSBandwidthRequest {
  allocatedBandwidthMbps: number;
}

export interface AssignManagerRequest {
  userId: string;
}

// ============================================
// Client Types
// ============================================

export interface Client extends BaseEntity {
  posId: string;
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  nationalId?: string;
  connectionType: ConnectionType;
  status: ClientStatus;
  autoRenewEnabled: boolean;
  staticIpId?: string;
  pppoeUsername?: string;
  pos?: POS;
  staticIp?: StaticIP;
}

export interface CreateClientRequest {
  posId: string;
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  nationalId?: string;
  connectionType: ConnectionType;
  staticIpId?: string;
  pppoeUsername?: string;
  pppoePassword?: string;
}

export interface UpdateClientRequest {
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  autoRenewEnabled?: boolean;
}

export interface SuspendClientRequest {
  reason: SuspensionReason;
  reasonDetails?: string;
}

export interface UpdateConnectionTypeRequest {
  connectionType: ConnectionType;
  staticIpId?: string;
  pppoeUsername?: string;
  pppoePassword?: string;
}

export interface AssignStaticIPRequest {
  staticIpId: string;
}

export interface PaginatedClients {
  data: Client[];
  total: number;
  page: number;
  limit: number;
}

// ============================================
// Service Plan Types
// ============================================

export interface ServicePlan extends BaseEntity {
  planName: string;
  description?: string;
  serviceType: ServiceType;
  durationType: DurationType;
  durationDays: number;
  cost: number;
  downloadSpeedMbps: number;
  uploadSpeedMbps: number;
  dataCapacityGb?: number;
  isActive: boolean;
}

export interface CreateServicePlanRequest {
  planName: string;
  description?: string;
  serviceType: ServiceType;
  durationType: DurationType;
  durationDays: number;
  cost: number;
  downloadSpeedMbps: number;
  uploadSpeedMbps: number;
  dataCapacityGb?: number;
}

export interface UpdateServicePlanRequest {
  planName?: string;
  description?: string;
  cost?: number;
  downloadSpeedMbps?: number;
  uploadSpeedMbps?: number;
  dataCapacityGb?: number;
  isActive?: boolean;
}

// ============================================
// Subscription Types
// ============================================

export interface Subscription extends BaseEntity {
  clientId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  isAutoRenewed: boolean;
  totalDataUsedMb: number;
  isThrottled: boolean;
  client?: Client;
  plan?: ServicePlan;
}

export interface CreateSubscriptionRequest {
  clientId: string;
  planId: string;
  startDate?: string;
  isAutoRenewed?: boolean;
}

export interface RenewSubscriptionRequest {
  renewalDate?: string;
  isAutoRenewed?: boolean;
}

export interface UpgradeSubscriptionRequest {
  newPlanId: string;
  effectiveDate?: string;
}

export interface UsageLog extends BaseEntity {
  subscriptionId: string;
  downloadMb: number;
  uploadMb: number;
  logDate: string;
}

export interface CreateUsageLogRequest {
  downloadMb: number;
  uploadMb: number;
  logDate?: string;
}

// ============================================
// Invoice Types
// ============================================

export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  clientId: string;
  subscriptionId?: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  notes?: string;
  calculatedStatus: InvoiceStatus;
  totalPaid: number;
  client?: Client;
  subscription?: Subscription;
  payments?: Payment[];
}

export interface CreateInvoiceRequest {
  clientId: string;
  subscriptionId?: string;
  amount: number;
  issueDate?: string;
  dueDate: string;
  notes?: string;
}

// ============================================
// Payment Types
// ============================================

export interface Payment extends BaseEntity {
  invoiceId: string;
  amountPaid: number;
  extraAmount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paymentDate: string;
  notes?: string;
  invoice?: Invoice;
}

export interface CreatePaymentRequest {
  invoiceId: string;
  amountPaid: number;
  extraAmount?: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  notes?: string;
}

// ============================================
// Static IP Types
// ============================================

export interface StaticIP extends BaseEntity {
  posId: string;
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  dnsPrimary?: string;
  dnsSecondary?: string;
  status: StaticIPStatus;
  assignedClientId?: string;
  pos?: POS;
  client?: Client;
}

export interface StaticIPPool {
  id: string;
  posId: string;
  posName: string;
  subnet: string;
  totalIps: number;
  assignedIps: number;
  availableIps: number;
}

export interface CreateStaticIPRequest {
  posId: string;
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  dnsPrimary?: string;
  dnsSecondary?: string;
}

export interface UpdateStaticIPRequest {
  subnetMask?: string;
  gateway?: string;
  dnsPrimary?: string;
  dnsSecondary?: string;
}

// ============================================
// PPPoE Request Types
// ============================================

export interface PPPoERequest extends BaseEntity {
  clientId: string;
  requestedByUserId: string;
  newUsername?: string;
  newPassword?: string;
  reason: string;
  status: PPPoERequestStatus;
  rejectionReason?: string;
  approvedByUserId?: string;
  approvedAt?: string;
  note?: string;
  technicianNote?: string;
  client?: Client;
  requestedBy?: User;
  approvedBy?: User;
}

export interface CreatePPPoERequestRequest {
  clientId: string;
  newUsername?: string;
  newPassword?: string;
  reason: string;
}

export interface ApprovePPPoERequestRequest {
  note?: string;
}

export interface RejectPPPoERequestRequest {
  rejectionReason: string;
  note?: string;
}

export interface CompletePPPoERequestRequest {
  technicianNote?: string;
}

// ============================================
// Suspension History Types
// ============================================

export interface SuspensionHistory extends BaseEntity {
  clientId: string;
  suspendedByUserId: string;
  suspensionReason: SuspensionReason;
  reasonDetails?: string;
  suspendedAt: string;
  reactivatedAt?: string;
  reactivatedByUserId?: string;
  client?: Client;
  suspendedBy?: User;
  reactivatedBy?: User;
}

// ============================================
// Audit Log Types
// ============================================

export interface AuditLog extends BaseEntity {
  userId: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId?: string;
  posId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  user?: User;
}

export interface AuditLogFilters {
  limit?: number;
  userId?: string;
  role?: UserRole;
  entityType?: string;
  entityId?: string;
  action?: string;
  posId?: string;
  fromDate?: string;
  toDate?: string;
  ipAddress?: string;
}

// ============================================
// Bandwidth Pool Types
// ============================================

export interface BandwidthPool {
  id: string;
  totalBandwidthMbps: number;
  allocatedBandwidthMbps: number;
  availableBandwidthMbps: number;
  updatedAt: string;
}

export interface UpdateBandwidthPoolRequest {
  totalBandwidthMbps: number;
}

// ============================================
// System Settings Types
// ============================================

export interface SystemSettings {
  enableMfa: boolean;
  sessionTimeoutMinutes: number;
  auditLoggingEnabled: boolean;
  emailAlertsEnabled: boolean;
  paymentRemindersEnabled: boolean;
  bandwidthWarningsEnabled: boolean;
  ipWhitelistingEnabled: boolean;
  passwordExpiryDays: number;
  systemVersion?: string;
  lastBackupAt?: string | null;
}

export type UpdateSystemSettingsRequest = Partial<SystemSettings>;

export interface SystemHealth {
  status?: string;
  dbStatus?: string;
  cacheStatus?: string;
  uptimeSeconds?: number;
  timestamp?: string;
  [key: string]: unknown;
}

export interface ActiveSession {
  id: string;
  userId: string;
  username?: string;
  ipAddress?: string;
  userAgent?: string;
  lastActiveAt?: string;
}

// ============================================
// Query Parameters Types
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ClientFilters extends PaginationParams {
  posId?: string;
  status?: ClientStatus;
  connectionType?: ConnectionType;
}

export interface POSFilters extends PaginationParams {
  isActive?: boolean;
  search?: string;
}

export interface ServicePlanFilters {
  isActive?: boolean;
  serviceType?: ServiceType;
}

export interface SubscriptionFilters {
  status?: SubscriptionStatus;
  clientId?: string;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  clientId?: string;
}

export interface UserFilters extends PaginationParams {
  role?: UserRole;
  isActive?: boolean;
  posId?: string;
  search?: string;
}

export interface PaymentFilters {
  paymentMethod?: PaymentMethod;
  invoiceId?: string;
}

export interface StaticIPFilters {
  posId?: string;
  status?: StaticIPStatus;
}

export interface PPPoERequestFilters {
  status?: PPPoERequestStatus;
  clientId?: string;
}

export interface SuspensionHistoryFilters {
  clientId?: string;
  suspensionReason?: SuspensionReason;
}

// ============================================
// Dashboard Stats Types
// ============================================

export interface DashboardAlert {
  id: string;
  type: "warning" | "error" | "info";
  message: string;
  timestamp: string;
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
  recentAlerts: DashboardAlert[];
}

export interface BandwidthHistoryPoint {
  date: string;
  usage: number;
}

export interface POSDashboardStats {
  allocatedBandwidth: number;
  usedBandwidth: number;
  activeClients: number;
  unpaidInvoices: number;
  bandwidthHistory: BandwidthHistoryPoint[];
}
