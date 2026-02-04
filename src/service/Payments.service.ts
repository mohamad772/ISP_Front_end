import apiClient from "@/utils/apiClient";
import {
  Payment,
  CreatePaymentRequest,
  PaymentFilters,
} from "@/types/api.types";

/**
 * Create a new payment
 */
export async function createPayment(
  data: CreatePaymentRequest,
): Promise<Payment> {
  const response = await apiClient.post("/payments", data);
  return response.data;
}

/**
 * Get all payments with filters
 */
export async function getAllPayments(
  filters?: PaymentFilters,
): Promise<Payment[]> {
  const response = await apiClient.get("/payments", { params: filters });
  return response.data;
}

/**
 * Get payment by ID
 */
export async function getPaymentById(id: string): Promise<Payment> {
  const response = await apiClient.get(`/payments/${id}`);
  return response.data;
}
