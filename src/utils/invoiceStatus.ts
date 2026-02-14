import { Invoice, InvoiceStatus } from "@/types/api.types";

export function getInvoiceTotalPaid(invoice: Invoice): number {
  let totalPaid = Number(invoice.totalPaid || 0);
  if (totalPaid === 0 && invoice.payments && invoice.payments.length > 0) {
    totalPaid = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amountPaid || 0),
      0,
    );
  }
  return totalPaid;
}

export function getInvoiceStatus(invoice: Invoice): InvoiceStatus {
  // Check for explicit status from backend response
  if ((invoice as any).status === InvoiceStatus.PAID) {
    return InvoiceStatus.PAID;
  }

  const amount = Number(invoice.amount || 0);
  const totalPaid = getInvoiceTotalPaid(invoice);

  if (totalPaid >= amount) {
    return InvoiceStatus.PAID;
  }

  if (invoice.dueDate) {
    const due = new Date(invoice.dueDate);
    if (!Number.isNaN(due.getTime())) {
      const endOfDue = new Date(due);
      endOfDue.setHours(23, 59, 59, 999);
      if (new Date() > endOfDue) {
        return InvoiceStatus.OVERDUE;
      }
    }
  }

  return invoice.calculatedStatus || InvoiceStatus.UNPAID;
}

export function isInvoicePaid(invoice: Invoice): boolean {
  return getInvoiceStatus(invoice) === InvoiceStatus.PAID;
}
