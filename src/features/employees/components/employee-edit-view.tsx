"use client";

import { QueryErrorState } from "@/components/common/query-error-state";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeForm } from "@/features/employees/components/employee-form";
import { useEmployee } from "@/features/employees/hooks/use-employees";

export function EmployeeEditView({ employeeId }: { employeeId: string }) {
  const employee = useEmployee(employeeId);

  if (employee.isPending) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }
  if (employee.isError) {
    return (
      <Card className="py-0">
        <QueryErrorState error={employee.error} onRetry={() => void employee.refetch()} />
      </Card>
    );
  }
  // Keyed so the form re-initializes if another employee is opened.
  return <EmployeeForm key={employee.data.id} mode="edit" employee={employee.data} />;
}
