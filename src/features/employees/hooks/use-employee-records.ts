"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { employeeQueryKeys } from "@/features/employees/hooks/employee-query-keys";
import type { DocumentFormValues, HistoryFormValues } from "@/features/employees/schemas/history-schemas";
import { deleteDocument, listDocuments, uploadDocument } from "@/features/employees/services/document-service";
import { deleteHistory, listHistory, saveHistory } from "@/features/employees/services/history-service";
import type { EmployeeDocument } from "@/features/employees/types/documents";
import type { HistoryConfig } from "@/features/employees/types/histories";

const historyKey = (employeeId: string, type: string) => [...employeeQueryKeys.detail(employeeId), "history", type] as const;
const documentsKey = (employeeId: string) => [...employeeQueryKeys.detail(employeeId), "documents"] as const;

export function useHistory(config: HistoryConfig, employeeId: string) {
  return useQuery({ queryKey: historyKey(employeeId, config.type), queryFn: () => listHistory(config, employeeId) });
}

export function useSaveHistory(config: HistoryConfig, employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rowId, values }: { rowId: string | null; values: HistoryFormValues }) =>
      saveHistory(config, employeeId, rowId, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: historyKey(employeeId, config.type) }),
  });
}

export function useDeleteHistory(config: HistoryConfig, employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rowId: string) => deleteHistory(config, rowId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: historyKey(employeeId, config.type) }),
  });
}

export function useDocuments(employeeId: string) {
  return useQuery({ queryKey: documentsKey(employeeId), queryFn: () => listDocuments(employeeId) });
}

export function useUploadDocument(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, values }: { file: File; values: DocumentFormValues }) => uploadDocument(employeeId, file, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsKey(employeeId) }),
  });
}

export function useDeleteDocument(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (document: EmployeeDocument) => deleteDocument(document),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsKey(employeeId) }),
  });
}
