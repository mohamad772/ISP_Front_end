import type { Client, ClientType, ClientStatus } from '@/types';
import i18n from '@/i18n';

const mockClients: Client[] = [
  { id: 'c-1', fullName: 'Alice Johnson', email: 'alice@email.com', phone: '+1234567890', address: '100 First St', type: 'static_ip', status: 'active', posId: 'pos-1', posName: 'Downtown Branch', staticIp: '192.168.1.10', planName: 'Business Pro', monthlyRate: 150, balance: 0, createdAt: '2024-01-20' },
  { id: 'c-2', fullName: 'Bob Williams', email: 'bob@email.com', phone: '+1234567891', address: '200 Second Ave', type: 'pppoe', status: 'active', posId: 'pos-1', posName: 'Downtown Branch', pppoeUsername: 'bob.williams', planName: 'Home Basic', monthlyRate: 50, balance: -50, createdAt: '2024-02-01', lastPayment: '2024-02-15' },
  { id: 'c-3', fullName: 'Carol Davis', email: 'carol@email.com', phone: '+1234567892', address: '300 Third Blvd', type: 'dynamic', status: 'suspended', posId: 'pos-2', posName: 'Uptown Center', planName: 'Standard', monthlyRate: 75, balance: -150, createdAt: '2024-01-25' },
  { id: 'c-4', fullName: 'David Brown', email: 'david@email.com', phone: '+1234567893', address: '400 Fourth Rd', type: 'static_ip', status: 'active', posId: 'pos-2', posName: 'Uptown Center', staticIp: '192.168.2.20', planName: 'Enterprise', monthlyRate: 300, balance: 0, createdAt: '2024-02-10', lastPayment: '2024-03-10' },
  { id: 'c-5', fullName: 'Eva Martinez', email: 'eva@email.com', phone: '+1234567894', address: '500 Fifth Lane', type: 'pppoe', status: 'pending', posId: 'pos-3', posName: 'Westside Hub', pppoeUsername: 'eva.martinez', planName: 'Home Basic', monthlyRate: 50, balance: 0, createdAt: '2024-03-14' },
];

export const clientsApi = {
  getAll: async (filters?: { type?: ClientType; status?: ClientStatus; posId?: string; search?: string }): Promise<Client[]> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    let result = [...mockClients];
    
    if (filters?.type) result = result.filter(c => c.type === filters.type);
    if (filters?.status) result = result.filter(c => c.status === filters.status);
    if (filters?.posId) result = result.filter(c => c.posId === filters.posId);
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(c => 
        c.fullName.toLowerCase().includes(search) || 
        c.email.toLowerCase().includes(search) ||
        c.phone.includes(search)
      );
    }
    
    return result;
  },

  getById: async (id: string): Promise<Client | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return mockClients.find(c => c.id === id);
  },

  create: async (data: Partial<Client>): Promise<Client> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const newClient: Client = {
      id: 'c-' + Date.now(),
      fullName: data.fullName || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      type: data.type || 'dynamic',
      status: 'pending',
      posId: data.posId || '',
      posName: data.posName || '',
      staticIp: data.staticIp,
      pppoeUsername: data.pppoeUsername,
      planName: data.planName,
      monthlyRate: data.monthlyRate || 0,
      balance: 0,
      createdAt: new Date().toISOString(),
    };
    mockClients.push(newClient);
    return newClient;
  },

  update: async (id: string, data: Partial<Client>): Promise<Client> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const index = mockClients.findIndex(c => c.id === id);
    if (index === -1) throw new Error(i18n.t('Client not found'));
    mockClients[index] = { ...mockClients[index], ...data };
    return mockClients[index];
  },

  suspend: async (id: string): Promise<Client> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const index = mockClients.findIndex(c => c.id === id);
    if (index === -1) throw new Error(i18n.t('Client not found'));
    mockClients[index].status = 'suspended';
    return mockClients[index];
  },

  reactivate: async (id: string): Promise<Client> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const index = mockClients.findIndex(c => c.id === id);
    if (index === -1) throw new Error(i18n.t('Client not found'));
    mockClients[index].status = 'active';
    return mockClients[index];
  },

  delete: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const index = mockClients.findIndex(c => c.id === id);
    if (index !== -1) mockClients.splice(index, 1);
  },
};
