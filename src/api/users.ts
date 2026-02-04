import type { User, UserRole } from '@/types';

const mockUsers: User[] = [
  { id: '1', username: 'admin', email: 'admin@isp.com', fullName: 'System Administrator', role: 'admin', permissions: ['all'], createdAt: '2024-01-01', lastLogin: '2024-03-15', isActive: true },
  { id: '2', username: 'jdoe', email: 'jdoe@isp.com', fullName: 'John Doe', role: 'pos_manager', posId: 'pos-1', posName: 'Downtown Branch', permissions: ['clients.read', 'clients.write'], createdAt: '2024-02-01', lastLogin: '2024-03-14', isActive: true },
  { id: '3', username: 'msmith', email: 'msmith@isp.com', fullName: 'Maria Smith', role: 'pos_manager', posId: 'pos-2', posName: 'Uptown Center', permissions: ['clients.read', 'clients.write'], createdAt: '2024-02-15', lastLogin: '2024-03-13', isActive: true },
  { id: '4', username: 'rjones', email: 'rjones@isp.com', fullName: 'Robert Jones', role: 'viewer', permissions: ['clients.read'], createdAt: '2024-03-01', isActive: true },
  { id: '5', username: 'support1', email: 'support1@isp.com', fullName: 'Support Agent', role: 'support', permissions: ['clients.read', 'tickets.write'], createdAt: '2024-03-05', lastLogin: '2024-03-15', isActive: false },
];

export const usersApi = {
  getAll: async (filters?: { role?: UserRole; posId?: string; search?: string }): Promise<User[]> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    let result = [...mockUsers];
    
    if (filters?.role) {
      result = result.filter(u => u.role === filters.role);
    }
    if (filters?.posId) {
      result = result.filter(u => u.posId === filters.posId);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(u => 
        u.fullName.toLowerCase().includes(search) || 
        u.email.toLowerCase().includes(search)
      );
    }
    
    return result;
  },

  getById: async (id: string): Promise<User | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return mockUsers.find(u => u.id === id);
  },

  create: async (data: Partial<User>): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const newUser: User = {
      id: Date.now().toString(),
      username: data.username || '',
      email: data.email || '',
      fullName: data.fullName || '',
      role: data.role || 'viewer',
      permissions: data.permissions || [],
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    mockUsers.push(newUser);
    return newUser;
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    mockUsers[index] = { ...mockUsers[index], ...data };
    return mockUsers[index];
  },

  delete: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const index = mockUsers.findIndex(u => u.id === id);
    if (index !== -1) mockUsers.splice(index, 1);
  },
};
