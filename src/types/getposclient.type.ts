export interface PosClient {
  id: string;
  posId: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  nationalId: string | null;
  connectionType: string;
  pppoeUsername: string | null;
  pppoePassword: string | null;
  status: string;
  accountBalance: string;
  autoRenewEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}
