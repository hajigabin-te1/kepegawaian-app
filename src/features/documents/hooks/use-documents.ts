"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { DocumentFormValues } from "@/features/documents/schemas/document-schema";
import { deleteDocument, listDocuments, uploadDocument } from "@/features/documents/services/document-service";
import type { DocumentFilters } from "@/features/documents/types/documents";

export const documentKeys = {
  all: ["employee-documents"] as const,
  list: (filters: DocumentFilters) => [...documentKeys.all, "list", filters] as const,
};

export function useDocuments(filters: DocumentFilters) {
  return useQuery({ queryKey: documentKeys.list(filters), queryFn: () => listDocuments(filters), placeholderData: keepPreviousData });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ values, file }: { values: DocumentFormValues; file: File }) => uploadDocument(values, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  });
}
