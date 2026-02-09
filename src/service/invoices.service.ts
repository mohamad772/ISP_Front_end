import apiClient from "@/utils/apiClient";
import {
  Invoice,
  CreateInvoiceRequest,
  InvoiceFilters,
} from "@/types/api.types";

/**
 * Create a new invoice
 */
export async function createInvoice(
  data: CreateInvoiceRequest,
): Promise<Invoice> {
  const response = await apiClient.post("/invoices", data);
  return response.data;
}

/**
 * Get all invoices with filters
 */
export async function getAllInvoices(
  filters?: InvoiceFilters,
): Promise<Invoice[]> {
  const response = await apiClient.get("/invoices", { params: filters });
  return response.data;
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(id: string): Promise<Invoice> {
  const response = await apiClient.get(`/invoices/${id}`);
  return response.data;
}

/**
 * Cancel invoice
 */
export async function cancelInvoice(id: string): Promise<Invoice> {
  const response = await apiClient.patch(`/invoices/${id}/cancel`);
  return response.data;
}

/**
 * Export invoices to Excel
 */
export async function exportInvoicesExcel(
  filters?: InvoiceFilters,
): Promise<Blob> {
  const response = await apiClient.get("/invoices/export/excel", {
    params: filters,
    responseType: "blob",
  });
  return response.data;
}

/**
 * Export invoices to PDF
 */
export async function exportInvoicesPdf(
  filters?: InvoiceFilters,
): Promise<Blob> {
  const response = await apiClient.get("/invoices/export/pdf", {
    params: filters,
    responseType: "blob",
  });
  return response.data;
}
