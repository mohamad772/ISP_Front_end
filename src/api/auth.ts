import type { User } from '@/types';

// Mock auth API - replace with real API calls
export const authApi = {
  login: async (username: string, password: string): Promise<{ user: User; token: string }> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock users for demo
    const mockUsers: Record<string, User> = {
      admin: {
        id: '1',
        username: 'admin',
        email: 'admin@isp.com',
        fullName: 'System Administrator',
        role: 'admin',
        permissions: ['all'],
        createdAt: '2024-01-01',
        lastLogin: new Date().toISOString(),
        isActive: true,
      },
      manager: {
        id: '2',
        username: 'manager',
        email: 'manager@isp.com',
        fullName: 'POS Manager',
        role: 'pos_manager',
        posId: 'pos-1',
        posName: 'Downtown Branch',
        permissions: ['clients.read', 'clients.write', 'billing.read'],
        createdAt: '2024-02-01',
        lastLogin: new Date().toISOString(),
        isActive: true,
      },
    };

    const user = mockUsers[username];
    if (user && password === 'password') {
      return {
        user,
        token: 'mock-jwt-token-' + Date.now(),
      };
    }

    throw new Error('Invalid credentials');
  },

  logout: async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (currentPassword !== 'password') {
      throw new Error('Current password is incorrect');
    }
  },

  getProfile: async (): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const stored = localStorage.getItem('isp-auth-storage');
    if (stored) {
      const { state } = JSON.parse(stored);
      return state.user;
    }
    throw new Error('Not authenticated');
  },
};
