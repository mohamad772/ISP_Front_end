import { getAllInvoices, getInvoiceById, createInvoice, cancelInvoice } from "@/service/invoices.service";
import { Invoice } from "@/types/api.types";
import { InvoiceFilters, CreateInvoiceRequest } from "@/types/api.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";

export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoiceKeys.all, "list"] as const,
  list: (filters?: InvoiceFilters) =>
    [...invoiceKeys.lists(), { filters }] as const,
  details: () => [...invoiceKeys.all, "detail"] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
};

export function useInvoices(
  filters?: InvoiceFilters,
): UseQueryResult<Invoice[], Error> {
  return useQuery({
    queryKey: invoiceKeys.list(filters),
    queryFn: () => getAllInvoices(filters),
    enabled: filters?.clientId !== undefined ? !!filters.clientId : true,
  });
}

export function useInvoice(id: string): UseQueryResult<Invoice, Error> {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => getInvoiceById(id),
    enabled: !!id,
  });
}

export function useCreateInvoice(): UseMutationResult<
  Invoice,
  Error,
  CreateInvoiceRequest
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

export function useCancelInvoice(): UseMutationResult<Invoice, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelInvoice,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
    },
  });
}
