import type { POS } from '@/types';
import i18n from '@/i18n';

const mockPOS: POS[] = [
  { id: 'pos-1', name: 'Downtown Branch', location: 'Downtown', address: '123 Main St', allocatedBandwidth: 1000, usedBandwidth: 720, managerId: '2', managerName: 'John Doe', activeClients: 185, totalClients: 210, staticIpPool: 50, usedStaticIps: 35, status: 'active', createdAt: '2024-01-15' },
  { id: 'pos-2', name: 'Uptown Center', location: 'Uptown', address: '456 Oak Ave', allocatedBandwidth: 800, usedBandwidth: 550, managerId: '3', managerName: 'Maria Smith', activeClients: 142, totalClients: 160, staticIpPool: 40, usedStaticIps: 28, status: 'active', createdAt: '2024-01-20' },
  { id: 'pos-3', name: 'Westside Hub', location: 'West District', address: '789 Pine Rd', allocatedBandwidth: 600, usedBandwidth: 480, managerId: '4', managerName: 'Robert Jones', activeClients: 98, totalClients: 115, staticIpPool: 30, usedStaticIps: 22, status: 'active', createdAt: '2024-02-01' },
  { id: 'pos-4', name: 'Eastside Office', location: 'East District', address: '321 Elm Blvd', allocatedBandwidth: 500, usedBandwidth: 120, managerId: '2', managerName: 'John Doe', activeClients: 45, totalClients: 55, staticIpPool: 25, usedStaticIps: 10, status: 'maintenance', createdAt: '2024-02-15' },
];

export const posApi = {
  getAll: async (filters?: { status?: string; search?: string }): Promise<POS[]> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    let result = [...mockPOS];
    
    if (filters?.status) {
      result = result.filter(p => p.status === filters.status);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.location.toLowerCase().includes(search)
      );
    }
    
    return result;
  },

  getById: async (id: string): Promise<POS | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return mockPOS.find(p => p.id === id);
  },

  create: async (data: Partial<POS>): Promise<POS> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const newPOS: POS = {
      id: 'pos-' + Date.now(),
      name: data.name || '',
      location: data.location || '',
      address: data.address || '',
      allocatedBandwidth: data.allocatedBandwidth || 0,
      usedBandwidth: 0,
      managerId: data.managerId || '',
      managerName: data.managerName || '',
      activeClients: 0,
      totalClients: 0,
      staticIpPool: data.staticIpPool || 0,
      usedStaticIps: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    mockPOS.push(newPOS);
    return newPOS;
  },

  update: async (id: string, data: Partial<POS>): Promise<POS> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const index = mockPOS.findIndex(p => p.id === id);
    if (index === -1) throw new Error(i18n.t('POS not found'));
    mockPOS[index] = { ...mockPOS[index], ...data };
    return mockPOS[index];
  },

  updateBandwidth: async (id: string, bandwidth: number): Promise<POS> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const index = mockPOS.findIndex(p => p.id === id);
    if (index === -1) throw new Error(i18n.t('POS not found'));
    mockPOS[index].allocatedBandwidth = bandwidth;
    return mockPOS[index];
  },
};
