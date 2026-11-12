"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createAccount } from "@/features/accounts/services/account-service";
import type { DeactivateEmployeeValues, EmployeeFormValues } from "@/features/employees/schemas/employee-schema";
import {
  createEmployee,
  deactivateEmployee,
  getEmployee,
  getEmployeeAccount,
  listEmployeeOptions,
  listEmployees,
  listEmploymentStatuses,
  reactivateEmployee,
  updateEmployee,
} from "@/features/employees/services/employee-service";
import type { EmployeeListFilters } from "@/features/employees/types/employee";

const EMPLOYEE_ROLE_CODE = "employee";

export const employeeKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
  list: (filters: EmployeeListFilters) => [...employeeKeys.lists(), filters] as const,
  detail: (id: string) => [...employeeKeys.all, "detail", id] as const,
  account: (id: string) => [...employeeKeys.all, "account", id] as const,
  employmentStatuses: () => [...employeeKeys.all, "employment-statuses"] as const,
  options: () => [...employeeKeys.all, "options"] as const,
};

export function useEmployees(filters: EmployeeListFilters) {
  return useQuery({
    queryKey: employeeKeys.list(filters),
    queryFn: () => listEmployees(filters),
    placeholderData: keepPreviousData,
  });
}

export function useEmployee(id: string) {
  return useQuery({ queryKey: employeeKeys.detail(id), queryFn: () => getEmployee(id) });
}

export function useEmployeeAccount(id: string) {
  return useQuery({ queryKey: employeeKeys.account(id), queryFn: () => getEmployeeAccount(id) });
}

export function useEmploymentStatuses() {
  return useQuery({ queryKey: employeeKeys.employmentStatuses(), queryFn: listEmploymentStatuses, staleTime: 10 * 60_000 });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.lists() }),
  });
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: EmployeeFormValues) => updateEmployee(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: employeeKeys.detail(id) });
    },
  });
}

export function useChangeEmployeeStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (change: { reactivate: true } | { reactivate: false; values: DeactivateEmployeeValues }) =>
      change.reactivate ? reactivateEmployee(id) : deactivateEmployee(id, change.values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: employeeKeys.detail(id) });
    },
  });
}

/** Creates a sign-in account with the "Pegawai" role, linked to the employee. */
export function useCreateEmployeeAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, email, temporaryPassword }: { employeeId: string; email: string; temporaryPassword: string }) =>
      createAccount({ email, temporaryPassword, roleCode: EMPLOYEE_ROLE_CODE, employeeId }),
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: employeeKeys.account(variables.employeeId) }),
  });
}

export function useEmployeeOptions(enabled = true) {
  return useQuery({ queryKey: employeeKeys.options(), queryFn: listEmployeeOptions, enabled, staleTime: 60_000 });
}
