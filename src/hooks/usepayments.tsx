import { getAllPayments, getPaymentById, createPayment } from "@/service/Payments.service";
import { Payment } from "@/types/api.types";
import { PaymentFilters, CreatePaymentRequest } from "@/types/api.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import { invoiceKeys } from "./useInvoices";

export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  list: (filters?: PaymentFilters) =>
    [...paymentKeys.lists(), { filters }] as const,
  details: () => [...paymentKeys.all, "detail"] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
};

export function usePayments(
  filters?: PaymentFilters,
): UseQueryResult<Payment[], Error> {
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: () => getAllPayments(filters),
  });
}

export function usePayment(id: string): UseQueryResult<Payment, Error> {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => getPaymentById(id),
    enabled: !!id,
  });
}

export function useCreatePayment(): UseMutationResult<
  Payment,
  Error,
  CreatePaymentRequest
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPayment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      // Also invalidate invoice queries since payment affects invoice status
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      if (data.invoiceId) {
        queryClient.invalidateQueries({
          queryKey: invoiceKeys.detail(data.invoiceId),
        });
      }
    },
  });
}