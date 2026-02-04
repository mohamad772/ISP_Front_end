export interface payments {
  id: string;
  invoiceId: string;
  paymentReference: string;
  amountPaid: string;
  extraAmount: string;
  paymentMethod: string;
  paymentDate: string;
  receivedBy: string;
  notes: string;
  createdAt: string;
  invoice: {
    id: string;
    clientId: string;
    subscriptionId: string;
    invoiceNumber: string;
    amount: string;
    issueDate: string;
    dueDate: string;
    notes: null;
    createdAt: string;
    updatedAt: string;
    client: {
      id: string;
      posId: string;
      fullName: string;
      phone: string;
      email: string;
      address: string;
      nationalId: null;
      connectionType: string;
      pppoeUsername: null;
      pppoePassword: null;
      status: string;
      accountBalance: string;
      autoRenewEnabled: true;
      createdAt: string;
      updatedAt: string;
      pos: {
        id: string;
        name: string;
        location: string;
      };
    };
  };
  receivedByUser: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}