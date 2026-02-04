export interface auditlogse {
  id: string;
  userId: string;
  userRole: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValues: null;
  newValues: null;
  ipAddress: string;
  userAgent: string;
  description: null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    email: string;
      role: string;
    posId: null;
    clientId: null;
  };
}