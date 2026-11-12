"use client";

import Link from "next/link";
import { UserXIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { EmployeeForm } from "@/features/employees/components/employee-form";
import { useEmployee } from "@/features/employees/hooks/use-employees";

/** Loads an employee and renders the edit form once the data is available. */
export function EmployeeEditor({ id }: { id: string }) {
  const employee = useEmployee(id);

  if (employee.isPending) return <Skeleton className="h-96 w-full" />;
  if (employee.isError) return <QueryErrorState error={employee.error} onRetry={() => void employee.refetch()} />;
  if (!employee.data) {
    return (
      <Card>
        <EmptyState
          icon={UserXIcon}
          title="Pegawai tidak ditemukan"
          description="Data tidak ada atau Anda tidak memiliki akses."
          action={
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href={routes.employees.list} />}>
              Kembali ke daftar
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title="Ubah Pegawai"
        description={employee.data.fullName}
        breadcrumbs={[
          { label: "Beranda", href: routes.dashboard },
          { label: "Data Pegawai", href: routes.employees.list },
          { label: employee.data.fullName, href: routes.employees.detail(id) },
          { label: "Ubah" },
        ]}
      />
      <EmployeeForm employee={employee.data} />
    </>
  );
}
