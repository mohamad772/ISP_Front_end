import type { StaticIPPool, AuditLog, PPPoERequest } from '@/types';
import i18n from '@/i18n';

const mockIPPools: StaticIPPool[] = [
  { id: 'pool-1', posId: 'pos-1', posName: 'Downtown Branch', subnet: '192.168.1.0/24', totalIps: 50, availableIps: 15, assignedIps: 35 },
  { id: 'pool-2', posId: 'pos-2', posName: 'Uptown Center', subnet: '192.168.2.0/24', totalIps: 40, availableIps: 12, assignedIps: 28 },
  { id: 'pool-3', posId: 'pos-3', posName: 'Westside Hub', subnet: '192.168.3.0/24', totalIps: 30, availableIps: 8, assignedIps: 22 },
];

const mockAuditLogs: AuditLog[] = [
  { id: 'log-1', userId: '1', userName: 'System Administrator', action: 'CREATE', resource: 'client', resourceId: 'c-5', details: i18n.t('Created new client: Eva Martinez'), ipAddress: '192.168.1.100', timestamp: new Date().toISOString() },
  { id: 'log-2', userId: '2', userName: 'John Doe', action: 'UPDATE', resource: 'client', resourceId: 'c-3', details: i18n.t('Suspended client: Carol Davis'), ipAddress: '192.168.1.101', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'log-3', userId: '1', userName: 'System Administrator', action: 'UPDATE', resource: 'pos', resourceId: 'pos-1', details: i18n.t('Updated bandwidth allocation'), ipAddress: '192.168.1.100', timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: 'log-4', userId: '3', userName: 'Maria Smith', action: 'CREATE', resource: 'invoice', resourceId: 'inv-2', details: i18n.t('Generated invoice for Bob Williams'), ipAddress: '192.168.1.102', timestamp: new Date(Date.now() - 10800000).toISOString() },
];

const mockPPPoERequests: PPPoERequest[] = [
  { id: 'req-1', clientId: 'c-2', clientName: 'Bob Williams', requestType: 'password_reset', status: 'pending', createdAt: new Date().toISOString() },
  { id: 'req-2', clientId: 'c-5', clientName: 'Eva Martinez', requestType: 'credentials_regenerate', status: 'pending', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'req-3', clientId: 'c-2', clientName: 'Bob Williams', requestType: 'username_change', status: 'approved', createdAt: new Date(Date.now() - 172800000).toISOString(), processedAt: new Date(Date.now() - 86400000).toISOString(), processedBy: 'John Doe' },
];

export const networkApi = {
  // Static IP Pools
  getIPPools: async (posId?: string): Promise<StaticIPPool[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (posId) return mockIPPools.filter(p => p.posId === posId);
    return [...mockIPPools];
  },

  getBandwidthSummary: async (): Promise<{ total: number; allocated: number; available: number }> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { total: 10000, allocated: 2900, available: 7100 };
  },

  // Audit Logs
  getAuditLogs: async (filters?: { userId?: string; action?: string; resource?: string }): Promise<AuditLog[]> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    let result = [...mockAuditLogs];
    if (filters?.userId) result = result.filter(l => l.userId === filters.userId);
    if (filters?.action) result = result.filter(l => l.action === filters.action);
    if (filters?.resource) result = result.filter(l => l.resource === filters.resource);
    return result;
  },

  // PPPoE Requests
  getPPPoERequests: async (status?: string): Promise<PPPoERequest[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (status) return mockPPPoERequests.filter(r => r.status === status);
    return [...mockPPPoERequests];
  },

  approvePPPoERequest: async (id: string): Promise<PPPoERequest> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const req = mockPPPoERequests.find(r => r.id === id);
    if (!req) throw new Error(i18n.t('Request not found'));
    req.status = 'approved';
    req.processedAt = new Date().toISOString();
    return req;
  },
};
