/**
 * Structured query keys for employee data.
 * List filter shape will be refined once the API contract is confirmed.
 */
export type EmployeeListFilters = Readonly<Record<string, string | number | undefined>>;

export const employeeQueryKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeQueryKeys.all, "list"] as const,
  list: (filters: EmployeeListFilters) => [...employeeQueryKeys.lists(), filters] as const,
  details: () => [...employeeQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...employeeQueryKeys.details(), id] as const,
};
