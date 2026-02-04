import type { ServicePlan, Subscription, Invoice, Payment } from '@/types';

const mockPlans: ServicePlan[] = [
  { id: 'plan-1', name: 'Home Basic', description: 'Perfect for light home use', bandwidth: 25, price: 50, isActive: true, features: ['25 Mbps Download', '10 Mbps Upload', 'Email Support'] },
  { id: 'plan-2', name: 'Standard', description: 'Great for families', bandwidth: 50, price: 75, isActive: true, features: ['50 Mbps Download', '25 Mbps Upload', 'Priority Support', 'Free Router'] },
  { id: 'plan-3', name: 'Business Pro', description: 'For small businesses', bandwidth: 100, price: 150, isActive: true, features: ['100 Mbps Download', '50 Mbps Upload', '24/7 Support', 'Static IP', 'SLA Guarantee'] },
  { id: 'plan-4', name: 'Enterprise', description: 'Maximum performance', bandwidth: 500, price: 300, isActive: true, features: ['500 Mbps Download', '250 Mbps Upload', 'Dedicated Support', 'Multiple Static IPs', '99.9% SLA'] },
];

const mockSubscriptions: Subscription[] = [
  { id: 'sub-1', clientId: 'c-1', clientName: 'Alice Johnson', planId: 'plan-3', planName: 'Business Pro', startDate: '2024-01-20', status: 'active', autoRenew: true },
  { id: 'sub-2', clientId: 'c-2', clientName: 'Bob Williams', planId: 'plan-1', planName: 'Home Basic', startDate: '2024-02-01', status: 'active', autoRenew: true },
  { id: 'sub-3', clientId: 'c-3', clientName: 'Carol Davis', planId: 'plan-2', planName: 'Standard', startDate: '2024-01-25', status: 'active', autoRenew: false },
];

const mockInvoices: Invoice[] = [
  { id: 'inv-1', clientId: 'c-1', clientName: 'Alice Johnson', amount: 150, status: 'paid', dueDate: '2024-03-15', paidDate: '2024-03-10', items: [{ description: 'Business Pro - March 2024', amount: 150 }] },
  { id: 'inv-2', clientId: 'c-2', clientName: 'Bob Williams', amount: 50, status: 'unpaid', dueDate: '2024-03-20', items: [{ description: 'Home Basic - March 2024', amount: 50 }] },
  { id: 'inv-3', clientId: 'c-3', clientName: 'Carol Davis', amount: 150, status: 'overdue', dueDate: '2024-02-25', items: [{ description: 'Standard - Feb 2024', amount: 75 }, { description: 'Standard - Mar 2024', amount: 75 }] },
  { id: 'inv-4', clientId: 'c-4', clientName: 'David Brown', amount: 300, status: 'paid', dueDate: '2024-03-10', paidDate: '2024-03-10', items: [{ description: 'Enterprise - March 2024', amount: 300 }] },
];

const mockPayments: Payment[] = [
  { id: 'pay-1', invoiceId: 'inv-1', clientId: 'c-1', clientName: 'Alice Johnson', amount: 150, method: 'bank_transfer', date: '2024-03-10', reference: 'TRF-001' },
  { id: 'pay-2', invoiceId: 'inv-4', clientId: 'c-4', clientName: 'David Brown', amount: 300, method: 'card', date: '2024-03-10', reference: 'CRD-002' },
];

export const billingApi = {
  // Plans
  getPlans: async (): Promise<ServicePlan[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [...mockPlans];
  },
  getPlanById: async (id: string): Promise<ServicePlan | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockPlans.find(p => p.id === id);
  },

  // Subscriptions
  getSubscriptions: async (clientId?: string): Promise<Subscription[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (clientId) return mockSubscriptions.filter(s => s.clientId === clientId);
    return [...mockSubscriptions];
  },

  // Invoices
  getInvoices: async (filters?: { clientId?: string; status?: string }): Promise<Invoice[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    let result = [...mockInvoices];
    if (filters?.clientId) result = result.filter(i => i.clientId === filters.clientId);
    if (filters?.status) result = result.filter(i => i.status === filters.status);
    return result;
  },

  // Payments
  getPayments: async (clientId?: string): Promise<Payment[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (clientId) return mockPayments.filter(p => p.clientId === clientId);
    return [...mockPayments];
  },
};
