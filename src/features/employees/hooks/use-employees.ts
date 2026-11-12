"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { employeeQueryKeys } from "@/features/employees/hooks/employee-query-keys";
import type { DeactivateFormValues, EmployeeFormValues } from "@/features/employees/schemas/employee-schemas";
import {
  createEmployee,
  deactivateEmployee,
  getEmployee,
  listEmployees,
  listEmploymentStatuses,
  reactivateEmployee,
  updateEmployee,
} from "@/features/employees/services/employee-service";
import type { EmployeeListFilters } from "@/features/employees/types/employees";

export function useEmployeeList(filters: EmployeeListFilters) {
  return useQuery({
    queryKey: employeeQueryKeys.list({ ...filters }),
    queryFn: () => listEmployees(filters),
    placeholderData: keepPreviousData,
  });
}

export function useEmployee(id: string) {
  return useQuery({ queryKey: employeeQueryKeys.detail(id), queryFn: () => getEmployee(id) });
}

export function useEmploymentStatuses() {
  return useQuery({ queryKey: [...employeeQueryKeys.all, "employment-statuses"], queryFn: listEmploymentStatuses, staleTime: 10 * 60_000 });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: EmployeeFormValues) => createEmployee(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all }),
  });
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: EmployeeFormValues) => updateEmployee(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all }),
  });
}

export function useSetEmployeeActive(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: DeactivateFormValues | null) => (values ? deactivateEmployee(id, values) : reactivateEmployee(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all }),
  });
}
