export interface Invoice {
  id: string;
  clientId: string;
  subscriptionId: string | null;
  invoiceNumber: string;
  amount: string;
  issueDate: string;
  dueDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  status: "PAID" | "OVERDUE";
  client: Client;
  subscription: Subscription | null;
  payments: Payment[];
}

/* ===================== CLIENT ===================== */
export interface Client {
  id: string;
  posId: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  nationalId: string | null;
  connectionType: "STATIC" | "DYNAMIC" | "PPPOE";
  pppoeUsername: string | null;
  pppoePassword: string | null;
  status: "ACTIVE" | "SUSPENDED";
  accountBalance: string;
  autoRenewEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  pos: POS;
}

/* ===================== POS ===================== */
export interface POS {
  id: string;
  name: string;
  location: string;
}

/* ===================== SUBSCRIPTION ===================== */
export interface Subscription {
  id: string;
  clientId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "EXPIRED";
  isAutoRenewed: boolean;
  bandwidthAllocatedMbps: string;
  originalBandwidthMbps: string;
  upgradedToSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ===================== PAYMENT ===================== */
export interface Payment {
  id: string;
  invoiceId: string;
  paymentReference: string;
  amountPaid: string;
  extraAmount: string;
  paymentMethod: "CASH" | "CARD" | "BANK_TRANSFER" | "ONLINE";
  paymentDate: string;
  receivedBy: string;
  notes: string | null;
  createdAt: string;
}
