"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { HolidayFormValues, LeaveRequestFormValues } from "@/features/leave/schemas/leave-schemas";
import {
  cancelLeaveRequest,
  createHoliday,
  decideLeaveRequest,
  deleteHoliday,
  getLeaveBalance,
  listHolidays,
  listLeaveRecap,
  listLeaveRequests,
  listLeaveTypes,
  submitLeaveRequest,
} from "@/features/leave/services/leave-service";
import type { RequestStatus } from "@/features/profile-requests/types/profile-requests";

export const leaveKeys = {
  all: ["leave"] as const,
  types: () => [...leaveKeys.all, "types"] as const,
  balance: (employeeId: string, year: number) => [...leaveKeys.all, "balance", employeeId, year] as const,
  mine: (employeeId: string) => [...leaveKeys.all, "mine", employeeId] as const,
  list: (status: RequestStatus | "all") => [...leaveKeys.all, "list", status] as const,
  holidays: (from: string, to: string) => [...leaveKeys.all, "holidays", from, to] as const,
  recap: (year: number) => [...leaveKeys.all, "recap", year] as const,
};

export function useLeaveTypes() {
  return useQuery({ queryKey: leaveKeys.types(), queryFn: listLeaveTypes, staleTime: 10 * 60_000 });
}

export function useLeaveBalance(employeeId: string, year: number) {
  return useQuery({ queryKey: leaveKeys.balance(employeeId, year), queryFn: () => getLeaveBalance(employeeId, year) });
}

export function useHolidays(from: string, to: string, enabled = true) {
  return useQuery({ queryKey: leaveKeys.holidays(from, to), queryFn: () => listHolidays(from, to), enabled });
}

export function useMyLeaveRequests(employeeId: string) {
  return useQuery({ queryKey: leaveKeys.mine(employeeId), queryFn: () => listLeaveRequests({ employeeId }) });
}

export function useLeaveRequests(status: RequestStatus | "all") {
  return useQuery({ queryKey: leaveKeys.list(status), queryFn: () => listLeaveRequests({ status }) });
}

export function useLeaveRecap(year: number) {
  return useQuery({ queryKey: leaveKeys.recap(year), queryFn: () => listLeaveRecap(year) });
}

function useInvalidateLeave() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: leaveKeys.all });
}

export function useSubmitLeave(employeeId: string) {
  const invalidate = useInvalidateLeave();
  return useMutation({
    mutationFn: ({ values, file }: { values: LeaveRequestFormValues; file: File | null }) => submitLeaveRequest(employeeId, values, file),
    onSuccess: invalidate,
  });
}

export function useCancelLeave() {
  const invalidate = useInvalidateLeave();
  return useMutation({ mutationFn: (id: string) => cancelLeaveRequest(id), onSuccess: invalidate });
}

export function useDecideLeave() {
  const invalidate = useInvalidateLeave();
  return useMutation({
    mutationFn: ({ id, approve, note }: { id: string; approve: boolean; note: string }) => decideLeaveRequest(id, approve, note),
    onSuccess: invalidate,
  });
}

export function useCreateHoliday() {
  const invalidate = useInvalidateLeave();
  return useMutation({ mutationFn: (values: HolidayFormValues) => createHoliday(values), onSuccess: invalidate });
}

export function useDeleteHoliday() {
  const invalidate = useInvalidateLeave();
  return useMutation({ mutationFn: (date: string) => deleteHoliday(date), onSuccess: invalidate });
}
