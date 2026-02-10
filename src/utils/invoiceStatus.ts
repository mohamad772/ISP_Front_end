import { Invoice, InvoiceStatus } from "@/types/api.types";

export function getInvoiceStatus(invoice: Invoice): InvoiceStatus {
  const amount = Number(invoice.amount || 0);
  const totalPaid = Number(invoice.totalPaid || 0);

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
