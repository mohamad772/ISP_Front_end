import { getAllPayments, getPaymentById, createPayment } from "@/service/Payments.service";
import { InvoiceStatus, Payment } from "@/types/api.types";
import type { Invoice } from "@/types/api.types";
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
      if (data.invoiceId) {
        const rawPaid =
          Number(data.amountPaid ?? 0) + Number(data.extraAmount ?? 0);
        const paidAmount = Number.isFinite(rawPaid) ? rawPaid : 0;

        // Optimistically update cached invoices so status flips to PAID immediately
        queryClient.setQueriesData<Invoice[]>(
          {
            predicate: (query) =>
              Array.isArray(query.queryKey) &&
              query.queryKey[0] === invoiceKeys.all[0],
          },
          (old) =>
            old?.map((inv) => {
              if (inv.id !== data.invoiceId) return inv;
              const currentPaid = Number(inv.totalPaid || 0);
              const amount = Number(inv.amount || 0);
              const updatedPaid = currentPaid + paidAmount;
              const updatedStatus =
                updatedPaid >= amount ? InvoiceStatus.PAID : inv.calculatedStatus;
              return {
                ...inv,
                totalPaid: updatedPaid,
                calculatedStatus: updatedStatus,
              };
            }),
        );

        queryClient.setQueryData<Invoice>(
          invoiceKeys.detail(data.invoiceId),
          (inv) => {
            if (!inv) return inv;
            const currentPaid = Number(inv.totalPaid || 0);
            const amount = Number(inv.amount || 0);
            const updatedPaid = currentPaid + paidAmount;
            const updatedStatus =
              updatedPaid >= amount ? InvoiceStatus.PAID : inv.calculatedStatus;
            return {
              ...inv,
              totalPaid: updatedPaid,
              calculatedStatus: updatedStatus,
            };
          },
        );
      }

      // Revalidate from server only when it can provide updated invoice totals
      const serverInvoice: Partial<Invoice> | undefined =
        (data as unknown as { invoice?: Partial<Invoice> }).invoice;
      const hasServerTotals =
        serverInvoice?.totalPaid !== undefined ||
        serverInvoice?.calculatedStatus !== undefined;
      if (hasServerTotals) {
        queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
        if (data.invoiceId) {
          queryClient.invalidateQueries({
            queryKey: invoiceKeys.detail(data.invoiceId),
          });
        }
      }
    },
  });
}
